import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

/**
 * Get authenticated user ID from session.
 * Returns userId string or null if unauthenticated.
 * In development, falls back to "user_123" if no session exists.
 */
export async function getAuthUserId(): Promise<string | null> {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    if (userId) return userId

    // Dev fallback — allows testing without login
    if (process.env.NODE_ENV === "development") {
        return "user_123"
    }

    return null
}

/**
 * Get authenticated user ID or throw a structured error.
 * Use this in API routes to guard endpoints.
 */
export async function requireAuth(): Promise<string> {
    const userId = await getAuthUserId()
    if (!userId) {
        throw new AuthError("Unauthorized")
    }
    return userId
}

export class AuthError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "AuthError"
    }
}
