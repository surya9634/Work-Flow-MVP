import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"
import Groq from "groq-sdk"
import fs from "fs"
import { synthesizeSpeech, DEFAULT_CARTESIA_VOICE_ID } from "@/lib/tts-server"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

/**
 * POST /api/sandbox/voice
 * Voice sandbox — STT→LLM→TTS returning JSON with base64 audio.
 * Uses robust multi-accent mapping for persona variety.
 */
export async function POST(req: Request) {
    try {
        const userId = await requireAuth()

        const formData = await req.formData()
        const audioFile = formData.get("audio") as File | null
        const agentId = formData.get("agentId") as string | null
        const requestVoiceId = formData.get("voiceId") as string | null
        const historyStr = (formData.get("conversationHistory") as string) || "[]"

        if (!audioFile) {
            return NextResponse.json({ error: "Audio file is required" }, { status: 400 })
        }

        // ── 1. Load agent config & voice selection ──────────────
        let systemPrompt = "You are a helpful AI sales agent in a live voice test. Keep responses short, natural, and conversational — 1-3 sentences max."
        let agentName = "Agent"
        let selectedVoiceId = requestVoiceId || DEFAULT_CARTESIA_VOICE_ID // Default Cartesia voice
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

        console.log(`[Sandbox Voice] Persona: ${selectedVoiceId} for ${agentName}`)
        try {
            fs.appendFileSync("api_debug.txt", `[${new Date().toISOString()}] Sandbox Voice: agent=${agentName}, voice=${selectedVoiceId}\n`);
        } catch (e) { }

        // ── 2. STT via Groq Whisper ─────────────────────────────
        const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
        const audioAsFile = new File([new Blob([audioBuffer])], "recording.webm", { type: "audio/webm" })

        let userTranscript = ""
        try {
            const transcription = await groq.audio.transcriptions.create({
                file: audioAsFile,
                model: "whisper-large-v3-turbo",
                response_format: "text",  // plain text is faster than JSON parsing
            })
            userTranscript = (typeof transcription === "string"
                ? transcription
                : (transcription as any).text || "").trim()
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

        // ── 3. LLM via Groq ─────────────────────────────────────
        const history: string[] = JSON.parse(historyStr)
        const conversationMessages: { role: "user" | "assistant"; content: string }[] = []
        for (const line of history) {
            if (line.startsWith("User: ")) conversationMessages.push({ role: "user", content: line.slice(6) })
            else if (line.startsWith("Agent: ")) conversationMessages.push({ role: "assistant", content: line.slice(7) })
        }
        conversationMessages.push({ role: "user", content: userTranscript })

        const llmRes = await groq.chat.completions.create({
            model: llmModel,
            messages: [{ role: "system", content: systemPrompt }, ...conversationMessages],
            max_tokens: 60,   // voice turns must be short; 60 tokens ≈ 2 sentences
            temperature: 0.7,
        })
        const agentResponse = llmRes.choices[0]?.message?.content?.trim() || "I'm here to help."

        // ── 4. Robust TTS with variety ──────────────────────────
        let audioBase64: string | null = null
        try {
            audioBase64 = await synthesizeSpeech(agentResponse, selectedVoiceId)
        } catch (ttsErr: any) {
            console.error(`[Sandbox Voice] TTS failed:`, ttsErr)
        }

        return NextResponse.json({
            userTranscript,
            response: agentResponse,
            audioBase64,
            agentName,
            voiceId: selectedVoiceId
        })
    } catch (error) {
        if (error instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        console.error("[Sandbox Voice] Error:", error)
        return NextResponse.json({ error: "Voice processing failed" }, { status: 500 })
    }
}
