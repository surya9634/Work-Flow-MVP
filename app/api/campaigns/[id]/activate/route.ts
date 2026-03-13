import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import twilio from "twilio"
import { requireAuth, AuthError } from "@/lib/auth"
import { groq } from "@/lib/groq"
import { makeOutboundCall, isIndianNumber } from "@/lib/services/exotel"

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
                        
                        if (isIndianNumber(lead.phone)) {
                            console.log(`[Voice Dispatch] Routing Indian number ${lead.phone} to Exotel...`);
                            
                            // EXOTEL ROUTING
                            const webhookUrl = `${appUrl}/api/exotel/webhook`;
                            const fromNumber = process.env.EXOTEL_VIRTUAL_NUMBER || "";
                            
                            if (!fromNumber || !process.env.EXOTEL_API_KEY) {
                                console.error("[Campaign Activate] Exotel credentials missing in .env.");
                                continue;
                            }

                            // Pass agentId and leadId via custom field so the webhook knows who it is
                            const customField = JSON.stringify({ agentId: campaign.agentId, leadId: lead.id, campaignId: campaign.id });
                            
                            const exotelCall = await makeOutboundCall({
                                to: lead.phone,
                                callerId: fromNumber,
                                webhookUrl: webhookUrl,
                                customField: customField
                            });
                            console.log(`[Voice Dispatch] Exotel Call successfully queued with SID: ${exotelCall.callSid}`);
                            queuedCalls++;

                        } else {
                            console.log(`[Voice Dispatch] Routing international number ${lead.phone} to Twilio...`);
                            
                            // TWILIO ROUTING
                            const accountSid = process.env.TWILIO_ACCOUNT_SID;
                            const authToken = process.env.TWILIO_AUTH_TOKEN;
                            const fromNumber = process.env.TWILIO_PHONE_NUMBER;

                            if (!accountSid || !authToken || !fromNumber) {
                                console.error("[Campaign Activate] Missing Twilio environment variables");
                                continue;
                            }

                            const client = twilio(accountSid, authToken);
                            const twimlUrl = `${appUrl}/api/twilio/outbound?agentId=${campaign.agentId}&leadId=${lead.id}`;
                            console.log(`[Voice Dispatch] Dialing TwiML URL: ${twimlUrl}`);

                            const call = await client.calls.create({
                                url: twimlUrl,
                                to: lead.phone,
                                from: fromNumber,
                                record: false
                            });
                            console.log(`[Voice Dispatch] Twilio Call successfully queued with SID: ${call.sid}`);
                            queuedCalls++;
                        }
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
