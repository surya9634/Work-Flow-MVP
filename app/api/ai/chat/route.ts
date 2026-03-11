import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OnboardingOrchestrator } from "@/lib/services/onboarding";
import { AgentGenerator } from "@/lib/services/agent-generator";
import { getAuthUserId } from "@/lib/auth";

/**
 * POST /api/ai/chat
 *
 * Main chat endpoint — routes through the Onboarding Orchestrator.
 * Persists full conversation history for multi-turn context.
 * When onboarding completes, triggers Agent Generation.
 */
export async function POST(req: Request) {
    try {
        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json(
                { message: "System Error: GROQ_API_KEY is missing. Please add it to .env and restart." },
                { status: 503 }
            );
        }

        const userId = await getAuthUserId();
        if (!userId) {
            return NextResponse.json({ message: "Please log in to continue." }, { status: 401 });
        }

        // Ensure user exists in DB (dev fallback)
        await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: { id: userId, email: "demo@example.com", passwordHash: "demo", name: "Demo User" }
        });

        const { message } = await req.json();

        // Get or create active session to persist history
        // Run through Orchestrator (it manages session internally)
        const result = await OnboardingOrchestrator.processMessage(userId, message);

        // Persist conversation history onto the session
        const activeSession = await prisma.onboardingSession.findFirst({
            where: { userId },
            orderBy: { updatedAt: "desc" },
        });

        if (activeSession) {
            const history: Array<{ role: string; content: string }> = JSON.parse(
                (activeSession as any).conversationHistory || "[]"
            );
            history.push({ role: "user", content: message });
            history.push({ role: "assistant", content: result.message });
            await prisma.$executeRaw`UPDATE "OnboardingSession" SET "conversationHistory" = ${JSON.stringify(history.slice(-40))}, "updatedAt" = NOW() WHERE id = ${activeSession.id}`;
        }

        // If orchestrator says "create_agent", trigger generation
        if (result.action === "create_agent") {
            try {
                // Mark user onboarding complete
                await prisma.$executeRaw`UPDATE "User" SET "onboardingComplete" = TRUE, "updatedAt" = NOW() WHERE id = ${userId}`;

                const agent = await AgentGenerator.generate(userId, result.collectedFields);
                return NextResponse.json({
                    message: `${result.message}\n\n✅ Agent "${agent.name}" has been generated! You can view and deploy it from the Agents panel.`,
                    state: result.state,
                    progress: result.progress,
                    action: result.action,
                    agent: {
                        name: agent.name,
                        systemPrompt: agent.systemPrompt,
                        openingScript: agent.openingScript,
                    },
                });
            } catch (genError) {
                console.error("[AgentGenerator] Error:", genError);
                return NextResponse.json({
                    message: "Your agent config is ready, but I had trouble saving it. Please try again.",
                    state: result.state,
                    progress: result.progress,
                    action: "continue",
                });
            }
        }

        return NextResponse.json({
            message: result.message,
            state: result.state,
            progress: result.progress,
            action: result.action,
            collectedFields: result.collectedFields,
        });
    } catch (error) {
        console.error("[Chat API] Error:", error);
        return NextResponse.json(
            { message: "Sorry, something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
