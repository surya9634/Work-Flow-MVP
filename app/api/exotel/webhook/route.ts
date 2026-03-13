import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildExomlTurn, buildExomlFinal, buildExomlHangup } from "@/lib/services/exotel";
import { generateSpeechWithSarvam, translateText, getVoiceById } from "@/lib/services/sarvam";
import { VoiceRuntime } from "@/lib/services/voice-runtime";
import { getMemoryContext } from "@/lib/services/lead-memory";
import { runPostCallPipeline } from "@/lib/services/call-summarizer";
import { debitCallCredits } from "@/lib/services/credits";
import fs from "fs";
import path from "path";
import os from "os";

const MAX_TURNS = 12; // cap conversations at 12 turns (~6 min)
const AUDIO_DIR = () => {
    const d = path.join(os.tmpdir(), "exotel-audio");
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    return d;
};

function exomlResponse(xml: string) {
    return new NextResponse(xml, {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
}

/**
 * POST /api/exotel/webhook
 *
 * Main Exotel event handler. Receives call lifecycle events:
 *   - Initial answer (turn=0): play opening audio + record
 *   - Recording ready (event=recording): STT → LLM → TTS → play + record
 *   - Call status (event=status): update CallLog status
 *   - Call completed: trigger post-call pipeline
 */
export async function POST(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const callLogId = searchParams.get("callLogId") || "";
        const agentId   = searchParams.get("agentId")   || "";
        const leadId    = searchParams.get("leadId")     || "";
        const turnStr   = searchParams.get("turn")       || "0";
        const event     = searchParams.get("event")      || "";
        const turn      = parseInt(turnStr);

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";

        // ── STATUS UPDATE event ─────────────────────────────────
        if (event === "status") {
            const formData = await req.formData().catch(() => null);
            const status = formData?.get("Status") as string | null;
            if (callLogId && status) {
                await prisma.callLog.update({
                    where: { id: callLogId },
                    data: { status: status.toUpperCase() },
                }).catch(() => {});
            }

            // Handle call completion
            if (status === "completed" || status === "failed" || status === "busy" || status === "no-answer") {
                void runPostCallCleanup(callLogId, agentId, leadId);
            }

            return new NextResponse("OK", { status: 200 });
        }

        // ── TURN 0: Prospect answered — play opening audio ──────
        if (turn === 0 && event !== "recording") {
            // Update call log
            if (callLogId) {
                await prisma.callLog.update({
                    where: { id: callLogId },
                    data: { status: "IN_PROGRESS" },
                }).catch(() => {});
            }

            const audioUrl   = `${appUrl}/api/exotel/audio/${callLogId}_0.mp3`;
            const recordHook = `${appUrl}/api/exotel/webhook?callLogId=${callLogId}&agentId=${agentId}&leadId=${leadId}&turn=1&event=recording`;

            return exomlResponse(buildExomlTurn(audioUrl, recordHook));
        }

        // ── RECORDING event: process prospect's speech ──────────
        if (event === "recording") {
            const formData = await req.formData().catch(() => null);
            const recordingUrl = formData?.get("RecordingUrl") as string | null;

            if (!recordingUrl || !agentId || !callLogId) {
                console.error("[Exotel Webhook] Missing recording URL or IDs");
                return exomlResponse(buildExomlHangup());
            }

            if (turn >= MAX_TURNS) {
                const goodbyeText = "Thanks for your time today. I hope to speak with you again soon!";
                const byeAudio = await safeTTS(goodbyeText, callLogId, "bye");
                const byeUrl   = `${appUrl}/api/exotel/audio/${callLogId}_bye.mp3`;
                void runPostCallCleanup(callLogId, agentId, leadId);
                return exomlResponse(buildExomlFinal(byeUrl));
            }

            // 1. Download recording from Exotel
            let audioBuffer = Buffer.from("");
            try {
                const audioRes = await fetch(recordingUrl);
                if (audioRes.ok) {
                    audioBuffer = Buffer.from(await audioRes.arrayBuffer());
                }
            } catch (e) {
                console.error("[Exotel Webhook] Failed to download recording:", e);
            }

            // 2. Load agent context
            const agent = await prisma.agent.findUnique({ where: { id: agentId } }).catch(() => null);
            if (!agent) return exomlResponse(buildExomlHangup());

            const systemPrompt   = agent.systemPrompt || "You are a helpful AI sales agent.";
            const convTree       = agent.convTree ? JSON.parse(agent.convTree) : {};
            const voiceProfile   = agent.voiceProfile ? JSON.parse(agent.voiceProfile) : {};

            // 3. Load existing conversation from CallLog
            const callLog = await prisma.callLog.findUnique({ where: { id: callLogId } }).catch(() => null);
            const history: string[] = callLog?.transcript
                ? JSON.parse(callLog.transcript as string)
                : [];

            // 4. Inject lead memory
            const memoryCtx = leadId ? await getMemoryContext(leadId) : "";

            // 5. Run STT → LLM → TTS pipeline
            const session = VoiceRuntime.createSession(agentId, leadId || "unknown");
            session.transcript = history;
            session.status = "connected";

            const result = await VoiceRuntime.processTurn(
                session,
                audioBuffer,
                systemPrompt + memoryCtx,
                convTree,
                voiceProfile
            );

            if (!result.text) {
                // Empty response (hallucination filtered) — re-prompt with silence
                const silenceHook = `${appUrl}/api/exotel/webhook?callLogId=${callLogId}&agentId=${agentId}&leadId=${leadId}&turn=${turn}&event=recording`;
                const audioUrl    = `${appUrl}/api/exotel/audio/${callLogId}_${turn - 1}.mp3`;
                return exomlResponse(buildExomlTurn(audioUrl, silenceHook));
            }

            // 6. Save updated transcript to CallLog
            const updatedHistory = [
                ...history,
                ...(result.userText ? [`User: ${result.userText}`] : []),
                `Agent: ${result.text}`,
            ];
            await prisma.callLog.update({
                where: { id: callLogId },
                data: {
                    transcript: JSON.stringify(updatedHistory),
                    status: "IN_PROGRESS",
                },
            }).catch(() => {});

            // 7. Save TTS audio to tmp file
            const audioFileName = `${callLogId}_${turn}.mp3`;
            const audioFilePath = path.join(AUDIO_DIR(), audioFileName);
            fs.writeFileSync(audioFilePath, result.audio);

            // 8. Check if we should end the call
            const shouldEnd = result.intent === "negative" && turn >= 3;
            const audioUrl  = `${appUrl}/api/exotel/audio/${audioFileName}`;

            if (shouldEnd) {
                void runPostCallCleanup(callLogId, agentId, leadId);
                return exomlResponse(buildExomlFinal(audioUrl));
            }

            // 9. Continue to next turn
            const nextTurn   = turn + 1;
            const recordHook = `${appUrl}/api/exotel/webhook?callLogId=${callLogId}&agentId=${agentId}&leadId=${leadId}&turn=${nextTurn}&event=recording`;
            return exomlResponse(buildExomlTurn(audioUrl, recordHook));
        }

        // Fallback
        return exomlResponse(buildExomlHangup());

    } catch (error) {
        console.error("[Exotel Webhook] Unhandled error:", error);
        return exomlResponse(buildExomlHangup());
    }
}

// Exotel also sends GET for some events
export { POST as GET };

/**
 * Generate TTS + save to temp file. Returns base64 audio.
 */
async function safeTTS(text: string, callLogId: string, suffix: string, voiceId = "priya-hi"): Promise<string> {
    try {
        const voice = getVoiceById(voiceId);
        const targetLang = voice.language;
        const translatedText = targetLang === "en-IN" ? text : await translateText(text, targetLang);
        const audioBuffer = await generateSpeechWithSarvam(translatedText, voiceId);
        const fp = path.join(AUDIO_DIR(), `${callLogId}_${suffix}.mp3`);
        fs.writeFileSync(fp, audioBuffer);
        return audioBuffer.toString("base64");
    } catch {
        return "";
    }
}

/**
 * Async post-call cleanup: summary, memory, objections, credit debit.
 * Fire-and-forget — never awaited in the hot path.
 */
async function runPostCallCleanup(callLogId: string, agentId: string, leadId: string): Promise<void> {
    try {
        if (!callLogId) return;
        const callLog = await prisma.callLog.findUnique({ where: { id: callLogId } });
        if (!callLog) return;

        const transcript: string[] = callLog.transcript ? JSON.parse(callLog.transcript as string) : [];
        const durationSec = callLog.duration ?? Math.max(60, transcript.length * 15);

        await Promise.all([
            runPostCallPipeline(callLogId, transcript.join("\n"), agentId, leadId || null),
            debitCallCredits(
                callLog.leadId ? (await prisma.lead.findUnique({ where: { id: callLog.leadId ?? "" }, select: { userId: true } }))?.userId || "" : "",
                durationSec,
                callLogId
            ),
            prisma.callLog.update({
                where: { id: callLogId },
                data: { status: "COMPLETED", duration: durationSec },
            }),
        ]);

        // Clean up tmp audio files for this call
        const dir = AUDIO_DIR();
        const files = fs.readdirSync(dir).filter(f => f.startsWith(callLogId));
        for (const f of files) fs.unlink(path.join(dir, f), () => {});
    } catch (e) {
        console.error("[Exotel Cleanup] Error:", e);
    }
}
