import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET /api/leads/[id]
 * Get a single lead with call history.
 */
export async function GET(_req: Request, context: RouteContext) {
    try {
        const userId = await requireAuth()
        const { id } = await context.params

        const lead = await prisma.lead.findFirst({
            where: { id, userId },
            include: {
                callLogs: {
                    orderBy: { createdAt: "desc" },
                    take: 20,
                    include: { leadScore: true },
                },
                campaign: { select: { id: true, name: true } },
            },
        })

        if (!lead) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 })
        }

        return NextResponse.json({ lead })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Lead GET] Error:", error)
        return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 })
    }
}

/**
 * PATCH /api/leads/[id]
 * Update lead status, score, metadata, or campaign assignment.
 */
export async function PATCH(req: Request, context: RouteContext) {
    try {
        const userId = await requireAuth()
        const { id } = await context.params
        const body = await req.json()

        const lead = await prisma.lead.findFirst({ where: { id, userId } })
        if (!lead) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 })
        }

        const { status, score, metadata, campaignId, name, phone, email } = body

        const updated = await prisma.lead.update({
            where: { id },
            data: {
                ...(status !== undefined && { status }),
                ...(score !== undefined && { score }),
                ...(metadata !== undefined && { metadata: JSON.stringify(metadata) }),
                ...(campaignId !== undefined && { campaignId }),
                ...(name !== undefined && { name }),
                ...(phone !== undefined && { phone }),
                ...(email !== undefined && { email }),
            },
        })

        return NextResponse.json({ lead: updated })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Lead PATCH] Error:", error)
        return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
    }
}

/**
 * DELETE /api/leads/[id]
 * Delete a lead and its call logs.
 */
export async function DELETE(_req: Request, context: RouteContext) {
    try {
        const userId = await requireAuth()
        const { id } = await context.params

        const lead = await prisma.lead.findFirst({ where: { id, userId } })
        if (!lead) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 })
        }

        // Delete call logs (FK constraint) — delete lead scores first
        const callLogs = await prisma.callLog.findMany({
            where: { leadId: id },
            select: { id: true },
        })
        const callLogIds = callLogs.map((c) => c.id)
        await prisma.leadScore.deleteMany({ where: { callLogId: { in: callLogIds } } })
        await prisma.callLog.deleteMany({ where: { leadId: id } })
        await prisma.lead.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Lead DELETE] Error:", error)
        return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 })
    }
}
