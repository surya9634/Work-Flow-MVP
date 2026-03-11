import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function POST(req: Request) {
    await req.text().catch(() => { });

    const url = new URL(req.url);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";
    const wssUrl = appUrl.replace("https://", "wss://").replace("http://", "ws://");

    const agentId = url.searchParams.get("agentId") || "";
    const leadId = url.searchParams.get("leadId") || "";
    let leadName = "there";
    if (leadId) {
        try {
            const lead = await prisma.lead.findUnique({ where: { id: leadId } });
            if (lead?.name) leadName = lead.name;
        } catch (e) {
            console.error("[TwiML] Failed to fetch lead name:", e);
        }
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="${wssUrl}/api/twilio/stream">
            <Parameter name="direction" value="outbound" />
            <Parameter name="agentId" value="${agentId}" />
            <Parameter name="leadId" value="${leadId}" />
            <Parameter name="leadName" value="${leadName}" />
            <Parameter name="greetingDone" value="false" />
        </Stream>
    </Connect>
</Response>`;

    return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" }
    });
}
