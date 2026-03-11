import { prisma } from "@/lib/prisma";
import { ConversationIntelligence } from "./intelligence";

/**
 * ONBOARDING ORCHESTRATOR SERVICE
 * 
 * Controls the stateful onboarding process.
 * Manages state transitions, field collection, and session persistence.
 */

// ─── STATE DEFINITIONS ───────────────────────────────
export const ONBOARDING_STATES = {
    STATE_BUSINESS: "STATE_BUSINESS",
    STATE_GOAL: "STATE_GOAL",
    STATE_PERSONA: "STATE_PERSONA",
    STATE_OBJECTIONS: "STATE_OBJECTIONS",
    STATE_CONVERSION: "STATE_CONVERSION",
    STATE_REVIEW: "STATE_REVIEW",
    STATE_COMPLETE: "STATE_COMPLETE",
} as const;

// ─── REQUIRED FIELDS PER STATE ────────────────────────
const STATE_REQUIREMENTS: Record<string, string[]> = {
    STATE_BUSINESS: ["company_name", "industry", "product_description"],
    STATE_GOAL: ["primary_goal", "target_role", "success_metric"],
    STATE_PERSONA: ["agent_name", "tone", "voice_gender"],
    STATE_OBJECTIONS: ["pain_points", "key_objection_1"],
    STATE_CONVERSION: ["conversion_goal", "qualification_framework"],
    STATE_REVIEW: [],
    STATE_COMPLETE: [],
};

// ─── STATE TRANSITION ORDER ───────────────────────────
const STATE_ORDER = [
    "STATE_BUSINESS",
    "STATE_GOAL",
    "STATE_PERSONA",
    "STATE_OBJECTIONS",
    "STATE_CONVERSION",
    "STATE_REVIEW",
    "STATE_COMPLETE"
];

// ─── GREETING MESSAGES ────────────────────────────────
const STATE_GREETINGS: Record<string, string> = {
    STATE_BUSINESS: "Let's start building your AI voice agent! First, tell me about your business.",
    STATE_GOAL: "Great! Now let's define the mission for your agent.",
    STATE_PERSONA: "Time to give your agent a personality.",
    STATE_OBJECTIONS: "Let's prepare your agent to handle objections like a pro.",
    STATE_CONVERSION: "Almost there! Let's define what success looks like.",
    STATE_REVIEW: "Here's a summary of your agent configuration. Say 'confirm' to deploy, or tell me what to change.",
    STATE_COMPLETE: "Your agent has been generated! You can now deploy it from the Agents panel.",
};

export interface OrchestratorResult {
    message: string;
    state: string;
    collectedFields: Record<string, any>;
    confidenceScore: number;
    action: "continue" | "advance_state" | "review" | "create_agent" | "edit";
    progress: number; // 0-100
}

export class OnboardingOrchestrator {

    /**
     * Main entry: process a user message and return AI response + updated state.
     */
    static async processMessage(userId: string, userMessage: string): Promise<OrchestratorResult> {

        // 1. Get or create session
        let session = await prisma.onboardingSession.findFirst({
            where: { userId, state: { not: ONBOARDING_STATES.STATE_COMPLETE } },
            orderBy: { updatedAt: "desc" }
        });

        if (!session) {
            session = await prisma.onboardingSession.create({
                data: {
                    userId,
                    state: ONBOARDING_STATES.STATE_BUSINESS,
                    collectedFields: "{}",
                    confidenceScore: 0
                }
            });

            // Return greeting for new session
            const question = await ConversationIntelligence.generateQuestion(
                session.state,
                STATE_REQUIREMENTS[session.state],
                {},
                ""
            );

            return {
                message: `${STATE_GREETINGS[session.state]} ${question}`,
                state: session.state,
                collectedFields: {},
                confidenceScore: 0,
                action: "continue",
                progress: 0
            };
        }

        const currentState = session.state;
        const currentFields = JSON.parse(session.collectedFields || "{}");
        const requiredFields = STATE_REQUIREMENTS[currentState] || [];

        // 2. Handle REVIEW state commands
        if (currentState === ONBOARDING_STATES.STATE_REVIEW) {
            return await OnboardingOrchestrator.handleReview(session, userMessage, currentFields);
        }

        // 3. Extract fields from user message
        const extraction = await ConversationIntelligence.extractFields(
            userMessage, currentFields, requiredFields
        );

        // 4. Merge extracted fields
        const updatedFields = { ...currentFields, ...extraction.extracted_fields };
        const newConfidence = extraction.confidence_score;

        // 5. Check if current state is satisfied
        const missingInCurrent = requiredFields.filter(f => !updatedFields[f]);
        let nextState = currentState;
        let action: OrchestratorResult["action"] = "continue";

        if (missingInCurrent.length === 0) {
            // Advance to next state
            const currentIndex = STATE_ORDER.indexOf(currentState);
            if (currentIndex < STATE_ORDER.length - 1) {
                nextState = STATE_ORDER[currentIndex + 1];
                action = "advance_state";
            }
        }

        // 6. Persist
        await prisma.onboardingSession.update({
            where: { id: session.id },
            data: {
                state: nextState,
                collectedFields: JSON.stringify(updatedFields),
                confidenceScore: newConfidence
            }
        });

        // 7. Generate response
        const nextRequired = STATE_REQUIREMENTS[nextState] || [];
        const nextMissing = nextRequired.filter(f => !updatedFields[f]);

        let message: string;
        if (action === "advance_state") {
            const greeting = STATE_GREETINGS[nextState] || "";
            if (nextState === ONBOARDING_STATES.STATE_REVIEW) {
                message = OnboardingOrchestrator.buildReviewMessage(updatedFields);
            } else {
                const question = await ConversationIntelligence.generateQuestion(
                    nextState, nextMissing, updatedFields, userMessage
                );
                message = `${greeting} ${question}`;
            }
        } else {
            message = await ConversationIntelligence.generateQuestion(
                currentState, missingInCurrent, updatedFields, userMessage
            );
        }

        // 8. Calculate progress
        const progress = OnboardingOrchestrator.calculateProgress(updatedFields);

        return {
            message,
            state: nextState,
            collectedFields: updatedFields,
            confidenceScore: newConfidence,
            action,
            progress
        };
    }

