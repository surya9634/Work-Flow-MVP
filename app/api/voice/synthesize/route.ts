import { NextResponse } from "next/server"
import { requireAuth, AuthError } from "@/lib/auth"
import { VoiceRuntime } from "@/lib/services/voice-runtime"

/**
 * POST /api/voice/synthesize
 * Accept text → return audio (WebM) via Microsoft Edge TTS.
 * 
 * Body: { text: string, voice?: { gender?: string, tone?: string } }
 * Returns: audio/webm binary response
 */
export async function POST(req: Request) {
    try {
        await requireAuth()

        const body = await req.json()
        const { text, voice } = body

        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "Text is required." },
                { status: 400 }
            )
        }

        if (text.length > 5000) {
            return NextResponse.json(
                { error: "Text exceeds maximum length of 5000 characters." },
                { status: 400 }
            )
        }

        // Generate speech via Edge TTS
        const audioBuffer = await VoiceRuntime.generateSpeech(text, voice || {})

        // Return audio as binary response
        const uint8 = new Uint8Array(audioBuffer);
        return new NextResponse(uint8, {
            status: 200,
            headers: {
                "Content-Type": "audio/webm",
                "Content-Length": audioBuffer.length.toString(),
                "Content-Disposition": 'inline; filename="speech.webm"',
            },
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Voice Synthesize] Error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Speech synthesis failed" },
            { status: 500 }
        )
    }
}
