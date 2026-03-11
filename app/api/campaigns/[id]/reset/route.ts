import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/campaigns/[id]/reset
 * Resets a campaign back to DRAFT state and resets all its leads to NEW.
 */
export async function POST(_req: Request, context: RouteContext) {
    try {
        const userId = await requireAuth()
        const { id } = await context.params

        const campaign = await prisma.campaign.findFirst({ where: { id, userId } })
        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
        }

        // Reset Lead statuses
        await prisma.lead.updateMany({
            where: { campaignId: id },
            data: { status: "NEW" },
        })

        // Reset Campaign status
        const updated = await prisma.campaign.update({
            where: { id },
            data: { status: "DRAFT" },
        })

        return NextResponse.json({ success: true, campaign: updated })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Campaign Reset] Error:", error)
        return NextResponse.json({ error: "Failed to reset campaign" }, { status: 500 })
    }
}
