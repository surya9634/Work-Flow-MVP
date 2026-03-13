import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";
import { makeOutboundCall, isIndianNumber } from "@/lib/services/exotel";
import { synthesizeSpeech } from "@/lib/tts-server";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * POST /api/exotel/call
 *
 * Triggers an outbound call via Exotel for an Indian (+91) lead.
 * The caller should check isIndianNumber() first; this route
 * assumes the number is already confirmed to be Indian.
 *
 * Body: { leadId, agentId }
 */
export async function POST(req: Request) {
    try {
        const userId = await requireAuth();
        const { leadId, agentId } = await req.json();

        if (!leadId || !agentId) {
            return NextResponse.json({ error: "leadId and agentId are required" }, { status: 400 });
        }

        // Load lead + agent
        const [lead, agent] = await Promise.all([
            prisma.lead.findFirst({ where: { id: leadId, userId } }),
            prisma.agent.findFirst({ where: { id: agentId, userId } }),
        ]);

        if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

        const virtualNumber = process.env.EXOTEL_VIRTUAL_NUMBER;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";

        if (!virtualNumber) {
            return NextResponse.json({ error: "EXOTEL_VIRTUAL_NUMBER not configured" }, { status: 500 });
        }

        if (!isIndianNumber(lead.phone)) {
            return NextResponse.json({ error: "Use Twilio for non-Indian numbers" }, { status: 400 });
        }

        // Pre-generate the opening TTS audio and store in /tmp
        const openingText = agent.openingScript || `Hi, this is ${agent.name}. Do you have a quick moment?`;
        let openingAudioPath: string | null = null;

        try {
            const voiceProfile = agent.voiceProfile ? JSON.parse(agent.voiceProfile) : {};
            const voiceId = voiceProfile.voiceId;
            const base64Audio = await synthesizeSpeech(openingText, voiceId);
            const audioDir = path.join(os.tmpdir(), "exotel-audio");
            if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

            // We'll use callLogId as file name — create log first
            const callLog = await prisma.callLog.create({
                data: { leadId, agentId, campaignId: lead.campaignId, status: "INITIATED" },
            });

            openingAudioPath = path.join(audioDir, `${callLog.id}_0.mp3`);
            fs.writeFileSync(openingAudioPath, Buffer.from(base64Audio, "base64"));

            // Webhook URL Exotel will hit when prospect answers
            const webhookUrl = `${appUrl}/api/exotel/webhook?callLogId=${callLog.id}&agentId=${agentId}&leadId=${leadId}&turn=0`;
            const statusUrl  = `${appUrl}/api/exotel/webhook?callLogId=${callLog.id}&event=status`;

            // Initiate the call
            const exotelCall = await makeOutboundCall({
                to: lead.phone,
                callerId: virtualNumber,
                webhookUrl,
                statusCallbackUrl: statusUrl,
                timeLimit: 1800,
            });

            // Update call log with Exotel callSid
            await prisma.callLog.update({
                where: { id: callLog.id },
                data: { recordingUrl: exotelCall.callSid, status: "QUEUED" },
            });

            console.log(`[Exotel] Call initiated: ${exotelCall.callSid} → ${lead.phone}`);
            return NextResponse.json({
                success: true,
                callSid: exotelCall.callSid,
                callLogId: callLog.id,
                status: exotelCall.status,
            });

        } catch (callErr: any) {
            console.error("[Exotel] Call initiation failed:", callErr);
            return NextResponse.json({ error: callErr.message || "Failed to initiate call" }, { status: 500 });
        }
    } catch (error) {
        if (error instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        console.error("[Exotel Call Route] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
