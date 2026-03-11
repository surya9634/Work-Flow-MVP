import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"
import { DeploymentService } from "@/lib/services/deployment"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/agents/[id]/pause
 * Pause an active agent.
 */
export async function POST(_req: Request, context: RouteContext) {
    try {
        const userId = await requireAuth()
        const { id } = await context.params

        const agent = await prisma.agent.findFirst({ where: { id, userId } })
        if (!agent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 })
        }

        const result = await DeploymentService.pauseAgent(id)
        return NextResponse.json(result)
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Agent Pause] Error:", error)
        return NextResponse.json({ error: "Failed to pause agent" }, { status: 500 })
    }
}
