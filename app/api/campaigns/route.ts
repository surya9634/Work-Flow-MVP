import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"

/**
 * GET /api/campaigns
 * List all campaigns for the authenticated user with lead and call counts.
 */
export async function GET() {
    try {
        const userId = await requireAuth()

        const campaigns = await prisma.campaign.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
            include: {
                _count: { select: { leads: true } },
            },
        })

        return NextResponse.json({ campaigns })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Campaigns GET] Error:", error)
        return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 })
    }
}

/**
 * POST /api/campaigns
 * Create a new campaign with AI configuration.
 */
export async function POST(req: Request) {
    try {
        const userId = await requireAuth()
        const body = await req.json()
        const { name, type, schedule, agentId, objective, aiModel, aiPersonality, callBehavior } = body

        if (!name) {
            return NextResponse.json({ error: "Campaign name is required" }, { status: 400 })
        }

        // Verify agent belongs to user if provided, otherwise find a default agent
        let finalAgentId = agentId;
        if (finalAgentId) {
            const agent = await prisma.agent.findFirst({ where: { id: finalAgentId, userId } })
            if (!agent) {
                return NextResponse.json({ error: "Agent not found" }, { status: 404 })
            }
        } else {
            const defaultAgent = await prisma.agent.findFirst({ where: { userId } })
            if (defaultAgent) {
                finalAgentId = defaultAgent.id;
            }
        }

        const campaignId = `cmp_${Date.now()}`
        await prisma.$executeRaw`INSERT INTO "Campaign" (id, "userId", name, type, status, schedule, "agentId", objective, "aiModel", "aiPersonality", "callBehavior", "createdAt", "updatedAt")
            VALUES (${campaignId}, ${userId}, ${name}, ${type || "OUTBOUND"}, 'DRAFT',
                    ${schedule || null}, ${finalAgentId || null}, ${objective || null},
                    ${aiModel || "llama-3.3-70b-versatile"}, ${aiPersonality || null},
                    ${callBehavior ? JSON.stringify(callBehavior) : "{}"}, NOW(), NOW())`

        const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
        return NextResponse.json({ campaign }, { status: 201 })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Campaigns POST] Error:", error)
        return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 })
    }
}
