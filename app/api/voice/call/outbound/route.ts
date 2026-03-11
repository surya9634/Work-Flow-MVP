import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"
import { VoiceRuntime } from "@/lib/services/voice-runtime"

/**
 * POST /api/voice/call/outbound
 * Trigger an outbound AI call to a lead (MVP: simulated, no real phone).
 * Body: { leadId, agentId, campaignId? }
 */
export async function POST(req: Request) {
    try {
        const userId = await requireAuth()
        const { leadId, agentId, campaignId } = await req.json()

        if (!leadId || !agentId) {
            return NextResponse.json({ error: "leadId and agentId are required" }, { status: 400 })
        }

        const [lead, agent] = await Promise.all([
            prisma.lead.findFirst({ where: { id: leadId, userId } }),
            prisma.agent.findFirst({ where: { id: agentId, userId } }),
        ])

        if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })
        if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 })

        // Mark lead as CALLING
        await prisma.lead.update({ where: { id: leadId }, data: { status: "CALLING", lastCall: new Date() } })

        // Create call log (use raw SQL for new fields: campaignId, outcome, followUpAt)
        const callLogId = `clg_${Date.now()}`
        await prisma.$executeRaw`INSERT INTO "CallLog" (id, "leadId", "agentId", "campaignId", status, transcript, "createdAt", "updatedAt")
            VALUES (${callLogId}, ${leadId}, ${agentId}, ${campaignId || null}, 'IN_PROGRESS', '[]', NOW(), NOW())`

        // Simulate call conversation
        const systemPrompt = agent.systemPrompt || "You are an AI sales agent."
        const openingScript = agent.openingScript || "Hello, how can I help you today?"
        const session = VoiceRuntime.createSession(agentId, leadId)
        session.transcript.push(`Agent: ${openingScript}`)

        const simulatedResponse = await VoiceRuntime.generateLLMResponse(
            "This sounds interesting, tell me more.",
            systemPrompt,
            "Qualify the lead and pitch the product.",
            session.transcript
        )
        session.transcript.push(`Lead (simulated): Sounds interesting, tell me more.`)
        session.transcript.push(`Agent: ${simulatedResponse}`)

        const duration = Math.floor(Math.random() * 120) + 30

        // Update call with outcome
        await prisma.$executeRaw`UPDATE "CallLog" SET status = 'COMPLETED', duration = ${duration},
            transcript = ${JSON.stringify(session.transcript)}, outcome = 'interested', sentiment = 'positive',
            "updatedAt" = NOW() WHERE id = ${callLogId}`

        await prisma.lead.update({ where: { id: leadId }, data: { status: "CONTACTED", score: 0.5 } })

        return NextResponse.json({
            success: true,
            callId: callLogId,
            transcript: session.transcript,
            duration,
            outcome: "interested",
            message: "MVP: simulated call. Wire to Twilio/Vapi for real calls.",
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Voice Outbound] Error:", error)
        return NextResponse.json({ error: "Failed to initiate call" }, { status: 500 })
    }
}
