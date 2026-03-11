import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/campaigns/[id]/pause
 * Pause a running campaign.
 */
export async function POST(_req: Request, context: RouteContext) {
    try {
        const userId = await requireAuth()
        const { id } = await context.params

        const campaign = await prisma.campaign.findFirst({ where: { id, userId } })
        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
        }

        const updated = await prisma.campaign.update({
            where: { id },
            data: { status: "PAUSED" },
        })

        return NextResponse.json({ success: true, campaign: updated })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Campaign Pause] Error:", error)
        return NextResponse.json({ error: "Failed to pause campaign" }, { status: 500 })
    }
}
