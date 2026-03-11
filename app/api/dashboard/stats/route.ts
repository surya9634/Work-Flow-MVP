import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"

/**
 * GET /api/dashboard/stats
 * Aggregated dashboard statistics for the authenticated user.
 * Returns high-level metrics + per-campaign performance + recent calls.
 */
export async function GET() {
    try {
        const userId = await requireAuth()

        const [leads, agents, campaigns, callLogs, recentCallRows] = await Promise.all([
            prisma.lead.findMany({ where: { userId }, select: { status: true, lastCall: true } }),
            prisma.agent.findMany({ where: { userId }, select: { status: true } }),
            prisma.campaign.findMany({
                where: { userId },
                select: { id: true, name: true, status: true },
            }),
            prisma.callLog.findMany({
                where: { 
                    agent: { userId },
                    leadId: { not: null }
                },
                select: { status: true, duration: true, sentiment: true },
            }),
            prisma.callLog.findMany({
                where: { 
                    agent: { userId },
                    leadId: { not: null }
                },
                orderBy: { createdAt: "desc" },
                take: 10,
                select: {
                    id: true,
                    status: true,
                    duration: true,
                    sentiment: true,
                    createdAt: true,
                    lead: { select: { id: true, name: true, phone: true } },
                    agent: { select: { id: true, name: true } },
                },
            }),
        ])

        const totalLeads = leads.length
        const totalCalls = callLogs.length
        const meetingsBooked = leads.filter((l) => l.status === "BOOKED").length
        const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length
        const activeAgents = agents.filter((a) => a.status === "ACTIVE").length
        const calledLeads = leads.filter((l) => l.lastCall).length
        const conversionRate = calledLeads > 0
            ? Math.round((meetingsBooked / calledLeads) * 1000) / 10
            : 0

        const totalDuration = callLogs.reduce((sum, l) => sum + (l.duration || 0), 0)
        const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0

        const leadsByStatus = leads.reduce((acc, l) => {
            const s = l.status || "NEW"
            acc[s] = (acc[s] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        // Raw SQL for new fields (outcome, campaignId) not yet in client types cache
        const outcomeCounts = await prisma.$queryRaw<{ outcome: string; count: number }[]>`
            SELECT outcome, COUNT(*) as count
            FROM "CallLog"
            WHERE "agentId" IN (SELECT id FROM "Agent" WHERE "userId" = ${userId})
            AND "leadId" IS NOT NULL
            GROUP BY outcome
        `
        const callsByOutcome = outcomeCounts.reduce((acc, r) => {
            acc[r.outcome || "unknown"] = Number(r.count)
            return acc
        }, {} as Record<string, number>)

        const sentimentBreakdown = callLogs.reduce((acc, l) => {
            if (l.sentiment) acc[l.sentiment] = (acc[l.sentiment] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        // Campaign performance via raw SQL to use new callLogs relation
        const campPerf = await prisma.$queryRaw<{ id: string; name: string; status: string; leadCount: number; callCount: number }[]>`
            SELECT c.id, c.name, c.status,
                   COUNT(DISTINCT l.id) as leadCount,
                   COUNT(DISTINCT cl.id) as callCount
            FROM "Campaign" c
            LEFT JOIN "Lead" l ON l."campaignId" = c.id
            LEFT JOIN "CallLog" cl ON cl."campaignId" = c.id
            WHERE c."userId" = ${userId}
            GROUP BY c.id, c.name, c.status
        `

        return NextResponse.json({
            totalLeads,
            totalCalls,
            meetingsBooked,
            activeCampaigns,
            activeAgents,
            conversionRate,
            avgCallDuration: avgDuration,
            leadsByStatus,
            callsByOutcome,
            sentimentBreakdown,
            campaignPerformance: campPerf.map((c) => ({
                id: c.id,
                name: c.name,
                status: c.status,
                totalLeads: Number(c.leadCount),
                totalCalls: Number(c.callCount),
            })),
            recentCalls: recentCallRows,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Dashboard Stats] Error:", error)
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }
}
