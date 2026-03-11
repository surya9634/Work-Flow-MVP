import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"

/**
 * GET /api/agents
 * List all agents for the authenticated user.
 */
export async function GET() {
    try {
        const userId = await requireAuth()

        const agents = await prisma.agent.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
            include: {
                _count: { select: { callLogs: true, versions: true } },
            },
        })

        return NextResponse.json({ agents })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Agents GET] Error:", error)
        return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 })
    }
}

/**
 * POST /api/agents
 * Create an agent manually.
 */
export async function POST(req: Request) {
    try {
        const userId = await requireAuth()
        const body = await req.json()
        const { name, systemPrompt, openingScript, voiceProfile, status } = body

        if (!name) {
            return NextResponse.json({ error: "Agent name is required" }, { status: 400 })
        }

        const agent = await prisma.agent.create({
            data: {
                userId,
                name,
                systemPrompt: systemPrompt || null,
                openingScript: openingScript || null,
                voiceProfile: voiceProfile ? JSON.stringify(voiceProfile) : "{}",
                status: status || "DRAFT",
                version: 1,
            },
        })

        // Save initial version snapshot
        await prisma.agentVersion.create({
            data: {
                agentId: agent.id,
                version: 1,
                configSnapshot: JSON.stringify({ name, systemPrompt, openingScript, voiceProfile }),
            },
        })

        return NextResponse.json({ agent }, { status: 201 })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Agents POST] Error:", error)
        return NextResponse.json({ error: "Failed to create agent" }, { status: 500 })
    }
}
