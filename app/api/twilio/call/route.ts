import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@prisma/client";
import { getBaseUrl, twilioClient, twilioPhoneNumber } from "@/lib/services/twilio";
import { generateSpeechWithSarvam } from "@/lib/services/sarvam";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import fs from "fs/promises";
import path from "path";
import twilio from "twilio";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();
const VoiceResponse = twilio.twiml.VoiceResponse;

// Temp audio folder (Vercel Serverless only allows writing to /tmp)
const AUDIO_DIR = path.join("/tmp");

async function ensureAudioDir() {
    try {
        await fs.access(AUDIO_DIR);
    } catch {
        await fs.mkdir(AUDIO_DIR, { recursive: true });
    }
}

/**
 * Triggers an outbound call via Twilio and sets up the opening prompt line.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { agentId, leadId } = await req.json();
        if (!agentId || !leadId) {
            return NextResponse.json({ error: "Missing agentId or leadId" }, { status: 400 });
        }

        const agent = await prisma.agent.findUnique({ where: { id: agentId } });
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });

        if (!agent || !lead) {
            return NextResponse.json({ error: "Agent or Lead not found" }, { status: 404 });
        }

        if (agent.userId !== session.user.id || lead.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (!twilioPhoneNumber) {
            return NextResponse.json({ error: "Twilio phone number not configured" }, { status: 500 });
        }

        // 1. Create a CallLog entry for analytics/tracking 
        // We start with status initiating. Twilio will update this via webhook.
        const callLog = await prisma.callLog.create({
            data: {
                agentId: agent.id,
                leadId: lead.id,
                status: "initiating",
                transcript: `System: Initiating Twilio call to ${lead.phone}\n`
            }
        });

        // 2. Generate Opening Audio (TTS)
        // Twilio requires an initial TwiML payload when the user picks up.
        // We will generate the agent's greeting right now, host the file, and return `<Play>`.
        await ensureAudioDir();
        
        const voiceProfile = agent.voiceProfile ? JSON.parse(agent.voiceProfile) : {};
        const voiceId = voiceProfile.voiceId || "priya-hi";
        const textGreeting = agent.openingScript ? 
            agent.openingScript.split("\n")[0] || "Namaste" 
            : "Namaste";

        const audioBuffer = await generateSpeechWithSarvam(textGreeting, voiceId);
        
        const filename = `${callLog.id}_opening_${uuidv4()}.wav`;
        const filepath = path.join(AUDIO_DIR, filename);
        await fs.writeFile(filepath, audioBuffer);
        
        const publicAudioUrl = `${getBaseUrl()}/api/twilio/audio/${filename}`;

        // 3. Build the Initial TwiML Instructions for when they answer
        const twiml = new VoiceResponse();
        
        // Step A: Play greeting
        twiml.play(publicAudioUrl);
        
        // Step B: Immediately start recording their response and forward it to our webhook
        twiml.record({
            action: `${getBaseUrl()}/api/twilio/webhook?callLogId=${callLog.id}`, // our webhook URL to handle STT+LLM
            method: 'POST',
            timeout: 2, 
            maxLength: 30, // 30 sec max reply
            playBeep: false
        });

        // 4. Fire the Outbound Call via Twilio REST API
        const call = await twilioClient.calls.create({
            twiml: twiml.toString(),
            to: lead.phone,
            from: twilioPhoneNumber,
            // Track status updates
            statusCallback: `${getBaseUrl()}/api/twilio/webhook?callLogId=${callLog.id}`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
            statusCallbackMethod: 'POST',
        });

        // Since the schema doesn't have vendorId, we skip updating it. 
        // We already have the callLogId anyway.
        // await prisma.callLog.update({ ... });

        return NextResponse.json({
            success: true,
            message: "Call initiated via Twilio",
            callSid: call.sid
        });

    } catch (error: any) {
        console.error("[Twilio Dial Error]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
