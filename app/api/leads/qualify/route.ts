import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"
import { LeadIntelligence, CallAnalysis } from "@/lib/services/lead-intelligence"

/**
 * POST /api/leads/qualify
 * Manually trigger AI qualification for a lead based on their latest call.
 * 
 * Body: { leadId: string }
 */
export async function POST(req: Request) {
    try {
        const userId = await requireAuth()
        const body = await req.json()
        const { leadId } = body

        if (!leadId) {
            return NextResponse.json({ error: "Lead ID is required" }, { status: 400 })
        }

        // 1. Fetch lead and latest call log (with transcript/analysis)
        const lead = await prisma.lead.findFirst({
            where: { id: leadId, userId },
            include: {
                callLogs: {
                    orderBy: { createdAt: "desc" },
                    take: 1
                }
            }
        })

        if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

        const latestCall = lead.callLogs[0]
        if (!latestCall) {
            return NextResponse.json({ error: "No call history found for this lead" }, { status: 400 })
        }

        // 2. Map CallLog data to CallAnalysis format for the Intelligence Engine
        // Note: In a production scenario, we'd use the LLM to extract these specific fields first.
        // For now, we infer them from the outcome/sentiment already stored in the CallLog or use sensible defaults.
        const analysis: CallAnalysis = {
            intent: latestCall.outcome || "unknown",
            objections_detected: latestCall.outcome?.includes("Objection") ? [latestCall.outcome] : [],
            qualification_answers: {},
            booking_status: latestCall.outcome === "Meeting Booked" ? "booked" : (latestCall.outcome === "Interested" ? "pending" : "rejected"),
            sentiment_score: latestCall.sentiment === "positive" ? 0.8 : (latestCall.sentiment === "negative" ? -0.5 : 0.2)
        }

        // 3. Run Agentic Scoring
        const scoreResult = LeadIntelligence.scoreLead(analysis)

        // 4. Persist result to LeadScore and update Lead
        await prisma.$transaction([
            prisma.leadScore.upsert({
                where: { callLogId: latestCall.id },
                create: {
                    callLogId: latestCall.id,
                    budget: scoreResult.breakdown.budget,
                    authority: scoreResult.breakdown.authority,
                    needIntensity: scoreResult.breakdown.need_intensity,
                    urgency: scoreResult.breakdown.urgency,
                    engagementLevel: scoreResult.breakdown.engagement_level,
                    totalScore: scoreResult.lead_score / 100, // Normalized to 0-1 for storage
                    classification: scoreResult.status
                },
                update: {
                    budget: scoreResult.breakdown.budget,
                    authority: scoreResult.breakdown.authority,
                    needIntensity: scoreResult.breakdown.need_intensity,
                    urgency: scoreResult.breakdown.urgency,
                    engagementLevel: scoreResult.breakdown.engagement_level,
                    totalScore: scoreResult.lead_score / 100,
                    classification: scoreResult.status
                }
            }),
            prisma.lead.update({
                where: { id: leadId },
                data: {
                    score: scoreResult.lead_score,
                    status: scoreResult.status === "hot" ? "HOT_LEAD" : lead.status
                }
            })
        ])

        return NextResponse.json({
            success: true,
            score: scoreResult.lead_score,
            classification: scoreResult.status,
            breakdown: scoreResult.breakdown
        })

    } catch (error) {
        if (error instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        console.error("[Lead Qualify] Error:", error)
        return NextResponse.json({ error: "Qualification failed" }, { status: 500 })
    }
}
