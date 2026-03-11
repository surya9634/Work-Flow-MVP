import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/campaigns/[id]/resume
 * Resume a paused campaign.
 */
export async function POST(_req: Request, context: RouteContext) {
    try {
        const userId = await requireAuth()
        const { id } = await context.params

        const campaign = await prisma.campaign.findFirst({ where: { id, userId } })
        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
        }

        if (campaign.status !== "PAUSED") {
            return NextResponse.json(
                { error: "Campaign is not paused." },
                { status: 400 }
            )
        }

        const updated = await prisma.campaign.update({
            where: { id },
            data: { status: "ACTIVE" },
        })

        return NextResponse.json({ success: true, campaign: updated })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Campaign Resume] Error:", error)
        return NextResponse.json({ error: "Failed to resume campaign" }, { status: 500 })
    }
}
