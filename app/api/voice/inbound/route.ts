import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { VoiceRuntime } from "@/lib/services/voice-runtime"

/**
 * POST /api/voice/inbound
 * Inbound call handler webhook.
 * In production: receives Twilio/Vapi webhook on incoming call.
 * In MVP: simulates an inbound call from a caller phone number.
 * Body: { callerPhone, callerName?, message? }
 */
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { callerPhone, callerName, message } = body

        if (!callerPhone) {
            return NextResponse.json({ error: "callerPhone is required" }, { status: 400 })
        }

        // Find existing lead by phone
        const existingLead = await prisma.lead.findFirst({
            where: { phone: callerPhone },
        })

        let systemPrompt = "You are an AI sales agent. Greet the caller professionally and qualify their interest."
        let agentId: string | null = null
        let leadId: string | null = existingLead?.id || null

        // If lead has a campaign, find the agent via raw SQL
        if (existingLead?.campaignId) {
            const rows = await prisma.$queryRaw<{ agentId: string | null; systemPrompt: string | null }[]>`
                SELECT a.id as "agentId", a."systemPrompt"
                FROM "Campaign" c
                JOIN "Agent" a ON a.id = c."agentId"
                WHERE c.id = ${existingLead.campaignId}
                LIMIT 1
            `
            if (rows.length && rows[0].agentId) {
                agentId = rows[0].agentId
                systemPrompt = rows[0].systemPrompt || systemPrompt
            }
        }

        // Create lead if unknown caller
        if (!existingLead) {
            const newLead = await prisma.lead.create({
                data: {
                    userId: "system",
                    name: callerName || `Caller ${callerPhone}`,
                    phone: callerPhone,
                    source: "INBOUND",
                    status: "CALLING",
                },
            })
            leadId = newLead.id
        } else {
            await prisma.lead.update({
                where: { id: existingLead.id },
                data: { status: "CALLING", lastCall: new Date() },
            })
        }

        // Create call log
        const callLogId = `clg_inbound_${Date.now()}`
        await prisma.$executeRaw`INSERT INTO "CallLog" (id, "leadId", "agentId", "campaignId", status, transcript, "createdAt", "updatedAt")
            VALUES (${callLogId}, ${leadId}, ${agentId}, ${existingLead?.campaignId || null}, 'IN_PROGRESS', '[]', NOW(), NOW())`

        // Generate AI response
        const inboundMessage = message || "Hello?"
        const aiResponse = await VoiceRuntime.generateLLMResponse(
            inboundMessage,
            systemPrompt,
            "Greet the caller warmly and qualify their interest.",
            [`Caller: ${inboundMessage}`]
        )

        const transcript = [`Caller: ${inboundMessage}`, `Agent: ${aiResponse}`]
        await prisma.$executeRaw`UPDATE "CallLog" SET transcript = ${JSON.stringify(transcript)}, "updatedAt" = NOW() WHERE id = ${callLogId}`

        return NextResponse.json({ callId: callLogId, response: aiResponse, transcript })
    } catch (error) {
        console.error("[Voice Inbound] Error:", error)
        return NextResponse.json({ error: "Inbound call handler failed" }, { status: 500 })
    }
}
