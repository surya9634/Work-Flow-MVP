import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"

/**
 * GET /api/call-logs
 * List call logs. Supports optional query params: agentId, leadId, limit.
 */
export async function GET(req: Request) {
    try {
        const userId = await requireAuth()
        const { searchParams } = new URL(req.url)
        const agentId = searchParams.get("agentId")
        const leadId = searchParams.get("leadId")
        const limit = parseInt(searchParams.get("limit") || "50", 10)

        const callLogs = await prisma.callLog.findMany({
            where: {
                ...(agentId && { agentId }),
                ...(leadId && { leadId }),
                // Scope to user's agents/leads
                OR: [
                    { agent: { userId } },
                    { lead: { userId } },
                ],
            },
            orderBy: { createdAt: "desc" },
            take: Math.min(limit, 100),
            include: {
                lead: { select: { id: true, name: true, phone: true } },
                agent: { select: { id: true, name: true } },
                leadScore: true,
            },
        })

        return NextResponse.json({ callLogs })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[CallLogs GET] Error:", error)
        return NextResponse.json({ error: "Failed to fetch call logs" }, { status: 500 })
    }
}

/**
 * POST /api/call-logs
 * Create a call log entry (used by voice runtime / webhook).
 */
export async function POST(req: Request) {
    try {
        const userId = await requireAuth()
        const body = await req.json()
        const { leadId, agentId, duration, status, recordingUrl, transcript, sentiment } = body

        // Verify ownership if agentId provided
        if (agentId) {
            const agent = await prisma.agent.findFirst({ where: { id: agentId, userId } })
            if (!agent) {
                return NextResponse.json({ error: "Agent not found" }, { status: 404 })
            }
        }

        // Verify ownership if leadId provided
        if (leadId) {
            const lead = await prisma.lead.findFirst({ where: { id: leadId, userId } })
            if (!lead) {
                return NextResponse.json({ error: "Lead not found" }, { status: 404 })
            }
        }

        const callLog = await prisma.callLog.create({
            data: {
                leadId: leadId || null,
                agentId: agentId || null,
                duration: duration || null,
                status: status || null,
                recordingUrl: recordingUrl || null,
                transcript: transcript || null,
                sentiment: sentiment || null,
            },
        })

        // Update lead's lastCall timestamp
        if (leadId) {
            await prisma.lead.update({
                where: { id: leadId },
                data: { lastCall: new Date() },
            })
        }

        return NextResponse.json({ callLog }, { status: 201 })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[CallLogs POST] Error:", error)
        return NextResponse.json({ error: "Failed to create call log" }, { status: 500 })
    }
}
