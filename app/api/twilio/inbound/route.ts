import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";
    const wssUrl = appUrl.replace("https://", "wss://").replace("http://", "ws://");

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="${wssUrl}/api/twilio/stream" />
    </Connect>
</Response>`;

    return new NextResponse(twiml, {
        headers: {
            "Content-Type": "text/xml"
        }
    });
}
