import { NextResponse } from "next/server"
import { requireAuth, AuthError } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { synthesizeSpeech, DEFAULT_CARTESIA_VOICE_ID } from "@/lib/tts-server"

export async function POST(req: Request) {
    try {
        const userId = await requireAuth()
        const { text, voiceId: requestVoiceId, agentId } = await req.json()

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 })
        }

        let selectedVoiceId = requestVoiceId || DEFAULT_CARTESIA_VOICE_ID

        // If agentId provided, prioritize their persona voice
        if (agentId) {
            const agent = await prisma.agent.findFirst({ where: { id: agentId, userId } })
            if (agent && agent.voiceProfile) {
                try {
                    const vp = JSON.parse(agent.voiceProfile)
                    if (vp.voiceId) selectedVoiceId = vp.voiceId
                } catch (e) { }
            }
        }

        console.log(`[TTS API] Generating Cartesia speech for voice=${selectedVoiceId}`)

        const audioBase64 = await synthesizeSpeech(text, selectedVoiceId)

        return NextResponse.json({
            audioBase64,
            voiceId: selectedVoiceId,
            note: "cartesia-sonic"
        })
    } catch (error) {
        if (error instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        console.error("[TTS API] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
