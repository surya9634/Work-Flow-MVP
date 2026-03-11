import { NextResponse } from "next/server"
import { requireAuth, AuthError } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { synthesizeSpeech } from "@/lib/tts-server"

export async function POST(req: Request) {
    try {
        const userId = await requireAuth()
        const { text, voiceId: requestVoiceId, agentId } = await req.json()

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 })
        }

        let selectedVoiceId = requestVoiceId || "en-US-AriaNeural"

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

        console.log(`[TTS API] Generating Realistic Cloud Speech for voice=${selectedVoiceId}`)

        try {
            const audioBase64 = await synthesizeSpeech(text, selectedVoiceId)

            return NextResponse.json({
                audioBase64,
                voiceId: selectedVoiceId,
                note: "realistic-cloud-neural"
            })
        } catch (ttsErr: any) {
            console.error(`[TTS API] Realistic Synthesis Failure:`, ttsErr)

            // Second level fallback to stable Google Translate (Multi-accent)
            const localeMap: Record<string, string> = {
                "en-US-AriaNeural": "en-US",
                "en-GB-SoniaNeural": "en-GB",
                "en-US-SteffanNeural": "en-AU",
                "hi-IN-SwaraNeural": "hi-IN",
                "hi-IN-MadhurNeural": "hi-IN",
            };
            const targetLocale = localeMap[selectedVoiceId] || "en-US";
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.slice(0, 250))}&tl=${targetLocale}&client=tw-ob`
            const ttsRes = await fetch(ttsUrl, { headers: { "User-Agent": "Mozilla/5.0" } })

            if (ttsRes.ok) {
                const audioBase64 = Buffer.from(await ttsRes.arrayBuffer()).toString("base64")
                return NextResponse.json({
                    audioBase64,
                    voiceId: selectedVoiceId,
                    locale: targetLocale,
                    note: "stable-fallback"
                })
            }
            throw new Error("Final TTS Fallback failed")
        }
    } catch (error) {
        if (error instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        console.error("[TTS API] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
