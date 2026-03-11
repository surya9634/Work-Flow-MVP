import { NextResponse } from 'next/server';

export async function GET() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
    const scope = "https://www.googleapis.com/auth/calendar.events";

    if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
        return NextResponse.json({ error: "Missing Google Client ID/Secret in .env" }, { status: 500 });
    }

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

    return NextResponse.redirect(url);
}
