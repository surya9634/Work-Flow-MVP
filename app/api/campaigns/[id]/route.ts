import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * DELETE /api/campaigns/[id]
 * Deletes a campaign. Unlinks leads and cascade deletes call logs if necessary.
 */
export async function DELETE(_req: Request, context: RouteContext) {
    try {
        const userId = await requireAuth()
        const { id } = await context.params

        const campaign = await prisma.campaign.findFirst({ where: { id, userId } })
        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
        }

        // Unlink leads so they aren't deleted but remain in the general pool
        await prisma.lead.updateMany({
            where: { campaignId: id },
            data: { campaignId: null },
        })

        // Alternatively or additionally, if we had strict relations to CallLog,
        // we'd delete logs. Currently CallLogs link to leads and campaigns.
        await prisma.callLog.deleteMany({
            where: { campaignId: id }
        })

        // Delete the campaign
        await prisma.campaign.delete({
            where: { id },
        })

        return NextResponse.json({ success: true, deleted: id })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Campaign Delete] Error:", error)
        return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 })
    }
}

/**
 * PATCH /api/campaigns/[id]
 * Updates a campaign's config (name, type, objective, aiPersonality)
 */
export async function PATCH(req: Request, context: RouteContext) {
    try {
        const userId = await requireAuth()
        const { id } = await context.params
        const body = await req.json()

        const campaign = await prisma.campaign.findFirst({ where: { id, userId } })
        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
        }

        const { name, type, objective, aiPersonality } = body

        const updated = await prisma.campaign.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(type !== undefined && { type }),
                ...(objective !== undefined && { objective }),
                ...(aiPersonality !== undefined && { aiPersonality }),
            },
        })

        return NextResponse.json({ campaign: updated })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Campaign PATCH] Error:", error)
        return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 })
    }
}
