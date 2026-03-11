import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUserId } from "@/lib/auth"

export async function GET() {
    try {
        const userId = await getAuthUserId()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const config = await prisma.agentConfig.findUnique({
            where: { userId },
        })

        return NextResponse.json(config || {})
    } catch (error) {
        console.error("Settings GET error:", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getAuthUserId()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const { name, voice, language, greeting, objective, tone } = body

        const config = await prisma.agentConfig.upsert({
            where: { userId: userId },
            update: {
                name,
                voice,
                language,
                greeting,
                objective,
                tone,
            },
            create: {
                userId: userId,
                name,
                voice,
                language,
                greeting,
                objective,
                tone,
            },
        })

        return NextResponse.json(config)
    } catch (error) {
        console.error("Settings POST error:", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
