import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { groq } from "@/lib/groq";
import fs from "fs";
import path from "path";

function logTrace(msg: string) {
    console.log(`[WhatsApp Webhook] ${msg}`);
    try {
        fs.appendFileSync('webhook-trace.txt', `\n[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) { }
}

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "workflow_meta_secret_123";

// 1. Meta Webhook Subscription Verification (GET)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        logTrace("Verified Meta Subscription Challenge");
        return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid verification token" }, { status: 403 });
}

// 2. Incoming WhatsApp Messages (POST)
export async function POST(request: Request) {
    try {
        const bodyText = await request.text();
        logTrace(`Incoming POST Payload received: ${bodyText}`);

        let body;
        try {
            body = JSON.parse(bodyText);
        } catch (e) {
            logTrace(`Failed to parse JSON: ${e}`);
            return NextResponse.json({ status: "invalid_json" }, { status: 400 });
        }

        // Meta sends standard object structure for WhatsApp messages
        if (body.object === "whatsapp_business_account") {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    const value = change.value;

                    // Proceed only if it has a message
                    if (value.messages && value.messages[0]) {
                        const message = value.messages[0];
                        const phoneNumberId = value.metadata.phone_number_id; // Our platform user's WABA number ID
                        const from = message.from; // The external end-user's phone number
                        const text = message.type === "text" ? message.text.body : "";

                        if (!text) {
                            logTrace(`No text in message, skipping. Message type: ${message.type}`);
                            continue; // Ignore media/system messages for now
                        }

                        logTrace(`Parsed message: "${text}" from ${from} to Number ID: ${phoneNumberId}`);
                        logTrace(`Checking DB for Agent via whatsappPhoneId: ${phoneNumberId}`);

                        // 3. Look up which Agent is assigned to this WhatsApp Phone ID
                        let agent = await prisma.agent.findFirst({
                            where: { whatsappPhoneId: phoneNumberId },
                            include: { user: true }
                        });

                        let accessToken = agent?.user?.metaAccessToken;

                        logTrace(`Agent lookup result: ${agent ? agent.id : "null"}`);

                        if (!agent || !accessToken) {
                            logTrace(`Final Check Failed: No Agent or Access Token found for Phone ID ${phoneNumberId}`);
                            continue;
                        }

                        // 4. Look up or Create Lead
                        let lead = await prisma.lead.findFirst({
                            where: { phone: from, userId: agent.userId }
                        });

                        if (!lead) {
                            lead = await prisma.lead.create({
                                data: {
                                    phone: from,
                                    name: "Unknown Contact",
                                    userId: agent.userId,
                                    status: "NEW"
                                }
                            });
                            logTrace(`Created new Lead for unknown number: ${from}`);
                        }

                        // 5. Log the incoming message
                        await prisma.interactionLog.create({
                            data: {
                                agentId: agent.id,
                                leadId: lead.id,
                                type: "WHATSAPP",
                                direction: "INBOUND",
                                message: text,
                                status: "RECEIVED"
                            }
                        });

                        // 5. Generate AI Response
                        const aiReply = await generateAgentReply(agent, text, from);

                        // 6. Send Reply via Meta Graph API
                        await sendWhatsAppMessage(phoneNumberId, from, aiReply, accessToken);

                        // 8. Log the outbound message
                        await prisma.interactionLog.create({
                            data: {
                                agentId: agent.id,
                                leadId: lead.id,
                                type: "WHATSAPP",
                                direction: "OUTBOUND",
                                message: aiReply,
                                status: "SENT"
                            }
                        });
                    }
                }
            }
            return NextResponse.json({ status: "ok" });
        }

        return NextResponse.json({ status: "invalid_object" }, { status: 404 });

    } catch (error: any) {
        console.error("[WhatsApp Webhook] Error:", error);
        try {
            fs.appendFileSync(path.join(process.cwd(), "webhook-error.txt"), `\n[${new Date().toISOString()}] Error: ${error}\nStack: ${error.stack}\n`);
        } catch (e) { }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * Generates an LLM text reply using the Agent's configured System Prompt.
 */
async function generateAgentReply(agent: any, userText: string, fromNumber: string): Promise<string> {
    try {
        // Fetch last 5 interactions for context
        const history = await prisma.interactionLog.findMany({
            where: { agentId: agent.id, type: "WHATSAPP" }, // Add filtering by \`from\` number in V2 for session isolation
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        // Format history for Groq
        const formattedHistory = history.reverse().map(log =>
            ({ role: log.direction === "INBOUND" ? "user" : "assistant", content: log.message })
        );

        const baseSystemPrompt = agent.systemPrompt || "You are a helpful text-based AI assistant. Keep responses brief like a text message.";

        const enhancedPrompt = `
${baseSystemPrompt}

CRITICAL INSTRUCTIONS FOR THIS WHATSAPP CONVERSATION:
1. Act as a real, highly professional sales agent. Your goal is to pitch and sell your product effectively.
2. Naturally ask for the user's personal details and contact information during the chat to capture them as a lead (e.g., "Could I get your email or phone number in case we get disconnected?").
3. If the user asks something you cannot assist with, or if the matter gets out of hand, apologize gracefully and provide our human support contact details: "Please reach out to our human team at +1-800-HUMAN-HELP or support@company.com". Only provide this if necessary.
4. Keep your responses punchy, concise, and formatted for WhatsApp (use *bolding* and emojis appropriately).
`;

        const messages: any[] = [
            { role: "system", content: enhancedPrompt },
            ...formattedHistory,
            { role: "user", content: userText }
        ];

        const tools: any[] = [
            {
                type: "function",
                function: {
                    name: "book_meeting",
                    description: "Book a meeting, schedule a call, or setup an offline meet on the company calendar.",
                    parameters: {
                        type: "object",
                        properties: {
                            userName: { type: "string", description: "Name of the person booking the meeting" },
                            startTime: { type: "string", description: "ISO 8601 string of the start time (assume UTC if timezone isn't specified)" },
                            durationMinutes: { type: "number", description: "Duration in minutes" },
                            reason: { type: "string", description: "Reason for the meeting" }
                        },
                        required: ["userName", "startTime", "durationMinutes"]
                    }
                }
            }
        ];

        const completion = await groq.chat.completions.create({
            messages,
            model: agent.llmModel || "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 300,
            tools: agent.user?.googleAccessToken ? tools : undefined,
            tool_choice: "auto",
        });

        const responseMessage = completion.choices[0]?.message;

        if (responseMessage?.tool_calls?.length) {
            for (const toolCall of responseMessage.tool_calls) {
                if (toolCall.function.name === "book_meeting") {
                    const args = JSON.parse(toolCall.function.arguments);

                    if (agent.user?.googleAccessToken) {
                        const event = {
                            summary: `Meeting with ${args.userName || fromNumber}`,
                            description: args.reason || "Scheduled via AI Agent Assistant",
                            start: { dateTime: args.startTime },
                            end: { dateTime: new Date(new Date(args.startTime).getTime() + (args.durationMinutes * 60000)).toISOString() }
                        };

                        try {
                            const calRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
                                method: "POST",
                                headers: {
                                    "Authorization": `Bearer ${agent.user.googleAccessToken}`,
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify(event)
                            });

                            if (calRes.ok) {
                                return `Great! I have successfully scheduled your meeting for ${args.userName || "you"}. We look forward to it!`;
                            } else {
                                console.error("[Calendar Booking] API Error:", await calRes.text());
                                return "I tried to book the meeting, but there was an issue syncing with our calendar system. Please reach out to our human support team directly.";
                            }
                        } catch (e) {
                            console.error("[Calendar Booking] Network error:", e);
                            return "I encountered a network error trying to schedule. Please reach out to our human support.";
                        }
                    } else {
                        return "My calendar booking integration is currently incomplete. Please contact our human support to schedule.";
                    }
                }
            }
        }

        return responseMessage?.content || "I'm sorry, I'm having trouble connecting right now.";
    } catch (e) {
        console.error("[WhatsApp Webhook] LLM Error:", e);
        return "I'm having a little trouble thinking of what to say. Give me a moment.";
    }
}

/**
 * Transmits the text reply back to the user via the Official Meta Graph API.
 */
async function sendWhatsAppMessage(phoneNumberId: string, to: string, bodyText: string, accessToken: string) {
    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: {
            preview_url: false,
            body: bodyText
        }
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
        const err = await response.text();
        console.error(`[WhatsApp Webhook] Meta Graph API Failed sending message:`, err);
        try {
            fs.appendFileSync("webhook-error.txt", `\n[${new Date().toISOString()}] Meta API Error:\nURL: ${url}\nPayload: ${JSON.stringify(payload)}\nResponse: ${err}\n`);
        } catch (e) { }
        throw new Error(`Failed to send WhatsApp message: ${err}`);
    }

    return true;
}
