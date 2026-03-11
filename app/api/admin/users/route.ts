import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Double check the Edge Middleware protection natively on the Server
async function verifyAdmin() {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session')?.value;
    if (adminSession !== process.env.ADMIN_COOKIE_SECRET) {
        throw new Error("Unauthorized Access");
    }
}

export async function GET() {
    try {
        await verifyAdmin();
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
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
        return NextResponse.json(users);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
}

export async function POST(request: Request) {
    try {
        await verifyAdmin();
        const body = await request.json();
        const { name, email, password, businessName, credits } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        // Hash the password securely before entering the database
        const passwordHash = await bcrypt.hash(password, 10);

        // Ensure credits are an integer, defaulting to 500
        const parsedCredits = credits ? parseInt(credits, 10) : 500;

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                businessName,
                credits: parsedCredits
            }
        });

        // Remove hash from the response for security
        const { passwordHash: _, ...safeUser } = user;

        return NextResponse.json({ success: true, user: safeUser });
    } catch (error: any) {
        console.error("[Admin API Create User]:", error);
        return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
    }
}
