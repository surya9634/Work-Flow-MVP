import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"
import { groq } from "@/lib/groq"
import { twilioClient, twilioPhoneNumber } from "@/lib/services/twilio"
import { generateSpeechWithSarvam } from "@/lib/services/sarvam"
import fs from "fs/promises"
import path from "path"
import twilio from "twilio"
import { v4 as uuidv4 } from "uuid"

const VoiceResponse = twilio.twiml.VoiceResponse;
const AUDIO_DIR = path.join(process.cwd(), "public", "temp-audio");

async function ensureAudioDir() {
    try {
        await fs.access(AUDIO_DIR);
    } catch {
        await fs.mkdir(AUDIO_DIR, { recursive: true });
    }
}

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/campaigns/[id]/activate
 * Activate a campaign — sets status to ACTIVE.
 */
export async function POST(_req: Request, context: RouteContext) {
    try {
        const userId = await requireAuth()
        const { id } = await context.params

        const campaign = await prisma.campaign.findFirst({
            where: { id, userId },
            include: { leads: true }
        })
        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
        }

        if (!campaign.agentId) {
            return NextResponse.json(
                { error: "Campaign must have an agent assigned before activation." },
                { status: 400 }
            )
        }

        const updated = await prisma.campaign.update({
            where: { id },
            data: { status: "ACTIVE" },
        })

        // We'll check credentials inside the loop depending on the route needed

        let queuedCalls = 0;

        // Loop through leads and dispatch calls
        for (const lead of campaign.leads) {
            if (lead.status === "NEW") {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

                // --- WHATSAPP DISPATCH ---
                if (campaign.type === "WHATSAPP" || campaign.type === "BOTH") {
                    try {
                        // The user relation isn't explicitly included in findFirst for the agent, let's fetch it if needed
                        let metaAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
                        let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

                        if (campaign.agentId) {
                            const agent = await prisma.agent.findUnique({ where: { id: campaign.agentId }, include: { user: true } });
                            if (agent?.user?.metaAccessToken) metaAccessToken = agent.user.metaAccessToken;
                            if (agent?.whatsappPhoneId) phoneNumberId = agent.whatsappPhoneId;
                        }

                        if (!metaAccessToken || !phoneNumberId) {
                            console.error("[Campaign Activate] Missing WhatsApp credentials for outbound campaign.");
                        } else {
                            const systemPrompt = "You are an AI assistant. Keep the first message short, friendly, and engaging like a real text message.";

                            const completion = await groq.chat.completions.create({
                                messages: [
                                    { role: "system", content: systemPrompt },
                                    { role: "user", content: `Start the conversation with the lead named ${lead.name}. Objective: ${campaign.objective || "Say hello"}.` }
                                ],
                                model: campaign.aiModel || "llama-3.3-70b-versatile",
                                temperature: 0.7,
                                max_tokens: 150,
                            });

                            const aiMessage = completion.choices[0]?.message?.content || "Hi there!";

                            const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
                            const payload = {
                                messaging_product: "whatsapp",
                                recipient_type: "individual",
                                to: lead.phone.replace('+', ''),
                                type: "text",
                                text: { body: aiMessage }
                            };

                            const response = await fetch(url, {
                                method: "POST",
                                headers: {
                                    "Authorization": `Bearer ${metaAccessToken}`,
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify(payload)
                            });

                            if (response.ok) {
                                await prisma.interactionLog.create({
                                    data: {
                                        agentId: campaign.agentId,
                                        campaignId: campaign.id,
                                        leadId: lead.id,
                                        type: "WHATSAPP",
                                        direction: "OUTBOUND",
                                        message: aiMessage,
                                        status: "SENT"
                                    }
                                });
                                queuedCalls++;
                            } else {
                                console.error(`[Campaign Activate] Meta WhatsApp send failed:`, await response.text());
                            }
                        }
                    } catch (e) {
                        console.error(`[Campaign Activate] Failed WhatsApp dispatch to ${lead.phone}:`, e);
                    }
                }

                // --- VOICE DISPATCH ---
                if (campaign.type === "VOICE" || campaign.type === "BOTH" || campaign.type === "OUTBOUND") {
                    try {
                        console.log(`[Voice Dispatch] Attempting dial for lead ${lead.phone}`);
                        console.log(`[Voice Dispatch] Routing number ${lead.phone} to Twilio...`);
                        
                        // 1. Create Call Log
                        const callLog = await prisma.callLog.create({
                            data: {
                                agentId: campaign.agentId,
                                leadId: lead.id,
                                campaignId: campaign.id,
                                status: "initiating",
                                transcript: `System: Initiating Twilio campaign call to ${lead.phone}\n`
                            }
                        });

                        // 2. Generate Opening Greeting (Sarvam)
                        await ensureAudioDir();
                        const agent = await prisma.agent.findUnique({ where: { id: campaign.agentId || "" } });
                        const voiceProfile = agent?.voiceProfile ? JSON.parse(agent.voiceProfile) : {};
                        const voiceId = voiceProfile.voiceId || "priya-hi";
                        const textGreeting = agent?.openingScript ? 
                            agent.openingScript.split("\n")[0] || "Namaste" 
                            : "Namaste";

                        const audioBuffer = await generateSpeechWithSarvam(textGreeting, voiceId);
                        const filename = `${callLog.id}_opening_${uuidv4()}.wav`;
                        const filepath = path.join(AUDIO_DIR, filename);
                        await fs.writeFile(filepath, audioBuffer);
                        
                        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-ngrok-url.ngrok.app";
                        const publicAudioUrl = `${appUrl}/api/twilio/audio/${filename}`;

                        // 3. Build TwiML
                        const twiml = new VoiceResponse();
                        twiml.play(publicAudioUrl);
                        twiml.record({
                            action: `${appUrl}/api/twilio/webhook?callLogId=${callLog.id}`,
                            method: 'POST',
                            timeout: 2,
                            maxLength: 30,
                            playBeep: false
                        });

                        // 4. Dial
                        if (!twilioPhoneNumber) throw new Error("TWILIO_PHONE_NUMBER missing");

                        await twilioClient.calls.create({
                            twiml: twiml.toString(),
                            to: lead.phone,
                            from: twilioPhoneNumber,
                            statusCallback: `${appUrl}/api/twilio/webhook?callLogId=${callLog.id}`,
                            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                            statusCallbackMethod: 'POST',
                        });

                        console.log(`[Voice Dispatch] Twilio Call successfully initiated for ${lead.phone}`);
                        queuedCalls++;
                    } catch (e) {
                        console.error(`[Campaign Activate] Failed to dial voice lead ${lead.phone}:`, e);
                    }
                }
            }
        }

        return NextResponse.json({ success: true, campaign: updated, callsQueued: queuedCalls })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Campaign Activate] Error:", error)
        return NextResponse.json({ error: "Failed to activate campaign" }, { status: 500 })
    }
}
