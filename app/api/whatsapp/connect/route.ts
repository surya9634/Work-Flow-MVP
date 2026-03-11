import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { accessToken, wabaId, phoneNumberId } = body;

        if (!accessToken || !wabaId || !phoneNumberId) {
            return NextResponse.json({ error: "Missing required Meta payload" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Store the official Meta Access Token and WABA ID to the User
        await prisma.user.update({
            where: { id: user.id },
            data: {
                metaAccessToken: accessToken,
                wabaId: wabaId,
            }
        });

        // Make sure no other agent in the database is currently using this Phone ID.
        // This solves the multi-tenant routing issue when testing with the same Meta test number.
        await prisma.agent.updateMany({
            where: { whatsappPhoneId: phoneNumberId },
            data: { whatsappPhoneId: null }
        });

        // For simplicity in V1, we assign the connected WhatsApp number to the user's first Agent
        // In a true multi-agent V2, the user would select which Agent to bind the number to.
        const agent = await prisma.agent.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'asc' }
        });

        if (agent) {
            await prisma.agent.update({
                where: { id: agent.id },
                data: { whatsappPhoneId: phoneNumberId }
            });
        }

        return NextResponse.json({ success: true, message: "WhatsApp Business Account connected officially." });

    } catch (error) {
        console.error("Meta WhatsApp Connect Error:", error);
        return NextResponse.json({ error: "Failed to connect Meta WABA" }, { status: 500 });
    }
}
