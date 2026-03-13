/**
 * OBJECTION ANALYZER SERVICE
 *
 * Persists objection frequency per agent in ObjectionLog.
 * Also generates AI counter-scripts for the top objections.
 */

import { prisma } from "@/lib/prisma";
import { groq } from "@/lib/groq";

/**
 * Upsert objection frequency records for an agent.
 * Called after every call with the objections array from the summarizer.
 */
export async function analyzeAndSaveObjections(
    agentId: string,
    objections: string[]
): Promise<void> {
    for (const obj of objections) {
        const normalized = obj.trim().toLowerCase().slice(0, 120);
        if (!normalized) continue;

        await prisma.objectionLog.upsert({
            where: { agentId_objection: { agentId, objection: normalized } },
            update: { count: { increment: 1 }, updatedAt: new Date() },
            create: { agentId, objection: normalized, count: 1 },
        });
    }
}

/**
 * Get the top objections for an agent, sorted by frequency.
 */
export async function getTopObjections(agentId: string, limit = 5) {
    return prisma.objectionLog.findMany({
        where: { agentId },
        orderBy: { count: "desc" },
        take: limit,
    });
}

/**
 * Generate an AI counter-script for a specific objection.
 */
export async function generateCounterScript(
    objection: string,
    productContext: string
): Promise<string> {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: `You are a top sales coach. Write a 2-sentence counter-script for this sales objection.

Product context: ${productContext}
Objection: "${objection}"

Rules:
- Acknowledge the objection first (1 sentence)
- Then reframe with value or a probing question (1 sentence)
- Sound natural, conversational, human
- Return ONLY the counter-script text, no labels`,
                },
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.6,
            max_tokens: 80,
        });

        return completion.choices[0]?.message?.content?.trim() || "That's a fair point — let me share how other customers felt the same way initially.";
    } catch {
        return "That's totally understandable — many of our best customers said the same thing before trying it.";
    }
}
