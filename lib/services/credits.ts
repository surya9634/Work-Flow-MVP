/**
 * CREDITS SERVICE
 *
 * Manages the user credit balance.
 * 1 credit = 1 call minute (rounded up).
 * Balance lives on User.credits; every transaction is recorded in CreditTransaction.
 */

import { prisma } from "@/lib/prisma";

export const CREDITS_PER_MINUTE = 1;
export const LOW_BALANCE_THRESHOLD = 50;

/**
 * Get current credit balance for a user.
 */
export async function getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } });
    return user?.credits ?? 0;
}

/**
 * Debit credits for a completed call.
 * @param userId
 * @param durationSeconds - call duration; rounded up to the nearest minute
 * @param callLogId       - optional audit reference
 * @returns new balance, or null if user not found
 */
export async function debitCallCredits(
    userId: string,
    durationSeconds: number,
    callLogId?: string
): Promise<{ newBalance: number; debited: number } | null> {
    const minutes = Math.max(1, Math.ceil(durationSeconds / 60));
    const cost = minutes * CREDITS_PER_MINUTE;

    const [, updated] = await prisma.$transaction([
        prisma.creditTransaction.create({
            data: { userId, amount: -cost, reason: "call_minute", callLogId },
        }),
        prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: cost } },
            select: { credits: true },
        }),
    ]);

    console.log(`[Credits] Debited ${cost} credits from ${userId} (${minutes} min call). Balance: ${updated.credits}`);
    return { newBalance: updated.credits, debited: cost };
}

/**
 * Add credits to a user (signup bonus, purchase, manual top-up).
 */
export async function addCredits(
    userId: string,
    amount: number,
    reason: "signup_bonus" | "purchase" | "manual" = "purchase"
): Promise<number> {
    const [, updated] = await prisma.$transaction([
        prisma.creditTransaction.create({ data: { userId, amount, reason } }),
        prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: amount } },
            select: { credits: true },
        }),
    ]);
    return updated.credits;
}

/**
 * Check if user has enough credits to start a call.
 * Blocks calls when balance is 0.
 */
export async function canMakeCall(userId: string): Promise<boolean> {
    const balance = await getBalance(userId);
    return balance > 0;
}

/**
 * Get recent credit transactions for a user (last 50).
 */
export async function getTransactionHistory(userId: string) {
    return prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
}
