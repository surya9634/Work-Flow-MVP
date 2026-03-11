import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Double check the Edge Middleware protection natively on the Server
async function verifyAdmin() {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session')?.value;
    if (adminSession !== process.env.ADMIN_COOKIE_SECRET) {
        throw new Error("Unauthorized Access");
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await verifyAdmin();
        const id = (await params).id;
        const body = await request.json();

        // Extract updatable fields
        const { name, businessName, credits, metaAccessToken, wabaId } = body;

        // Ensure credits are strictly numeric if provided
        const updateData: any = {
            name,
            businessName,
            metaAccessToken,
            wabaId
        };

        if (credits !== undefined) {
            updateData.credits = parseInt(credits, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                businessName: true,
                createdAt: true,
                credits: true,
                metaAccessToken: true,
                wabaId: true
            }
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error: any) {
        console.error("[Admin API Update User]:", error);
        return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await verifyAdmin();
        const id = (await params).id;

        // Perform a hard delete on the user
        // Due to foreign key constraints, Prisma handles cascading deletions if relations are configured,
        // but if not, this guarantees the user record itself is purged.
        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "User deleted successfully." });
    } catch (error: any) {
        console.error("[Admin API Delete User]:", error);
        return NextResponse.json({ error: "Failed to delete user. Ensure cascading relationships allow deletion." }, { status: 500 });
    }
}
