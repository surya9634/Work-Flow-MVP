import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { VoiceRuntime } from "@/lib/services/voice-runtime";
import { processAudioWithSarvam, generateSpeechWithSarvam } from "@/lib/services/sarvam";
import { getBaseUrl } from "@/lib/services/twilio";
import fs from "fs/promises";
import path from "path";
import twilio from "twilio";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

const VoiceResponse = twilio.twiml.VoiceResponse;

// Temp audio folder (Vercel Serverless only allows writing to /tmp)
const AUDIO_DIR = path.join("/tmp");

/**
 * Ensures the temp-audio directory exists
 */
async function ensureAudioDir() {
    try {
        await fs.access(AUDIO_DIR);
    } catch {
        await fs.mkdir(AUDIO_DIR, { recursive: true });
    }
}

/**
 * Generate TTS + save to temp file. Returns public URL for Twilio to <Play>
 */
async function safeTTSAndSave(text: string, callLogId: string, suffix: string, voiceId = "priya-hi"): Promise<string> {
    try {
        await ensureAudioDir();
        const audioBuffer = await generateSpeechWithSarvam(text, voiceId);
        
        // Save to public/temp-audio
        const filename = `${callLogId}_${suffix}_${uuidv4()}.wav`;
        const filepath = path.join(AUDIO_DIR, filename);
        await fs.writeFile(filepath, audioBuffer);
        
        // We will serve this via an API route instead of direct public folder 
        // purely because Next.js sometimes caches public folder files aggressively or fails on dynamic writes
        return `${getBaseUrl()}/api/twilio/audio/${filename}`;
    } catch (e) {
        console.error("[TTS Error]", e);
        // Fallback TwiML if TTS fails
        return "";
    }
}

export async function POST(req: NextRequest) {
    try {
        // Twilio sends application/x-www-form-urlencoded
        const formData = await req.formData();
        
        // Extract typical Twilio params
        const callSid = formData.get("CallSid") as string;
        const callStatus = formData.get("CallStatus") as string;
        const recordingUrl = formData.get("RecordingUrl") as string; // From <Record>
        const digits = formData.get("Digits") as string; // From <Gather>

        // Get callLogId from URL query param
        const { searchParams } = new URL(req.url);
        const callLogIdFromUrl = searchParams.get("callLogId");

        // Find the active call log
        const activeCall = await prisma.callLog.findUnique({
            where: { id: callLogIdFromUrl || "" },
            include: { 
                agent: true,
                lead: true 
            }
        });

        const twiml = new VoiceResponse();

        if (!activeCall) {
            console.warn(`[Twilio Webhook] Unknown CallSid: ${callSid}`);
            twiml.say("An error occurred connecting to the agent. Goodbye.");
            twiml.hangup();
            return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
        }

        const agent = activeCall.agent;
        const agentId = activeCall.agentId;
        const voiceProfile = agent?.voiceProfile ? JSON.parse(agent.voiceProfile) : {};
        const voiceId = voiceProfile.voiceId || "priya-hi"; 
        
        let targetLanguage = "Hindi"; // Default fallback
        if (voiceId.endsWith("-en")) targetLanguage = "Indian English";
        if (voiceId.endsWith("-hi")) targetLanguage = "Hindi";
        if (voiceId.endsWith("-ta")) targetLanguage = "Tamil";
        if (voiceId.endsWith("-te")) targetLanguage = "Telugu";
        if (voiceId.endsWith("-ml")) targetLanguage = "Malayalam";
        if (voiceId.endsWith("-mr")) targetLanguage = "Marathi";
        if (voiceId.endsWith("-bn")) targetLanguage = "Bengali";
        if (voiceId.endsWith("-gu")) targetLanguage = "Gujarati";
        if (voiceId.endsWith("-kn")) targetLanguage = "Kannada";

        if (!agentId || !activeCall.leadId) {
             console.warn("Missing agent/lead correlation for call.");
             twiml.hangup();
             return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
        }

        if (callStatus === "completed" || callStatus === "failed" || callStatus === "busy" || callStatus === "no-answer") {
            // Call is over.
            await prisma.callLog.update({
                where: { id: activeCall.id },
                data: { 
                    status: callStatus === "completed" ? "completed" : "failed",
                    duration: 0 // Calculate if needed from Twilio Duration param
                }
            });
            // Let the post-call async job handle summary/analytics
            return new NextResponse("OK", { status: 200 });
        }

        // --- CONVERSATION LOOP ---

        let userTranscript = "";

        if (recordingUrl) {
            // 1. Process User Audio (STT)
            // Twilio gives us a URL to the recording. We need to fetch the .wav
            try {
                // Twilio recordings might need HTTP Basic Auth if secure recordings is enabled,
                // but usually the URL is public for a short time if default settings.
                const audioRes = await fetch(recordingUrl + ".wav"); 
                if (audioRes.ok) {
                    const audioBuffer = await audioRes.arrayBuffer();
                    userTranscript = await processAudioWithSarvam(Buffer.from(audioBuffer));
                    console.log(`[Twilio STT] User said: ${userTranscript}`);
                } else {
                    console.error("[Twilio STT] Failed to fetch recording from Twilio:", audioRes.statusText);
                }
            } catch (err) {
                console.error("[Twilio STT] Error processing audio", err);
            }
        } else if (digits) {
            // fallback if they used keypad? (rare for our AI agent, but good to handle)
            userTranscript = `User pressed digits: ${digits}`;
        }

        if (userTranscript && userTranscript.trim().length > 0) {
            // Append User msg
            await prisma.callLog.update({
                where: { id: activeCall.id },
                data: {
                    transcript: activeCall.transcript + `\nLead: ${userTranscript}\n`
                }
            });
        }

        // 2. Generate AI Response via VoiceRuntime
        // (Even if transcript is empty on the FIRST webhook hit after the opening line, we just <Record> immediately)
        
        let agentReplyText = "";
        let audioUrl = "";

        if (userTranscript) {
             // Convert transcript string to array for LLM
             const historyLines = (activeCall.transcript || "").split("\n").filter(l => l.trim() !== "");
             
             agentReplyText = await VoiceRuntime.generateLLMResponse(
                userTranscript,
                activeCall.agent?.systemPrompt || "",
                "Friendly sales approach", // Default strategy
                historyLines,
                targetLanguage
            );
        }

        // 3. Convert LLM Text to Speech
        if (agentReplyText) {
             audioUrl = await safeTTSAndSave(agentReplyText, activeCall.id, Date.now().toString(), voiceId);
        }

        // 4. Return TwiML
        if (audioUrl) {
             // Play the agent's response
             twiml.play(audioUrl);
        }

        // Then ALWAYS record the next user input
        // Twilio will beep and start recording until silence or max length, 
        // then POST back to this exact webhook URL with `RecordingUrl`.
        twiml.record({
            action: `${getBaseUrl()}/api/twilio/webhook`, // Post back here
            method: 'POST',
            timeout: 2, // stop recording after 2 seconds of silence
            maxLength: 30, // max recording len
            playBeep: false // true if you want a beep
        });

        // Twilio requires sending valid XML back
        return new NextResponse(twiml.toString(), {
            headers: {
                "Content-Type": "text/xml"
            }
        });

    } catch (e: any) {
        console.error("[Twilio Webhook] Fatal error:", e);
        const errTwiml = new VoiceResponse();
        errTwiml.say("A system error occurred. Goodbye.");
        errTwiml.hangup();
        return new NextResponse(errTwiml.toString(), {
            headers: {
                "Content-Type": "text/xml"
            }
        });
    }
}
