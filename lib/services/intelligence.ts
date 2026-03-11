import { groq } from "@/lib/groq";

/**
 * CONVERSATION INTELLIGENCE ENGINE
 * 
 * Responsibilities:
 * - Parse user responses via LLM
 * - Extract structured fields
 * - Detect contradictions
 * - Generate clarifying/probing questions
 */

// All fields the system can extract across all onboarding states
const ALL_EXTRACTABLE_FIELDS = [
    "company_name", "industry", "product_description", "company_size",
    "primary_goal", "target_role", "target_industry", "success_metric",
    "agent_name", "tone", "voice_gender", "communication_style",
    "pain_points", "common_objections", "key_objection_1", "key_objection_2",
    "qualification_framework", "core_value", "booking_method",
    "conversion_goal", "follow_up_strategy"
];

export interface ExtractionResult {
    extracted_fields: Record<string, string>;
    missing_fields: string[];
    confidence_score: number;
}

export class ConversationIntelligence {

    /**
     * Extract structured fields from user input using LLM.
     */
    static async extractFields(
        userMessage: string,
        currentFields: Record<string, any>,
        requiredFields: string[]
    ): Promise<ExtractionResult> {

        const missingFields = requiredFields.filter(f => !currentFields[f]);

        if (missingFields.length === 0) {
            return { extracted_fields: {}, missing_fields: [], confidence_score: 1.0 };
        }

        const prompt = `You are a data extraction engine for an AI Voice Agent Builder.

CURRENT KNOWLEDGE:
${JSON.stringify(currentFields, null, 2)}

FIELDS WE STILL NEED: ${JSON.stringify(missingFields)}

USER SAID: "${userMessage}"

INSTRUCTIONS:
1. Extract values for the MISSING fields from the user's message.
2. Only extract if the user clearly provided the information.
3. If the user's answer is vague (< 5 words for descriptive fields), set confidence lower.
4. Do NOT re-extract fields we already have unless the user explicitly corrects them.
5. Check for contradictions with existing data.

Return ONLY this JSON:
{
  "extracted_fields": { "field_name": "extracted_value" },
  "missing_fields": ["fields_still_missing"],
  "confidence_score": 0.0-1.0,
  "contradiction": null or "description of contradiction"
}`;

        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a precise data extraction engine. Return valid JSON only." },
                    { role: "user", content: prompt }
                ],
                model: "openai/gpt-oss-120b",
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(content);

            return {
                extracted_fields: parsed.extracted_fields || {},
                missing_fields: parsed.missing_fields || missingFields,
                confidence_score: parsed.confidence_score || 0
            };
        } catch (error) {
            console.error("[Intelligence] Extraction error:", error);
            return { extracted_fields: {}, missing_fields: missingFields, confidence_score: 0 };
        }
    }

    /**
     * Generate the next conversational question based on state and missing fields.
     */
    static async generateQuestion(
        state: string,
        missingFields: string[],
        collectedFields: Record<string, any>,
        lastUserMessage: string
    ): Promise<string> {

        if (missingFields.length === 0) {
            return "Great, I have everything I need for this step. Let me move on...";
        }

        const prompt = `You are an expert AI Voice Agent Architect onboarding a client.

CURRENT STATE: ${state}
WHAT WE KNOW: ${JSON.stringify(collectedFields, null, 2)}
WHAT WE STILL NEED: ${JSON.stringify(missingFields)}
LAST USER INPUT: "${lastUserMessage}"

RULES:
- Ask about ONE missing field at a time (the most important one).
- Be conversational, warm, and professional.
- If the user's last answer was vague, ask a follow-up to clarify.
- Keep it under 2 sentences.
- Never repeat information they already gave.
- Sound like a human consultant, not a form.

Return JSON: { "question": "your question", "target_field": "field_name" }`;

        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a helpful AI consultant. Return valid JSON only." },
                    { role: "user", content: prompt }
                ],
                model: "openai/gpt-oss-120b",
                temperature: 0.7,
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(content);
            return parsed.question || "Tell me more about your business.";
        } catch (error) {
            console.error("[Intelligence] Question generation error:", error);
            // Fallback: deterministic question based on missing field
            return ConversationIntelligence.getFallbackQuestion(missingFields[0]);
        }
    }

    /**
     * Deterministic fallback questions when LLM fails.
     */
    static getFallbackQuestion(field: string): string {
        const fallbacks: Record<string, string> = {
            company_name: "What's the name of your company?",
            industry: "What industry are you in?",
            product_description: "Can you describe your product or service in a few sentences?",
            primary_goal: "What's the main goal for your AI voice agent? (e.g., book demos, qualify leads)",
            target_role: "Who will your agent be calling? (e.g., CTOs, office managers, homeowners)",
            pain_points: "What are the biggest pain points your product solves for customers?",
            agent_name: "What should we name your AI agent?",
            tone: "What tone should your agent use? (e.g., professional, friendly, urgent)",
            voice_gender: "Should your agent have a male or female voice?",
            common_objections: "What objections do prospects usually raise?",
            key_objection_1: "What's the #1 objection your sales team hears?",
            conversion_goal: "What counts as a successful conversion? (e.g., booked meeting, signed up)",
            qualification_framework: "How do you qualify a lead today? (e.g., BANT, MEDDIC, custom criteria)",
            core_value: "What's the core value proposition you lead with?",
        };
        return fallbacks[field] || `Could you tell me about your ${field.replace(/_/g, " ")}?`;
    }
}
