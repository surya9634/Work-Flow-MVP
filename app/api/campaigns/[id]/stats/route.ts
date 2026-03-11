import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET /api/campaigns/[id]/stats
 * Per-campaign analytics: calls, outcomes, conversion rate, avg duration.
 */
export async function GET(_req: Request, context: RouteContext) {
    try {
        const userId = await requireAuth()
        const { id } = await context.params

        const campaign = await prisma.campaign.findFirst({ where: { id, userId } })
        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
        }

        const [leads, callLogs] = await Promise.all([
            prisma.lead.findMany({ where: { campaignId: id }, select: { status: true } }),
            prisma.$queryRaw<{ status: string | null; outcome: string | null; duration: number | null; sentiment: string | null }[]>`
                SELECT status, outcome, duration, sentiment FROM "CallLog" WHERE "campaignId" = ${id}
            `,
        ])

        const totalLeads = leads.length
        const totalCalls = callLogs.length

        // Outcome breakdown (new field — via raw SQL)
        const outcomeBreakdown: Record<string, number> = {}
        for (const log of callLogs) {
            const key = log.outcome || "unknown"
            outcomeBreakdown[key] = (outcomeBreakdown[key] || 0) + 1
        }

        // Lead status breakdown
        const leadsByStatus: Record<string, number> = {}
        for (const lead of leads) {
            const key = lead.status || "NEW"
            leadsByStatus[key] = (leadsByStatus[key] || 0) + 1
        }

        const totalDuration = callLogs.reduce((sum, l) => sum + (l.duration || 0), 0)
        const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0

        const converted = callLogs.filter((l) => l.outcome === "booked" || l.outcome === "interested").length
        const conversionRate = totalCalls > 0 ? Math.round((converted / totalCalls) * 1000) / 10 : 0

        const sentimentBreakdown: Record<string, number> = {}
        for (const log of callLogs) {
            if (log.sentiment) {
                sentimentBreakdown[log.sentiment] = (sentimentBreakdown[log.sentiment] || 0) + 1
            }
        }

        return NextResponse.json({
            campaignId: id,
            campaignName: campaign.name,
            totalLeads,
            totalCalls,
            avgCallDuration: avgDuration,
            conversionRate,
            outcomeBreakdown,
            leadsByStatus,
            sentimentBreakdown,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Campaign Stats] Error:", error)
        return NextResponse.json({ error: "Failed to fetch campaign stats" }, { status: 500 })
    }
}
