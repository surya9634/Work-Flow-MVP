import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";
import { ONBOARDING_STATES } from "@/lib/services/onboarding";

/**
 * GET /api/onboarding/session
 * Return the user's active onboarding session: state, collectedFields, progress, history.
 */
export async function GET() {
    try {
        const userId = await requireAuth();

        const session = await prisma.onboardingSession.findFirst({
            where: { userId },
            orderBy: { updatedAt: "desc" },
        });

        if (!session) {
            return NextResponse.json({ session: null, onboardingComplete: false });
        }

        const collectedFields = JSON.parse(session.collectedFields || "{}");
        const conversationHistory = JSON.parse((session as any).conversationHistory || "[]");

        // Calculate progress
        const allRequired = [
            "company_name", "industry", "product_description",
            "primary_goal", "target_role", "success_metric",
            "agent_name", "tone", "voice_gender",
            "pain_points", "key_objection_1",
            "conversion_goal", "qualification_framework"
        ];
        const filled = allRequired.filter((f) => !!collectedFields[f]).length;
        const progress = Math.round((filled / allRequired.length) * 100);

        return NextResponse.json({
            session: {
                id: session.id,
                state: session.state,
                collectedFields,
                conversationHistory,
                confidenceScore: session.confidenceScore,
                progress,
                isComplete: session.state === ONBOARDING_STATES.STATE_COMPLETE,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
            },
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[Onboarding Session GET] Error:", error);
        return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
    }
}

/**
 * POST /api/onboarding/session
 * Start a fresh onboarding session (resets in-progress sessions).
 */
export async function POST() {
    try {
        const userId = await requireAuth();

        // Archive any existing active sessions
        await prisma.onboardingSession.updateMany({
            where: { userId, state: { not: ONBOARDING_STATES.STATE_COMPLETE } },
            data: { state: ONBOARDING_STATES.STATE_COMPLETE },
        });

        // Create fresh session
        const session = await prisma.onboardingSession.create({
            data: {
                userId,
                state: ONBOARDING_STATES.STATE_BUSINESS,
                collectedFields: "{}",
                confidenceScore: 0,
            },
        });

        return NextResponse.json({
            session: {
                id: session.id,
                state: session.state,
                collectedFields: {},
                progress: 0,
            },
            message: "New onboarding session started. Use POST /api/ai/chat to begin.",
        }, { status: 201 });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[Onboarding Session POST] Error:", error);
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
}
