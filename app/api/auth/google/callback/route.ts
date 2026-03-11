import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(new URL('/dashboard/agents?error=NoCodeProvided', request.url));
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.redirect(new URL('/login?error=Unauthorized', request.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId!,
                client_secret: clientSecret!,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }).toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Google OAuth error:", data);
            return NextResponse.redirect(new URL('/dashboard/agents?error=OAuthFailed', request.url));
        }

        // Update the user record with the tokens
        const updateData: any = {
            googleAccessToken: data.access_token,
        };

        if (data.refresh_token) {
            updateData.googleRefreshToken = data.refresh_token;
        }

        await prisma.user.update({
            where: { email: session.user.email },
            data: updateData,
        });

        return NextResponse.redirect(new URL('/dashboard/agents?success=GoogleCalendarConnected', request.url));
    } catch (err: any) {
        console.error("OAuth Exchange Failed:", err);
        return NextResponse.redirect(new URL('/dashboard/agents?error=OAuthError', request.url));
    }
}
