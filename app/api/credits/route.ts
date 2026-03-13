import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { getBalance, getTransactionHistory, addCredits } from "@/lib/services/credits";

/**
 * GET /api/credits — returns current balance + transaction history
 * POST /api/credits — add credits (purchase / bonus)
 */

export async function GET() {
    try {
        const userId = await requireAuth();
        const [balance, history] = await Promise.all([
            getBalance(userId),
            getTransactionHistory(userId),
        ]);
        return NextResponse.json({ balance, history });
    } catch (error) {
        if (error instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userId = await requireAuth();
        const { amount, reason } = await req.json();

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        // In production this would go through Stripe; this is the fulfillment endpoint
        const newBalance = await addCredits(userId, amount, reason || "purchase");
        return NextResponse.json({ balance: newBalance, added: amount });
    } catch (error) {
        if (error instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Failed to add credits" }, { status: 500 });
    }
}
