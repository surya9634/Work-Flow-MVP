import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";
import { getTopObjections, generateCounterScript } from "@/lib/services/objection-analyzer";

/**
 * GET /api/analytics
 * Returns per-agent analytics: sentiment trend, talk ratio, objection frequency, conversion funnel.
 */
export async function GET(req: Request) {
    try {
        const userId = await requireAuth();
        const { searchParams } = new URL(req.url);
        const agentId = searchParams.get("agentId");
        const days = parseInt(searchParams.get("days") || "30");

        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        // Get all agents for this user (optionally filter by agentId)
        const agents = await prisma.agent.findMany({
            where: { userId, ...(agentId ? { id: agentId } : {}) },
            select: { id: true, name: true },
        });

        const agentIds = agents.map((a) => a.id);

        // Fetch call logs — cast as any[] since Prisma client may have stale types
        // until the TS server restarts after schema changes.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const calls: any[] = await prisma.callLog.findMany({
            where: { agentId: { in: agentIds }, createdAt: { gte: since } },
            orderBy: { createdAt: "asc" },
        });

        // Per-agent stats
        const agentStats = await Promise.all(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            agents.map(async (agent: any) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const agentCalls: any[] = calls.filter((c: any) => c.agentId === agent.id);
                const total = agentCalls.length;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const booked = agentCalls.filter((c: any) => c.outcome === "booked").length;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const interested = agentCalls.filter((c: any) => c.outcome === "interested" || c.outcome === "booked").length;
                const avgTalkRatio = total > 0
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ? agentCalls.reduce((s: number, c: any) => s + (c.talkRatio ?? 0.5), 0) / total
                    : 0;
                const avgDuration = total > 0
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ? Math.round(agentCalls.reduce((s: number, c: any) => s + (c.duration ?? 60), 0) / total)
                    : 0;

                const sentimentBreakdown = {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    positive: agentCalls.filter((c: any) => c.sentiment === "positive").length,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    neutral: agentCalls.filter((c: any) => c.sentiment === "neutral").length,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    negative: agentCalls.filter((c: any) => c.sentiment === "negative").length,
                };

                const funnel = {
                    calls: total, interested, booked,
                    conversionRate: total > 0 ? Math.round((booked / total) * 100) : 0,
                };

                const dailyVolume: Record<string, number> = {};
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                for (const c of agentCalls) { const day = (c.createdAt as Date).toISOString().slice(0, 10); dailyVolume[day] = (dailyVolume[day] || 0) + 1; }

                const rawObjections = await getTopObjections(agent.id, 5);
                const topObjections = await Promise.all(
                    rawObjections.map(async (o: { agentId: string; objection: string; count: number }) => ({
                        objection: o.objection,
                        count: o.count,
                        counterScript: await generateCounterScript(o.objection, "AI voice agent platform"),
                    }))
                );

                return { agentId: agent.id, agentName: agent.name, totalCalls: total, avgTalkRatio: Math.round(avgTalkRatio * 100) / 100, avgDuration, sentimentBreakdown, funnel, dailyVolume, topObjections };
            })
        );

        const totalCalls = calls.length;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalBooked = calls.filter((c: any) => c.outcome === "booked").length;
        const overallConversion = totalCalls > 0 ? Math.round((totalBooked / totalCalls) * 100) : 0;
        const avgTalkRatio = totalCalls > 0
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? Math.round((calls.reduce((s: number, c: any) => s + (c.talkRatio ?? 0.5), 0) / totalCalls) * 100) / 100
            : 0;

        return NextResponse.json({
            overview: { totalCalls, totalBooked, overallConversion, avgTalkRatio, days },
            agents: agentStats,
        });
    } catch (error) {
        if (error instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        console.error("[Analytics API] Error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
