import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"
import { processAudioWithDeepgram } from "@/lib/services/deepgram"
import { generateSpeechWithSarvam, translateText, getVoiceById, getSarvamVoices } from "@/lib/services/sarvam"
import { getMemoryContext } from "@/lib/services/lead-memory"
import { runPostCallPipeline } from "@/lib/services/call-summarizer"
import { debitCallCredits } from "@/lib/services/credits"

import { groq } from "@/lib/groq"

const DEFAULT_VOICE_ID = "priya-hi";

/**
 * GET /api/sandbox/voice
 * Returns list of available Sarvam voices for the UI dropdown.
 */
export async function GET() {
    try {
        await requireAuth();
        return NextResponse.json({ voices: getSarvamVoices() });
    } catch (error) {
        if (error instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Failed to load voices" }, { status: 500 });
    }
}

/**
 * POST /api/sandbox/voice
 * Voice sandbox — STT→LLM→TTS returning JSON with base64 audio.
 * Uses Sarvam AI for TTS across all Indian languages.
 */
export async function POST(req: Request) {
    try {
        const userId = await requireAuth()

        const formData = await req.formData()
        const audioFile = formData.get("audio") as File | null
        const agentId = formData.get("agentId") as string | null
        const requestVoiceId = formData.get("voiceId") as string | null
        const historyStr = (formData.get("conversationHistory") as string) || "[]"
        const leadId = formData.get("leadId") as string | null
        const isLastTurn = formData.get("isLastTurn") === "true"

        if (!audioFile) {
            return NextResponse.json({ error: "Audio file is required" }, { status: 400 })
        }

        // ── 1. Load agent config & voice selection ──────────────
        let systemPrompt = "You are a helpful AI sales agent in a live voice test. Keep responses short, natural, and conversational — 1-3 sentences max."
        let agentName = "Agent"
        let selectedVoiceId = requestVoiceId || DEFAULT_VOICE_ID
        let llmModel = "llama-3.1-8b-instant"

        if (agentId) {
            const agent = await prisma.agent.findFirst({ where: { id: agentId, userId } })
            if (agent) {
                systemPrompt = agent.systemPrompt || systemPrompt
                agentName = agent.name
                if (agent.llmModel) llmModel = agent.llmModel

                if (!requestVoiceId && agent.voiceProfile) {
                    try {
                        const profile = JSON.parse(agent.voiceProfile)
                        if (profile.voiceId) selectedVoiceId = profile.voiceId
                    } catch (e) { }
                }
            }
        }

        console.log(`[Sandbox Voice] Using Sarvam voice: ${selectedVoiceId} for agent: ${agentName}`)

        // ── 2. STT via Deepgram Nova-2 ──────────────────────────
        const audioBuffer = Buffer.from(await audioFile.arrayBuffer())

        let userTranscript = ""
        try {
            userTranscript = await processAudioWithDeepgram(audioBuffer)
            userTranscript = userTranscript.trim()
        } catch (sttErr) {
            console.error("[Sandbox Voice] STT error:", sttErr)
            return NextResponse.json({ error: "Speech recognition failed." }, { status: 500 })
        }

        if (!userTranscript) {
            return NextResponse.json({
                userTranscript: "",
                response: "I didn't catch that. Could you say that again?",
                audioBase64: null,
            })
        }

        // ── 3. Inject lead memory (if lead known) ──────────────
        let memoryContext = ""
        if (leadId) {
            memoryContext = await getMemoryContext(leadId)
        }
        const systemPromptWithMemory = systemPrompt + memoryContext

        // ── 4. LLM via Groq ─────────────────────────────────────
        const history: string[] = JSON.parse(historyStr)
        const conversationMessages: { role: "user" | "assistant"; content: string }[] = []
        for (const line of history) {
            if (line.startsWith("User: ")) conversationMessages.push({ role: "user", content: line.slice(6) })
            else if (line.startsWith("Agent: ")) conversationMessages.push({ role: "assistant", content: line.slice(7) })
        }
        conversationMessages.push({ role: "user", content: userTranscript })

        const llmRes = await groq.chat.completions.create({
            model: llmModel,
            messages: [{ role: "system", content: systemPromptWithMemory }, ...conversationMessages],
            max_tokens: 60,
            temperature: 0.7,
        })
        const agentResponse = llmRes.choices[0]?.message?.content?.trim() || "I'm here to help."

        // ── 5. TTS via Sarvam (translated to voice language) ────
        let audioBase64: string | null = null
        try {
            // Look up the voice's target language
            const voice = getVoiceById(selectedVoiceId);
            const targetLang = voice.language;

            // If not English, translate LLM output to the target language
            const textToSpeak = targetLang === "en-IN"
                ? agentResponse
                : await translateText(agentResponse, targetLang);

            console.log(`[Sandbox Voice] TTS: lang=${targetLang} text="${textToSpeak.slice(0, 60)}..."`);

            // Generate audio with Sarvam
            const audioBuffer = await generateSpeechWithSarvam(textToSpeak, selectedVoiceId);
            audioBase64 = audioBuffer.toString("base64");
        } catch (ttsErr: any) {
            console.error(`[Sandbox Voice] Sarvam TTS failed:`, ttsErr)
        }

        // ── 6. Post-call pipeline (async, non-blocking) ──────
        if (isLastTurn || history.length >= 18) {
            const fullTranscript = [
                ...history,
                `User: ${userTranscript}`,
                `Agent: ${agentResponse}`,
            ].join("\n")
            const callDurationEst = Math.max(30, history.length * 15)
            void Promise.all([
                agentId && leadId
                    ? runPostCallPipeline("", fullTranscript, agentId, leadId)
                    : Promise.resolve(),
                debitCallCredits(userId, callDurationEst),
            ]).catch((e) => console.error("[PostCall async]:", e))
        }

        return NextResponse.json({
            userTranscript,
            response: agentResponse,
            audioBase64,
            agentName,
            voiceId: selectedVoiceId,
        })
    } catch (error) {
        if (error instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        console.error("[Sandbox Voice] Error:", error)
        return NextResponse.json({ error: "Voice processing failed" }, { status: 500 })
    }
}
