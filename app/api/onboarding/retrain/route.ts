import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";
import { ONBOARDING_STATES } from "@/lib/services/onboarding";

/**
 * POST /api/onboarding/retrain
 * Wipe the current session's collected fields and reset state to allow re-onboarding.
 * The conversation history is preserved so the AI has context.
 */
export async function POST() {
    try {
        const userId = await requireAuth();

        const session = await prisma.onboardingSession.findFirst({
            where: { userId },
            orderBy: { updatedAt: "desc" },
        });

        if (!session) {
            return NextResponse.json({ error: "No onboarding session found." }, { status: 404 });
        }

        // Reset state and fields but keep prior conversation context
        await prisma.onboardingSession.update({
            where: { id: session.id },
            data: {
                state: ONBOARDING_STATES.STATE_BUSINESS,
                collectedFields: "{}",
                confidenceScore: 0,
            },
        });

        // Also mark user onboarding as incomplete
        await prisma.$executeRaw`UPDATE "User" SET "onboardingComplete" = FALSE, "updatedAt" = NOW() WHERE id = ${userId}`;

        return NextResponse.json({
            success: true,
            message: "Onboarding reset. Use POST /api/ai/chat to re-train your AI agent.",
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[Onboarding Retrain] Error:", error);
        return NextResponse.json({ error: "Failed to reset onboarding" }, { status: 500 });
    }
}
