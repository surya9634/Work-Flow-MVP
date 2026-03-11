import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/active-calls
 * Fetches all currently active ("IN_PROGRESS") calls for the authenticated user.
 * Used by the Live Call Monitoring dashboard.
 */
export async function GET() {
    try {
        const userId = await requireAuth();

        const activeCalls = await prisma.callLog.findMany({
            where: {
                agent: { userId: userId },
                status: "IN_PROGRESS"
            },
            include: {
                agent: { select: { name: true } },
                lead: { select: { name: true, phone: true } }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        // Format for the UI
        const formattedCalls = activeCalls.map(call => {
            let parsedTranscript = [];
            if (call.transcript) {
                try {
                    parsedTranscript = typeof call.transcript === 'string'
                        ? JSON.parse(call.transcript)
                        : call.transcript;
                } catch (e) {
                    parsedTranscript = [];
                }
            }

            return {
                id: call.id,
                agentName: call.agent?.name || "AI Agent",
                leadName: call.lead?.name || "Sandbox User",
                leadPhone: call.lead?.phone || "N/A",
                status: call.status,
                startedAt: call.createdAt,
                transcript: parsedTranscript,
            };
        });

        return NextResponse.json({ activeCalls: formattedCalls });
    } catch (error) {
        console.error("[Active Calls API Error]:", error);
        return NextResponse.json({ error: "Failed to fetch active calls" }, { status: 500 });
    }
}
