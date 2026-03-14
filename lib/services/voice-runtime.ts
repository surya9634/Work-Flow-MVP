import { groq } from "@/lib/groq"
import { CalendarService } from "@/lib/services/calendar"
import { 
    processAudioWithSarvam, 
    translateText,
    translateTextToHindi,
    generateSpeechWithSarvam, 
    getSarvamVoices,
    getVoiceById,
} from "@/lib/services/sarvam";
import { Readable } from "stream";
import fs from "fs";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_SARVAM_VOICE_ID = "priya-hi";

/**
 * VOICE RUNTIME ENGINE
 * 
 * Real implementations:
 * - STT: Groq Whisper (whisper-large-v3-turbo) — uses GROQ_API_KEY
 * - TTS: Cartesia Sonic — high-quality, low-latency cloud TTS, uses CARTESIA_API_KEY
 * - LLM: Groq (llama-3.3-70b-versatile) — uses GROQ_API_KEY
 * 
 * Pipeline: Audio In → STT (Groq Whisper) → Intent → ConvTree → LLM → TTS (Cartesia) → Audio Out
 */

export interface VoiceEvent {
    type: "call_start" | "audio_chunk" | "transcript" | "intent" | "response" | "call_end";
    data: any;
    timestamp: number;
}

export interface CallSession {
    callId: string;
    agentId: string;
    leadId: string;
    startTime: number;
    transcript: string[];
    status: "ringing" | "connected" | "ended";
}

// ─── VOICE MAPPING ──────────────────────────────────
// Maps voice profile gender/tone settings to Sarvam compound voice IDs.
const VOICE_MAP: Record<string, Record<string, string>> = {
    male: {
        professional: "abhilash-hi",
        friendly:     "rahul-hi",
        casual:       "rohan-hi",
        assertive:    "abhilash-hi",
    },
    female: {
        professional: "priya-hi",
        friendly:     "priya-hi",
        casual:       "neha-hi",
        assertive:    "priya-hi",
    },
};

function resolveVoiceId(voiceProfile: any): string {
    const gender = (voiceProfile?.gender || "female").toLowerCase();
    const tone   = (voiceProfile?.tone   || "professional").toLowerCase();
    return VOICE_MAP[gender]?.[tone] || VOICE_MAP.female.professional;
}

export class VoiceRuntime {

    /**
     * Initialize a call session.
     */
    static createSession(agentId: string, leadId: string): CallSession {
        return {
            callId: `call_${Date.now()}`,
            agentId,
            leadId,
            startTime: Date.now(),
            transcript: [],
            status: "ringing"
        };
    }

    /**
     * REAL STT — Groq Whisper transcription.
     * Accepts audio buffer (wav, mp3, webm, m4a, ogg).
     * Returns transcribed text.
     */
    static async processAudio(audioBuffer: Buffer, filename: string = "audio.webm"): Promise<string> {
        const tempPath = path.join(os.tmpdir(), `stt_${uuidv4()}_${filename}`);
        try {
            // Write buffer to a real file so Groq SDK handles it perfectly without Blob encoding issues
            fs.writeFileSync(tempPath, audioBuffer);

            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(tempPath),
                model: "whisper-large-v3-turbo",
                language: "en",
                response_format: "text",
            });

            // The response is the transcribed text directly
            const text = typeof transcription === "string"
                ? transcription
                : (transcription as any).text || "";

