import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"

/**
 * GET /api/settings/business
 * Retrieve business info from the User record.
 *
 * POST /api/settings/business
 * Update businessName, industry, businessDesc on the User record.
 */

export async function GET() {
    try {
        const userId = await requireAuth()

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                businessName: true,
                industry: true,
                businessDesc: true,
            },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Get onboardingComplete via raw SQL (new field)
        const rows = await prisma.$queryRaw<{ onboardingComplete: number }[]>`SELECT "onboardingComplete" FROM "User" WHERE id = ${userId} LIMIT 1`
        const onboardingComplete = rows[0]?.onboardingComplete === 1

        return NextResponse.json({ business: { ...user, onboardingComplete } })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Settings Business GET] Error:", error)
        return NextResponse.json({ error: "Failed to fetch business settings" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const userId = await requireAuth()
        const body = await req.json()
        const { businessName, industry, businessDesc } = body

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(businessName !== undefined && { businessName }),
                ...(industry !== undefined && { industry }),
                ...(businessDesc !== undefined && { businessDesc }),
            },
            select: {
                id: true,
                businessName: true,
                industry: true,
                businessDesc: true,
            },
        })

        return NextResponse.json({ business: updated })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Settings Business POST] Error:", error)
        return NextResponse.json({ error: "Failed to update business settings" }, { status: 500 })
    }
}
