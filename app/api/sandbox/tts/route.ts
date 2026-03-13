import { NextResponse } from "next/server"
import { requireAuth, AuthError } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateSpeechWithSarvam, translateText, getVoiceById } from "@/lib/services/sarvam"

export async function POST(req: Request) {
    try {
        const userId = await requireAuth()
        const { text, voiceId: requestVoiceId, agentId } = await req.json()

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 })
        }

        let selectedVoiceId = requestVoiceId || "anushka-hi"

        // If agentId provided, use the agent's saved voice
        if (agentId) {
            const agent = await prisma.agent.findFirst({ where: { id: agentId, userId } })
            if (agent?.voiceProfile) {
                try {
                    const vp = JSON.parse(agent.voiceProfile)
                    if (vp.voiceId) selectedVoiceId = vp.voiceId
                } catch (e) { }
            }
        }

        console.log(`[TTS API] Generating Sarvam speech for voice=${selectedVoiceId}`)

        // Resolve voice language
        const voice = getVoiceById(selectedVoiceId)
        const targetLang = voice.language

        // Translate if not English
        const textToSpeak = targetLang === "en-IN"
            ? text
            : await translateText(text, targetLang)

        const audioBuffer = await generateSpeechWithSarvam(textToSpeak, selectedVoiceId)
        const audioBase64 = audioBuffer.toString("base64")

        return NextResponse.json({
            audioBase64,
            voiceId: selectedVoiceId,
            language: targetLang,
            note: "sarvam-bulbul-v1"
        })
    } catch (error) {
        if (error instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        console.error("[TTS API] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