    /**
     * Handle REVIEW state — user can confirm or request edits.
     */
    static async handleReview(
        session: any,
        userMessage: string,
        fields: Record<string, any>
    ): Promise<OrchestratorResult> {
        const lower = userMessage.toLowerCase().trim();

        // Broad confirmation detection — catch all natural ways of saying yes
        const CONFIRM_SIGNALS = [
            "confirm", "deploy", "generate", "create", "build", "launch",
            "yes", "yep", "yeah", "yup", "ya", "ye", "yea",
            "looks good", "look good", "all good", "sounds good",
            "good", "great", "perfect", "awesome", "amazing", "fire", "lit",
            "ok", "okay", "k", "kk", "sure", "absolutely", "definitely",
            "do it", "let's go", "lets go", "go ahead", "proceed",
            "correct", "right", "exactly", "that's right", "thats right",
            "nothing to change", "nothing to update", "no changes",
            "don't want", "dont want", "no change", "all set",
            "i'm happy", "im happy", "happy with", "satisfied",
        ];

        const isConfirmation = CONFIRM_SIGNALS.some(signal => lower.includes(signal));

        if (isConfirmation) {
            // Transition to COMPLETE
            await prisma.onboardingSession.update({
                where: { id: session.id },
                data: { state: ONBOARDING_STATES.STATE_COMPLETE }
            });

            return {
                message: "Agent configuration confirmed! Generating your AI voice agent now...",
                state: ONBOARDING_STATES.STATE_COMPLETE,
                collectedFields: fields,
                confidenceScore: 1.0,
                action: "create_agent",
                progress: 100
            };
        }

        // User wants to edit something — acknowledge it
        return {
            message: "Got it! What would you like to change? Just tell me (e.g., 'change the agent name to Sarah', or 'update the tone to friendly'). Or say **\"all good\"** to generate your agent now.",
            state: ONBOARDING_STATES.STATE_REVIEW,
            collectedFields: fields,
            confidenceScore: 0.8,
            action: "edit",
            progress: 90
        };
    }

    /**
     * Build a human-readable review summary.
     */
    static buildReviewMessage(fields: Record<string, any>): string {
        return `Here's your agent configuration:

**Business:** ${fields.company_name || "—"} (${fields.industry || "—"})
**Product:** ${fields.product_description || "—"}

**Goal:** ${fields.primary_goal || "—"}
**Target:** ${fields.target_role || "—"}
**Success Metric:** ${fields.success_metric || "—"}

**Agent Name:** ${fields.agent_name || "—"}
**Tone:** ${fields.tone || "—"} | **Voice:** ${fields.voice_gender || "—"}

**Key Objection:** ${fields.key_objection_1 || "—"}
**Pain Points:** ${fields.pain_points || "—"}

**Conversion Goal:** ${fields.conversion_goal || "—"}
**Qualification:** ${fields.qualification_framework || "—"}

Say **"all good"**, **"go ahead"**, or **"looks good"** to generate your agent — or tell me what to change.`;
    }

    /**
     * Calculate overall progress (0-100).
     */
    static calculateProgress(fields: Record<string, any>): number {
        const allRequired = Object.values(STATE_REQUIREMENTS).flat();
        if (allRequired.length === 0) return 100;
        const filled = allRequired.filter(f => !!fields[f]).length;
        return Math.round((filled / allRequired.length) * 100);
    }
}
