/**
 * LEAD MEMORY SERVICE
 *
 * Extracts key facts from call transcripts and persists them per lead.
 * On subsequent calls to the same lead, injects the memory into the
 * agent's system prompt so the agent "remembers" prior conversations.
 */

import { prisma } from "@/lib/prisma";
import { groq } from "@/lib/groq";

interface MemoryFact {
    key: string;   // e.g. "company", "pain_point", "expressed_interest"
    value: string; // e.g. "Acme Corp", "manual reporting", "yes"
    extractedAt: string; // ISO timestamp
}

/**
 * Extract key facts from a transcript using LLM and save/merge into LeadMemory.
 */
export async function extractAndSaveMemory(
    transcript: string,
    leadId: string,
    productContext: string = ""
): Promise<void> {
    try {
        const prompt = `You are extracting CRM facts from a sales call transcript.

TRANSCRIPT:
${transcript.slice(0, 4000)}

Extract up to 6 key facts the prospect revealed. Return ONLY JSON:
{
  "facts": [
    { "key": "company", "value": "Acme Corp" },
    { "key": "role", "value": "Marketing Manager" },
    { "key": "pain_point", "value": "manual lead tracking" },
    { "key": "expressed_interest", "value": "pricing page" },
    { "key": "objection", "value": "budget concerns" },
    { "key": "preferred_time", "value": "Tuesday afternoon" }
  ],
  "summary": "<1–2 sentence running summary of what you know about this prospect>"
}

Only extract facts the prospect explicitly stated. Return empty facts array if none.`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant",
            temperature: 0.1,
            max_tokens: 300,
            response_format: { type: "json_object" },
        });

        const raw = JSON.parse(completion.choices[0]?.message?.content || "{}");
        const newFacts: MemoryFact[] = (raw.facts || []).map((f: any) => ({
            key: String(f.key || "").slice(0, 50),
            value: String(f.value || "").slice(0, 200),
            extractedAt: new Date().toISOString(),
        }));

        if (newFacts.length === 0 && !raw.summary) return;

        // Merge with existing facts (newer facts for same key win)
        const existing = await prisma.leadMemory.findUnique({ where: { leadId } });
        const existingFacts: MemoryFact[] = existing ? JSON.parse(existing.facts || "[]") : [];

        const merged: Record<string, MemoryFact> = {};
        for (const f of [...existingFacts, ...newFacts]) {
            merged[f.key] = f; // newer overwrites
        }

        await prisma.leadMemory.upsert({
            where: { leadId },
            update: {
                facts: JSON.stringify(Object.values(merged).slice(0, 20)),
                summary: raw.summary || existing?.summary,
            },
            create: {
                leadId,
                facts: JSON.stringify(newFacts.slice(0, 20)),
                summary: raw.summary || null,
            },
        });

        console.log(`[LeadMemory] Saved ${newFacts.length} facts for lead=${leadId}`);
    } catch (e) {
        console.error("[LeadMemory] Extract error:", e);
    }
}

/**
 * Get a formatted memory context string to inject into the agent's system prompt.
 * Returns empty string if no memory exists.
 */
export async function getMemoryContext(leadId: string): Promise<string> {
    try {
        const memory = await prisma.leadMemory.findUnique({ where: { leadId } });
        if (!memory) return "";

        const facts: MemoryFact[] = JSON.parse(memory.facts || "[]");
        if (facts.length === 0 && !memory.summary) return "";

        const factLines = facts
            .map((f) => `- ${f.key.replace(/_/g, " ")}: ${f.value}`)
            .join("\n");

        return `\n\n=== MEMORY FROM PREVIOUS CALL(S) ===\n${memory.summary ? `Summary: ${memory.summary}\n` : ""}${factLines ? `Known facts:\n${factLines}` : ""}\n\nUse this memory naturally in conversation — reference what you already know without being robotic about it. Don't re-ask information you already have.`;
    } catch {
        return "";
    }
}

/**
 * Get readable memory facts for UI display.
 */
export async function getMemoryForDisplay(leadId: string) {
    const memory = await prisma.leadMemory.findUnique({ where: { leadId } });
    if (!memory) return null;
    return {
        summary: memory.summary,
        facts: JSON.parse(memory.facts || "[]") as MemoryFact[],
        updatedAt: memory.updatedAt,
    };
}
