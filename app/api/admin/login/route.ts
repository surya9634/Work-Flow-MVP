import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { password } = await request.json();

        const correctPassword = process.env.ADMIN_PASSWORD;
        const cookieSecret = process.env.ADMIN_COOKIE_SECRET;

        // Security check: ensure env variables are explicitly defined
        if (!correctPassword || !cookieSecret) {
            console.error("[Admin API] Server configuration error. Missing ADMIN secrets in .env.");
            return NextResponse.json({ error: "Internal server configuration error." }, { status: 500 });
        }

        // Compare subitted password against server crypt
        if (password !== correctPassword) {
            return NextResponse.json({ error: "Invalid admin password." }, { status: 401 });
        }

        const response = NextResponse.json({ success: true, message: "Welcome, Super Admin." });

        // Set the Impenetrable Cookie
        // The Middleware checks for this EXACT UUID on every single /admin request
        response.cookies.set({
            name: 'admin_session',
            value: cookieSecret,
            httpOnly: true, // Javascript cannot access this
            secure: process.env.NODE_ENV === "production", // HTTPS only in prod
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hour session expiration
            path: '/', // Valid across the whole app
        });

        return response;

    } catch (error: any) {
        console.error("[Admin Login Error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
