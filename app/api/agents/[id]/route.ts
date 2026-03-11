import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET /api/agents/[id]
 * Get a single agent with version history.
 */
export async function GET(_req: Request, context: RouteContext) {
    try {
        const userId = await requireAuth()
        const { id } = await context.params

        const agent = await prisma.agent.findFirst({
            where: { id, userId },
            include: {
                versions: { orderBy: { version: "desc" }, take: 10 },
                callLogs: { orderBy: { createdAt: "desc" }, take: 20 },
            },
        })

        if (!agent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 })
        }

        return NextResponse.json({ agent })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Agent GET] Error:", error)
        return NextResponse.json({ error: "Failed to fetch agent" }, { status: 500 })
    }
}

/**
 * PATCH /api/agents/[id]
 * Update agent config and increment version.
 */
export async function PATCH(req: Request, context: RouteContext) {
    try {
        const userId = await requireAuth()
        const { id } = await context.params
        const body = await req.json()

        const agent = await prisma.agent.findFirst({ where: { id, userId } })
        if (!agent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 })
        }

        const newVersion = agent.version + 1
        const { name, systemPrompt, openingScript, voiceProfile, status, llmModel } = body

        // Save version snapshot
        await prisma.agentVersion.create({
            data: {
                agentId: id,
                version: newVersion,
                configSnapshot: JSON.stringify(body),
            },
        })

        const updated = await prisma.agent.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(systemPrompt !== undefined && { systemPrompt }),
                ...(openingScript !== undefined && { openingScript }),
                ...(voiceProfile !== undefined && { voiceProfile: JSON.stringify(voiceProfile) }),
                ...(status !== undefined && { status }),
                ...(llmModel !== undefined && { llmModel }),
                configSnapshot: JSON.stringify(body),
                version: newVersion,
            },
        })

        return NextResponse.json({ agent: updated })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Agent PATCH] Error:", error)
        return NextResponse.json({ error: "Failed to update agent" }, { status: 500 })
    }
}

/**
 * DELETE /api/agents/[id]
 * Delete agent and all its versions.
 */
export async function DELETE(_req: Request, context: RouteContext) {
    try {
        const userId = await requireAuth()
        const { id } = await context.params

        const agent = await prisma.agent.findFirst({ where: { id, userId } })
        if (!agent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 })
        }

        // Delete versions first (FK constraint)
        await prisma.agentVersion.deleteMany({ where: { agentId: id } })
        // Unlink call logs
        await prisma.callLog.updateMany({ where: { agentId: id }, data: { agentId: null } })
        // Delete agent
        await prisma.agent.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Agent DELETE] Error:", error)
        return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 })
    }
}
