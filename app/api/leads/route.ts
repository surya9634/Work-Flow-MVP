import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUserId } from "@/lib/auth"

export async function GET() {
    try {
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const leads = await prisma.lead.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json({ leads })
    } catch (error) {
        console.error("Error fetching leads:", error)
        return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { name, phone, campaignId } = body

        if (!name || !phone) {
            return NextResponse.json({ error: "Name and phone required" }, { status: 400 })
        }

        const lead = await prisma.lead.create({
            data: {
                name,
                phone,
                userId,
                campaignId: campaignId || null,
            },
        })

        // Simulate triggering the AI call immediately
        // In a real scenario, this would call Vapi/Bland AI API
        setTimeout(async () => {
            try {
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: { status: "CALLING" },
                })
            } catch (e) {
                console.error("Error updating lead status:", e)
            }
        }, 1000)

        return NextResponse.json({ success: true, lead })
    } catch (error) {
        console.error("Error creating lead:", error)
        return NextResponse.json({ success: false, error: "Failed to process lead" }, { status: 500 })
    }
}
