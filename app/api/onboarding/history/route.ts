import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

/**
 * GET /api/onboarding/history
 * Return all past onboarding sessions for the user, newest first.
 * Useful for editing previous answers or reviewing what the AI knows.
 */
export async function GET() {
    try {
        const userId = await requireAuth();

        const sessions = await prisma.onboardingSession.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                state: true,
                collectedFields: true,
                confidenceScore: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        const formatted = sessions.map((s) => ({
            id: s.id,
            state: s.state,
            collectedFields: JSON.parse(s.collectedFields || "{}"),
            confidenceScore: s.confidenceScore,
            isComplete: s.state === "STATE_COMPLETE",
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
        }));

        return NextResponse.json({ sessions: formatted });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[Onboarding History] Error:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
