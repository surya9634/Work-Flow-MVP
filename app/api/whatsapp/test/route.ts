import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get("text") || "Hello from test route";
    const to = searchParams.get("to");

    if (!to) return NextResponse.json({ error: "Missing 'to' parameter" }, { status: 400 });

    try {
        const agent = await prisma.agent.findFirst({ orderBy: { createdAt: 'asc' }, include: { user: true } });
        if (!agent) throw new Error("No agent found");

        const phoneNumberId = agent.whatsappPhoneId;
        const accessToken = agent.user.metaAccessToken;

        if (!phoneNumberId || !accessToken) {
             throw new Error("Meta Access Token or Phone Number ID not configured in Dashboard.");
        }

        console.log(`[Test Route] Sending to ${to} via ID ${phoneNumberId}`);

        const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to.replace('+', ''),
            type: "text",
            text: { body: text }
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Meta API Failed (Status: ${response.status}): ${errBody}`);
        }

        return NextResponse.json({ success: true, metaResponse: await response.json() });
    } catch (e: any) {
        console.error("[Test Route] Failed:", e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
