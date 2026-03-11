import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"
import { VoiceRuntime } from "@/lib/services/voice-runtime"
import { EmailGenerator } from "@/lib/services/email-generator"
import { EmailService } from "@/lib/services/email-sender"

type RouteContext = { params: Promise<{ callId: string }> }

/**
 * POST /api/voice/call/[callId]/end
 * Finalize a call — store transcript, outcome, duration, update lead status.
 * Now performs LLM-driven post-call analysis for sentiment and precise outcome.
 */
export async function POST(req: Request, context: RouteContext) {
    try {
        const userId = await requireAuth()
        const { callId } = await context.params
        const body = await req.json()
        const { transcript, duration, followUpAt } = body

        // 1. Find call log and associated agent/lead
        const callLogs = await prisma.$queryRaw<{ id: string; leadId: string | null; agentId: string | null; agentName: string | null; agentUserId: string | null }[]>`
            SELECT cl.id, cl."leadId", cl."agentId",
                   a.name as "agentName", a."userId" as "agentUserId"
            FROM "CallLog" cl 
            LEFT JOIN "Agent" a ON cl."agentId" = a.id
            WHERE cl.id = ${callId} LIMIT 1
        `

        if (!callLogs.length) {
            return NextResponse.json({ error: "Call not found" }, { status: 404 })
        }

        const callLog = callLogs[0]
        if (callLog.agentUserId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const transcriptArray = Array.isArray(transcript) ? transcript : []
        const transcriptStr = JSON.stringify(transcriptArray)

        // 2. Perform Deep LLM Analysis (Advanced Analytics Feature)
        console.log(`[Call End] Analyzing call ${callId} with Llama 3...`)
        const analysis = await VoiceRuntime.analyzeCall(
            transcriptArray,
            `Lead qualification for ${callLog.agentName || "AI Agent"}`
        )

        const followUpDateTime = followUpAt ? new Date(followUpAt).toISOString() : null

        // 3. Update CallLog with LLM-generated sentiment and outcome
        await prisma.$executeRaw`UPDATE "CallLog"
            SET status = 'COMPLETED',
                transcript = ${transcriptStr},
                outcome = ${analysis.outcome},
                duration = ${duration || null},
                sentiment = ${analysis.sentiment},
                "followUpAt" = ${followUpDateTime},
                "updatedAt" = datetime('now')
            WHERE id = ${callId}`

        // 4. Update Lead Status based on analysis
        const leadStatusMap: Record<string, string> = {
            "Meeting Booked": "BOOKED",
            "Interested": "INTERESTED",
            "Bad Timing": "FOLLOW_UP",
            "Not Interested": "NOT_INTERESTED",
            "Price Objection": "NOT_INTERESTED",
            "Wrong Person": "NOT_INTERESTED",
        }

        if (callLog.leadId) {
            const newStatus = leadStatusMap[analysis.outcome] || "CONTACTED"
            await prisma.lead.update({
                where: { id: callLog.leadId },
                data: {
                    status: newStatus,
                    lastCall: new Date(),
                    metadata: analysis.summary // Store summary in lead metadata
                },
            })

            // 5. OMNICHANNEL: Send Automated Follow-up Email
            const lead = await prisma.lead.findUnique({ where: { id: callLog.leadId } })
            if (lead && lead.email) {
                console.log(`[Omnichannel] Generating email for lead: ${lead.email}...`)
                const emailContent = await EmailGenerator.generateFollowUpEmail(
                    transcriptArray,
                    analysis.outcome,
                    lead.name,
                    callLog.agentName || "Your Sales Agent",
                    "Voice SaaS Inc." // Ideally fetched from user settings
                )

                await EmailService.sendEmail(
                    lead.email,
                    emailContent.subject,
                    emailContent.body
                )
            }
        }

        return NextResponse.json({
            success: true,
            callId,
            analysis,
            status: "COMPLETED"
        })
    } catch (error) {
        if (error instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        console.error("[Call End] Error:", error)
        return NextResponse.json({ error: "Failed to finalize call" }, { status: 500 })
    }
}