            return text.trim();
        } catch (error) {
            console.error("[VoiceRuntime] STT Error:", error);
            throw new Error(`Speech-to-text failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        }
    }

    /**
     * Get MIME type from filename extension.
     */
    static getMimeType(filename: string): string {
        const ext = filename.split(".").pop()?.toLowerCase() || "webm";
        const mimeTypes: Record<string, string> = {
            webm: "audio/webm",
            mp3: "audio/mpeg",
            wav: "audio/wav",
            m4a: "audio/m4a",
            ogg: "audio/ogg",
            mp4: "audio/mp4",
            mpeg: "audio/mpeg",
            mpga: "audio/mpeg",
        };
        return mimeTypes[ext] || "audio/webm";
    }

    /**
     * Detect intent from transcript text.
     */
    static detectIntent(text: string): string {
        const lower = text.toLowerCase();
        if (lower.includes("yes") || lower.includes("sure") || lower.includes("interested")) return "positive";
        if (lower.includes("no") || lower.includes("not interested") || lower.includes("busy")) return "negative";
        if (lower.includes("how much") || lower.includes("price") || lower.includes("cost")) return "objection_price";
        if (lower.includes("who") || lower.includes("boss") || lower.includes("manager")) return "objection_authority";
        if (lower.includes("later") || lower.includes("not now") || lower.includes("next month")) return "objection_timing";
        return "neutral";
    }

    /**
     * Route to conversation tree node based on intent.
     */
    static routeToNode(intent: string, convTree: any): any {
        switch (intent) {
            case "positive":
                return convTree.qualification_node || convTree.booking_node;
            case "negative":
                return convTree.rejection_node;
            case "objection_price":
                return convTree.objection_nodes?.price;
            case "objection_authority":
                return convTree.objection_nodes?.authority;
            case "objection_timing":
                return convTree.objection_nodes?.timing;
            default:
                return convTree.qualification_node;
        }
    }

    /**
     * REAL TTS — Sarvam AI Text-to-Speech (Bulbul v3).
     * Takes English text, translates to Hindi, then generates Hindi audio Buffer (WAV).
     */
    static async generateSpeech(text: string, voiceProfile: any, translateToIndic = true): Promise<Buffer> {
        try {
            const voiceId = voiceProfile?.voiceId || DEFAULT_SARVAM_VOICE_ID;
            
            // Resolve the voice's target language from the catalogue
            const voice = getVoiceById(voiceId);
            const targetLang = voice.language;

            console.log(`[VoiceRuntime] TTS: voice=${voiceId} lang=${targetLang}`);

            let targetText = text;
            if (translateToIndic) {
                console.log(`[VoiceRuntime] TTS: translating to ${targetLang}...`);
                targetText = await translateText(text, targetLang);
                console.log(`[VoiceRuntime] TTS translated: "${targetText}"`);
            }

            return await generateSpeechWithSarvam(targetText, voiceId);

        } catch (error) {
            console.error("[VoiceRuntime] Sarvam TTS Error:", error);
            throw new Error(`Text-to-speech failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    /**
     * Generate an LLM response using Groq, guided by the conversation tree node.
     * Integrates Function Calling (Tools) to interact with the Calendar.
     */
    static async generateLLMResponse(
        userText: string,
        systemPrompt: string,
        nodeStrategy: string,
        conversationHistory: string[],
        targetLanguage?: string // New dynamic language param
    ): Promise<string> {
        try {
            const conversationMessages: any[] = [];
            for (const line of conversationHistory) {
                if (line.startsWith("User: ")) {
                    conversationMessages.push({ role: "user", content: line.slice(6) });
                } else if (line.startsWith("Agent: ")) {
                    conversationMessages.push({ role: "assistant", content: line.slice(7) });
                }
            }

            // Note: userText is already present at the end of conversationMessages 
            // because the Twilio webhook appends it to the DB transcript string
            // before calling this function.

            const languageInstruction = targetLanguage && targetLanguage !== 'English' 
                ? `\n\nIMPORTANT LANGUAGE INSTRUCTION: You MUST format your response completely in ${targetLanguage}. Do not use English unless the user explicitly requests it. Your underlying language model processing happens in English, but your output text MUST be in ${targetLanguage}.`
                : "";

            const messages: any[] = [
                { role: "system", content: `${systemPrompt}\n\nKeep your responses extremely brief, 1-2 sentences maximum. Conversational strategy: ${nodeStrategy}${languageInstruction}` },
                ...conversationMessages
            ];

            const tools = [
                {
                    type: "function" as const,
                    function: {
                        name: "check_availability",
                        description: "Check available meeting times for a specific day of the week.",
                        parameters: {
                            type: "object",
                            properties: {
                                day: {
                                    type: "string",
                                    description: "The day of the week (e.g., 'Monday', 'Tuesday')."
                                }
                            },
                            required: ["day"]
                        }
                    }
                },
                {
                    type: "function" as const,
                    function: {
                        name: "book_meeting",
                        description: "Book a meeting for the prospect at a specific time.",
                        parameters: {
                            type: "object",
                            properties: {
                                name: {
                                    type: "string",
                                    description: "The name of the prospect."
                                },
                                datetime: {
                                    type: "string",
                                    description: "The date and time to book (e.g., 'Monday 10:00 AM')."
                                }
                            },
                            required: ["name", "datetime"]
                        }
                    }
                }
            ];

            const completion = await groq.chat.completions.create({
                messages,
                model: "llama-3.1-8b-instant",  // fastest Groq model — ideal for sub-sentence voice turns
                temperature: 0.7,
                max_tokens: 60,                  // voice responses must be short; fewer tokens = faster TTS
                tools: tools,
                tool_choice: "auto",
            });

            const topChoice = completion.choices[0];

            // Check if the LLM wants to call a function
            if (topChoice.message?.tool_calls && topChoice.message.tool_calls.length > 0) {
                const toolCall = topChoice.message.tool_calls[0];
                console.log(`[VoiceRuntime] LLM is executing tool: ${toolCall.function.name}`);

                let functionResult = "";

                try {
                    const args = JSON.parse(toolCall.function.arguments);

                    if (toolCall.function.name === "check_availability") {
                        const slots = await CalendarService.getAvailableSlots(args.day);
                        functionResult = slots.length > 0
                            ? `Available slots on ${args.day}: ${slots.join(", ")}`
                            : `There are no available slots on ${args.day}.`;
                    } else if (toolCall.function.name === "book_meeting") {
                        functionResult = await CalendarService.bookMeeting(args.name, args.datetime);
                    }
                } catch (e) {
                    functionResult = "There was an error accessing the calendar system.";
                    console.error("[VoiceRuntime] Tool execution error:", e);
                }

                // Make a second call to the LLM with the function result
                messages.push(topChoice.message); // Append the assistant's tool request
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    name: toolCall.function.name,
                    content: functionResult
                });

                const secondCompletion = await groq.chat.completions.create({
                    messages,
                    model: "llama-3.3-70b-versatile",
                    temperature: 0.7,
                    max_tokens: 150,
                });

                return secondCompletion.choices[0]?.message?.content?.trim() || "I've handled that for you.";
            }

            return topChoice.message?.content?.trim() || "I understand. Could you tell me more?";
        } catch (error) {
            console.error("[VoiceRuntime] LLM Error:", error);
            return "I understand. Could you tell me more about that?";
        }
    }

    /**
     * Full pipeline: Audio → STT → Intent → LLM → TTS → Audio
     */
    static async processTurn(
        session: CallSession,
        audioChunk: Buffer,
        systemPrompt: string,
        convTree: any,
        voiceProfile: any
    ): Promise<{ text: string; audio: Buffer; intent: string; userText: string }> {
        // 1. STT — Real Groq Whisper transcription (Skip if buffer is empty, e.g., for initial greetings)
        let userText = "";
        if (audioChunk.length > 0) {
            userText = await VoiceRuntime.processAudio(audioChunk, "audio.wav");
            console.log(`[VoiceRuntime] STT Recognized: "${userText}"`);

            // Filter out Whisper hallucinations generated from phone static
            const lower = userText.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (["right", "yeah", "thankyou", "you", "ok", ""].includes(lower)) {
                console.log(`[VoiceRuntime] STT text "${userText}" flagged as hallucination. Discarding.`);
                return { text: "", audio: Buffer.from(""), intent: "neutral", userText: "" };
            }

            session.transcript.push(`User: ${userText}`);
        } else {
            userText = "[User picked up the phone]";
        }

        // 2. Intent Detection
        const intent = VoiceRuntime.detectIntent(userText);

        // 3. Route to conversation tree node
        const node = VoiceRuntime.routeToNode(intent, convTree);
        const strategy = node?.response_strategy || "Respond helpfully and naturally.";

        // 4. Generate LLM response (real Groq inference - ENGLISH IN, ENGLISH OUT)
        const responseText = await VoiceRuntime.generateLLMResponse(
            userText,
            systemPrompt,
            strategy,
            session.transcript
        );
        session.transcript.push(`Agent: ${responseText}`);

        // 5. TTS — Translate English to Hindi, then synthesize via Sarvam
        const audio = await VoiceRuntime.generateSpeech(responseText, voiceProfile, true);

        return { text: responseText, audio, intent, userText };
    }

    /**
     * ADVANCED ANALYTICS: LLM-driven post-call analysis.
     * Analyzes sentiment, detects outcomes, and generates a summary.
     */
    static async analyzeCall(transcript: string[], goal: string): Promise<{
        sentiment: "positive" | "neutral" | "negative";
        outcome: string;
        summary: string;
    }> {
        if (transcript.length === 0) {
            return { sentiment: "neutral", outcome: "No conversation", summary: "The call ended before any conversation occurred." };
        }

        const prompt = `You are a Post-Call Analytics Engine. Analyze this transcript for an AI Sales Call.
AGENT MISSION: ${goal}

TRANSCRIPT:
${transcript.join("\n")}

INSTRUCTIONS:
1. Detect SENTIMENT (positive, neutral, negative).
2. Detect OUTCOME (e.g., "Meeting Booked", "Bad Timing", "Not Interested", "Price Objection").
3. Provide a 1-sentence SUMMARY of the conversation.

Return ONLY this JSON:
{
  "sentiment": "positive|neutral|negative",
  "outcome": "Brief phrase",
  "summary": "1 sentence description"
}`;

        try {
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "openai/gpt-oss-120b",
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(content);

            return {
                sentiment: parsed.sentiment || "neutral",
                outcome: parsed.outcome || "unknown",
                summary: parsed.summary || "Call summarized successfully."
            };
        } catch (e) {
            console.error("[VoiceRuntime] Analytics Error:", e);
            return { sentiment: "neutral", outcome: "analysis_failed", summary: "Failed to analyze terminal call data." };
        }
    }

    /**
     * Get available TTS voices (Sarvam)
     */
    static async getAvailableVoices() {
        return getSarvamVoices();
    }
}
