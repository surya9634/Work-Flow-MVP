import { NextResponse } from "next/server"
import { requireAuth, AuthError } from "@/lib/auth"
import { VoiceRuntime } from "@/lib/services/voice-runtime"

/**
 * POST /api/voice/transcribe
 * Accept audio file → return transcribed text via Groq Whisper.
 * 
 * Expects multipart form data with an "audio" field containing the audio file.
 */
export async function POST(req: Request) {
    try {
        await requireAuth()

        const formData = await req.formData()
        const audioFile = formData.get("audio")

        if (!audioFile || !(audioFile instanceof Blob)) {
            return NextResponse.json(
                { error: "Audio file is required. Send as multipart form data with field name 'audio'." },
                { status: 400 }
            )
        }

        // Convert Blob to Buffer
        const arrayBuffer = await audioFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        if (buffer.length === 0) {
            return NextResponse.json(
                { error: "Audio file is empty." },
                { status: 400 }
            )
        }

        // Get filename for MIME type detection
        const filename = audioFile instanceof File ? audioFile.name : "audio.webm"

        // Transcribe via Groq Whisper
        const text = await VoiceRuntime.processAudio(buffer, filename)

        return NextResponse.json({
            text,
            model: "whisper-large-v3-turbo",
            provider: "groq",
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Voice Transcribe] Error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Transcription failed" },
            { status: 500 }
        )
    }
}
