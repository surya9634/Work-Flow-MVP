import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"
import { DeploymentService } from "@/lib/services/deployment"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/agents/[id]/deploy
 * Deploy an agent — sets status to ACTIVE and assigns a phone number.
 */
export async function POST(_req: Request, context: RouteContext) {
    try {
        const userId = await requireAuth()
        const { id } = await context.params

        // Verify ownership
        const agent = await prisma.agent.findFirst({ where: { id, userId } })
        if (!agent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 })
        }

        const result = await DeploymentService.deployAgent(id)
        return NextResponse.json(result, { status: result.success ? 200 : 400 })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Agent Deploy] Error:", error)
        return NextResponse.json({ error: "Failed to deploy agent" }, { status: 500 })
    }
}
