import { NextResponse } from "next/server"
import { requireAuth, AuthError } from "@/lib/auth"
import { VoiceRuntime } from "@/lib/services/voice-runtime"

/**
 * POST /api/voice/turn
 * Single-turn voice pipeline: audio blob → STT → LLM → TTS → audio + text.
 *
 * Body: FormData with:
 *   - audio: Blob (webm/mp3/wav)
 *   - systemPrompt: string
 *   - convTree: JSON string (optional)
 *   - voiceProfile: JSON string (optional)
 *   - history: JSON string array (optional, conversation so far)
 */
export async function POST(req: Request) {
    try {
        await requireAuth()

        const formData = await req.formData()
        const audioFile = formData.get("audio") as File | null
        const systemPrompt = (formData.get("systemPrompt") as string) || "You are a helpful AI sales agent."
        const convTreeStr = (formData.get("convTree") as string) || "{}"
        const voiceProfileStr = (formData.get("voiceProfile") as string) || "{}"
        const historyStr = (formData.get("history") as string) || "[]"

        if (!audioFile) {
            return NextResponse.json({ error: "Audio file is required" }, { status: 400 })
        }

        const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
        const convTree = JSON.parse(convTreeStr)
        const voiceProfile = JSON.parse(voiceProfileStr)
        const history: string[] = JSON.parse(historyStr)

        // Create a minimal session for this turn
        const session = VoiceRuntime.createSession("sandbox", "sandbox_lead")
        session.transcript = history
        session.status = "connected"

        // Full pipeline: STT → Intent → LLM → TTS
        const result = await VoiceRuntime.processTurn(
            session,
            audioBuffer,
            systemPrompt,
            convTree,
            voiceProfile
        )

        // Return audio as binary + metadata
        const uint8 = new Uint8Array(result.audio)
        const response = new NextResponse(uint8, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": result.audio.length.toString(),
                "X-Transcript-User": result.userText,
                "X-Transcript-Agent": result.text,
                "X-Intent": result.intent,
            },
        })

        return response
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Voice Turn] Error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Voice turn failed" },
            { status: 500 }
        )
    }
}
