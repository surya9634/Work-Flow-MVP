import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const userId = await requireAuth();
        const { agentId } = await req.json();

        // Check if agent exists and belongs to user
        let agent = null;
        if (agentId) {
            agent = await prisma.agent.findFirst({
                where: { id: agentId, userId }
            });
            if (!agent) {
                return NextResponse.json({ error: "Agent not found" }, { status: 404 });
            }
        }

        // Create a new sandbox IN_PROGRESS CallLog
        const callLog = await prisma.callLog.create({
            data: {
                agentId: agent?.id || null,
                status: "IN_PROGRESS",
                transcript: JSON.stringify([]),
            }
        });

        return NextResponse.json({ callId: callLog.id });
    } catch (error) {
        console.error("[Start Call API Error]:", error);
        return NextResponse.json({ error: "Failed to start call log" }, { status: 500 });
    }
}
