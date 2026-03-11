import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"
import { groq } from "@/lib/groq"
import { CalendarService } from "@/lib/services/calendar"

/**
 * POST /api/sandbox/chat
 * Text sandbox — test an agent's responses without a real call.
 *
 * Body: { message, agentId, history?: [{ role, content }] }
 */
export async function POST(req: Request) {
    try {
        const userId = await requireAuth()
        const { message, agentId, history = [] } = await req.json()

        if (!message) {
            return NextResponse.json({ error: "message is required" }, { status: 400 })
        }

        let systemPrompt = "You are an AI sales agent. Engage the user helpfully and professionally."
        let llmModel = "llama-3.3-70b-versatile"

        if (agentId) {
            const agent = await prisma.agent.findFirst({ where: { id: agentId, userId } })
            if (!agent) {
                return NextResponse.json({ error: "Agent not found" }, { status: 404 })
            }
            systemPrompt = agent.systemPrompt || systemPrompt
            if (agent.llmModel) llmModel = agent.llmModel
        }

        // Build message history for context
        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            { role: "system", content: `${systemPrompt}\n\n[SANDBOX MODE: This is a test conversation. Be natural and follow your persona.]` },
        ]

        // Add conversation history
        for (const h of history.slice(-20)) {
            if (h.role === "user" || h.role === "assistant") {
                messages.push({ role: h.role, content: h.content })
            }
        }

        messages.push({ role: "user", content: message })

        const tools = [
            {
                type: "function" as const,
                function: {
                    name: "check_availability",
                    description: "Check available meeting times for a specific day of the week.",
                    parameters: {
                        type: "object",
                        properties: {
                            day: { type: "string", description: "The day of the week (e.g., 'Monday')" }
                        },
                        required: ["day"]
                    }
                }
            },
            {
                type: "function" as const,
                function: {
                    name: "book_meeting",
                    description: "Book a meeting for the prospect at a specific time.",
                    parameters: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "The name of the prospect." },
                            datetime: { type: "string", description: "The date and time to book (e.g., 'Monday 10:00 AM')." }
                        },
                        required: ["name", "datetime"]
                    }
                }
            }
        ];

        const completion = await groq.chat.completions.create({
            messages,
            model: llmModel,
            temperature: 0.7,
            max_tokens: 200,
            tools,
            tool_choice: "auto"
        })

        const topChoice = completion.choices[0];
        let response = topChoice?.message?.content?.trim() || "I'm not sure how to respond to that.";

        // Handle tool calls in text sandbox mode
        if (topChoice?.message?.tool_calls && topChoice.message.tool_calls.length > 0) {
            const toolCall = topChoice.message.tool_calls[0];
            let functionResult = "";

            try {
                const args = JSON.parse(toolCall.function.arguments);
                if (toolCall.function.name === "check_availability") {
                    const slots = await CalendarService.getAvailableSlots(args.day);
                    functionResult = slots.length > 0
                        ? `Available slots on ${args.day}: ${slots.join(", ")}`
                        : `No slots available on ${args.day}.`;
                } else if (toolCall.function.name === "book_meeting") {
                    functionResult = await CalendarService.bookMeeting(args.name, args.datetime);
                }
            } catch (e) {
                functionResult = "Error accessing calendar system.";
            }

            messages.push(topChoice.message as any);
            messages.push({
                role: "tool",
                content: functionResult,
                // The tool_call_id requirement differs slightly per SDK, assuming Groq matches OpenAI schema
                tool_call_id: toolCall.id,
                name: toolCall.function.name
            } as any);

            const followUp = await groq.chat.completions.create({
                messages,
                model: llmModel,
                temperature: 0.7,
                max_tokens: 200
            });
            response = followUp.choices[0]?.message?.content?.trim() || "Handled successfully.";
        }

        // Update history
        const updatedHistory = [
            ...history,
            { role: "user", content: message },
            { role: "assistant", content: response },
        ].slice(-40)

        return NextResponse.json({
            response,
            history: updatedHistory,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        console.error("[Sandbox Chat] Error:", error)
        return NextResponse.json({ error: "Sandbox chat failed" }, { status: 500 })
    }
}
