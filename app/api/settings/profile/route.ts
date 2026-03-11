import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"

/**
 * GET /api/settings/profile
 * Return user's profile info.
 *
 * POST /api/settings/profile
 * Update user's name.
 */

export async function GET() {
    try {
        const userId = await requireAuth()

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                credits: true,
                createdAt: true,
            },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // onboardingComplete is a new field — query via raw SQL
        const rows = await prisma.$queryRaw<{ onboardingComplete: number }[]>`SELECT "onboardingComplete" FROM "User" WHERE id = ${userId} LIMIT 1`
        const onboardingComplete = rows[0]?.onboardingComplete === 1

        return NextResponse.json({ profile: { ...user, onboardingComplete } })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Settings Profile GET] Error:", error)
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const userId = await requireAuth()
        const body = await req.json()
        const { name } = body

        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "name is required" }, { status: 400 })
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { name },
            select: { id: true, name: true, email: true },
        })

        return NextResponse.json({ profile: updated })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Settings Profile POST] Error:", error)
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }
}
