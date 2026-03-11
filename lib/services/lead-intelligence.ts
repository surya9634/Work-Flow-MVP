/**
 * LEAD INTELLIGENCE ENGINE
 * 
 * After each call, extract intent/objections/sentiment and score the lead.
 */

export interface CallAnalysis {
    intent: string;
    objections_detected: string[];
    qualification_answers: Record<string, string>;
    booking_status: "booked" | "pending" | "rejected" | "no_answer";
    sentiment_score: number; // -1 to 1
}

export interface LeadScoreResult {
    lead_score: number;
    status: "hot" | "warm" | "cold" | "unqualified";
    breakdown: {
        budget: number;
        authority: number;
        need_intensity: number;
        urgency: number;
        engagement_level: number;
    };
}

// Weights for BANT+ scoring
const WEIGHTS = {
    budget: 0.2,
    authority: 0.25,
    need_intensity: 0.25,
    urgency: 0.15,
    engagement_level: 0.15,
};

export class LeadIntelligence {

    /**
     * Score a lead based on call analysis data.
     */
    static scoreLead(analysis: CallAnalysis): LeadScoreResult {
        const breakdown = {
            budget: LeadIntelligence.inferBudgetScore(analysis),
            authority: LeadIntelligence.inferAuthorityScore(analysis),
            need_intensity: LeadIntelligence.inferNeedScore(analysis),
            urgency: LeadIntelligence.inferUrgencyScore(analysis),
            engagement_level: LeadIntelligence.inferEngagementScore(analysis),
        };

        const totalScore = Object.entries(breakdown).reduce((sum, [key, value]) => {
            return sum + value * WEIGHTS[key as keyof typeof WEIGHTS];
        }, 0);

        const normalizedScore = Math.round(totalScore * 100);

        let status: LeadScoreResult["status"];
        if (normalizedScore >= 75) status = "hot";
        else if (normalizedScore >= 50) status = "warm";
        else if (normalizedScore >= 25) status = "cold";
        else status = "unqualified";

        return { lead_score: normalizedScore, status, breakdown };
    }

    // ─── INFERENCE HELPERS ────────────────────────────

    static inferBudgetScore(a: CallAnalysis): number {
        if (a.objections_detected.some(o => o.toLowerCase().includes("price") || o.toLowerCase().includes("budget"))) return 0.3;
        if (a.booking_status === "booked") return 0.9;
        return 0.5;
    }

    static inferAuthorityScore(a: CallAnalysis): number {
        if (a.objections_detected.some(o => o.toLowerCase().includes("authority") || o.toLowerCase().includes("boss"))) return 0.2;
        if (a.intent.toLowerCase().includes("decision")) return 0.9;
        return 0.5;
    }

    static inferNeedScore(a: CallAnalysis): number {
        if (a.sentiment_score > 0.5) return 0.8;
        if (a.sentiment_score < -0.3) return 0.2;
        return 0.5;
    }

    static inferUrgencyScore(a: CallAnalysis): number {
        if (a.booking_status === "booked") return 0.9;
        if (a.booking_status === "pending") return 0.6;
        return 0.3;
    }

    static inferEngagementScore(a: CallAnalysis): number {
        const objCount = a.objections_detected.length;
        if (a.booking_status === "booked") return 1.0;
        if (objCount > 0 && a.sentiment_score > 0) return 0.7; // engaged but concerned
        if (a.booking_status === "no_answer") return 0.0;
        return 0.4;
    }
}
