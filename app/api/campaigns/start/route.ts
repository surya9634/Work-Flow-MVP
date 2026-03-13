import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { groq } from "@/lib/groq";
import { twilioClient, twilioPhoneNumber } from "@/lib/services/twilio";

export async function POST(req: Request) {
    try {
        const userId = await requireAuth();
        const { campaignId } = await req.json();

        // Fetch campaign and leads
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId, userId },
            include: { leads: true, agent: { include: { user: true } } }
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        let queuedCalls = 0;

        // Loop through leads and dispatch based on campaign type
        for (const lead of campaign.leads) {
            if (lead.status === "NEW") {

                // --- WHATSAPP OUTBOUND ---
                if (campaign.type === "WHATSAPP") {
                    try {
                        let accessToken = campaign.agent?.user?.metaAccessToken || process.env.WHATSAPP_ACCESS_TOKEN;
                        let phoneNumberId = campaign.agent?.whatsappPhoneId || process.env.WHATSAPP_PHONE_NUMBER_ID;

                        if (!accessToken || !phoneNumberId) {
                            console.error("[Campaign] Missing WhatsApp credentials for outbout campaign.");
                            continue;
                        }

                        const systemPrompt = campaign.agent?.systemPrompt || `You are an AI assistant reaching out to a lead named ${lead.name}. Your objective is: ${campaign.objective}. Keep the first message short, friendly, and engaging like a real text message.`;

                        const completion = await groq.chat.completions.create({
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: "Start the conversation with the lead." }
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
                            to: lead.phone.replace('+', ''), // Meta requires phone numbers without the +
                            type: "text",
                            text: { body: aiMessage }
                        };

                        const response = await fetch(url, {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${accessToken}`,
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
                            const errText = await response.text();
                            console.error(`[Campaign] Meta WhatsApp send failed:`, errText);
                        }
                    } catch (e) {
                        console.error(`[Campaign] Failed WhatsApp dispatch to ${lead.phone}:`, e);
                    }
                }

                // --- VOICE OUTBOUND ---
                else {
                    const host = req.headers.get("host") || "localhost:3000";
                    const protocol = host.includes("localhost") ? "http" : "https";
                    const baseUrl = `${protocol}://${host}`;

                    try {
                        console.log(`[Campaign] Routing number ${lead.phone} to Twilio...`);
                        
                        // TWILIO ROUTING
                        const webhookUrl = `${baseUrl}/api/twilio/webhook`;
                        const fromNumber = twilioPhoneNumber;

                        if (!fromNumber) {
                            console.error("[Campaign] Twilio phone number missing in .env.");
                            continue;
                        }

                        const twilioCall = await twilioClient.calls.create({
                            url: webhookUrl,
                            to: lead.phone,
                            from: fromNumber,
                            statusCallback: webhookUrl,
                            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                            statusCallbackMethod: 'POST',
                        });
                        queuedCalls++;
                    } catch (e) {
                        console.error(`[Campaign] Failed to dial voice lead ${lead.phone}:`, e);
                    }
                }
            }
        }

        return NextResponse.json({ success: true, callsQueued: queuedCalls });

    } catch (error) {
        console.error("[Campaign API]", error);
        return NextResponse.json({ error: "Failed to start campaign" }, { status: 500 });
    }
}
