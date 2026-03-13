/**
 * CALL SUMMARIZER SERVICE
 *
 * After every call, this service:
 *  1. Generates a concise AI summary of the conversation
 *  2. Classifies the outcome (booked, interested, not_interested, follow_up)
 *  3. Extracts objections raised by the prospect
 *
 * Runs async post-call — never blocks the live voice pipeline.
 */

import { groq } from "@/lib/groq";
import { prisma } from "@/lib/prisma";
import { extractAndSaveMemory } from "./lead-memory";
import { analyzeAndSaveObjections } from "./objection-analyzer";

export interface CallSummaryResult {
    summary: string;
    outcome: "booked" | "interested" | "follow_up" | "not_interested" | "no_answer" | "unknown";
    objections: string[];
    talkRatio: number; // rough estimate from transcript line counts
}

/**
 * Parse transcript lines to estimate talk ratio (prospect turns / total turns).
 */
function estimateTalkRatio(transcript: string): number {
    const lines = transcript.split("\n").filter((l) => l.trim());
    const userLines = lines.filter((l) => l.toLowerCase().startsWith("user:") || l.toLowerCase().startsWith("prospect:"));
    if (lines.length === 0) return 0.5;
    return Math.round((userLines.length / lines.length) * 100) / 100;
}

/**
 * Generate AI summary + outcome classification from a call transcript.
 */
export async function summarizeCall(
    transcript: string,
    productContext: string = ""
): Promise<CallSummaryResult> {
    const talkRatio = estimateTalkRatio(transcript);

    const prompt = `You are analyzing a completed AI sales call transcript. Extract structured insights.

TRANSCRIPT:
${transcript.slice(0, 6000)}

PRODUCT CONTEXT: ${productContext || "AI voice agent platform"}

Respond ONLY with valid JSON matching this exact shape:
{
  "summary": "<3-sentence summary: what happened, what the prospect said, what the outcome was>",
  "outcome": "<one of: booked | interested | follow_up | not_interested | no_answer | unknown>",
  "objections": ["<objection phrase 1>", "<objection phrase 2>"]
}

Rules:
- summary must be 2-3 sentences, past tense, factual
- outcome must be exactly one of the allowed values
- objections should be short phrases (max 8 words each), max 5 items
- return [] for objections if none were raised`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant",
            temperature: 0.2,
            max_tokens: 300,
            response_format: { type: "json_object" },
        });

        const raw = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(raw);

        return {
            summary: parsed.summary || "Call completed.",
            outcome: parsed.outcome || "unknown",
            objections: Array.isArray(parsed.objections) ? parsed.objections.slice(0, 5) : [],
            talkRatio,
        };
    } catch (e) {
        console.error("[CallSummarizer] LLM error:", e);
        return { summary: "Call completed.", outcome: "unknown", objections: [], talkRatio };
    }
}

/**
 * Full post-call pipeline — summarize, save to CallLog, trigger memory + objection analysis.
 * Call this ASYNC after a call ends — do not await in the hot path.
 */
export async function runPostCallPipeline(
    callLogId: string,
    transcript: string,
    agentId: string,
    leadId: string | null,
    productContext: string = ""
): Promise<void> {
    try {
        console.log(`[PostCall] Running pipeline for callLog=${callLogId}`);

        const result = await summarizeCall(transcript, productContext);

        // 1. Save summary + talkRatio + objections to CallLog
        await prisma.callLog.update({
            where: { id: callLogId },
            data: {
                summary: result.summary,
                talkRatio: result.talkRatio,
                objections: JSON.stringify(result.objections),
                outcome: result.outcome,
                sentiment: result.talkRatio > 0.4 ? "positive" : result.talkRatio > 0.2 ? "neutral" : "negative",
            },
        });

        // 2. Update lead status based on outcome
        if (leadId) {
            const statusMap: Record<string, string> = {
                booked: "BOOKED",
                interested: "INTERESTED",
                follow_up: "FOLLOW_UP",
                not_interested: "DISQUALIFIED",
            };
            if (statusMap[result.outcome]) {
                await prisma.lead.update({
                    where: { id: leadId },
                    data: { status: statusMap[result.outcome] },
                });
            }

            // 3. Extract and save cross-call memory
            await extractAndSaveMemory(transcript, leadId, productContext);
        }

        // 4. Record objections per agent
        if (result.objections.length > 0) {
            await analyzeAndSaveObjections(agentId, result.objections);
        }

        console.log(`[PostCall] Pipeline complete for callLog=${callLogId} — outcome: ${result.outcome}`);
    } catch (e) {
        console.error("[PostCall] Pipeline error:", e);
    }
}
