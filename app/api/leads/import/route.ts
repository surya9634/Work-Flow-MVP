import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/auth"

/**
 * POST /api/leads/import
 * Bulk-import leads.
 */
export async function POST(req: Request) {
    try {
        const userId = await requireAuth()
        const body = await req.json()
        const { csv, leads: jsonLeads, campaignId } = body

        if (campaignId) {
            const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } })
            if (!campaign) {
                return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
            }
        }

        const parsedLeads: { name: string; phone: string; email?: string; source: string }[] = []
        const parseErrors: string[] = []

        // JSON handling
        if (Array.isArray(jsonLeads) && jsonLeads.length > 0) {
            for (let i = 0; i < jsonLeads.length; i++) {
                const { name, phone, email, source } = jsonLeads[i]
                if (!name || !phone) {
                    parseErrors.push(`Row ${i + 1}: missing name or phone`)
                    continue
                }
                parsedLeads.push({ name, phone: phone.replace(/[^\d+]/g, ""), email, source: source || "import" })
            }
        }
        // Robust CSV handling (Regex based to handle quotes/commas in values)
        else if (csv && typeof csv === "string") {
            const lines = csv.trim().split(/\r?\n/).filter(Boolean)
            if (lines.length === 0) return NextResponse.json({ error: "CSV is empty" }, { status: 400 })

            const firstLine = lines[0].toLowerCase()
            const hasHeader = firstLine.includes("name") || firstLine.includes("phone")
            const dataLines = hasHeader ? lines.slice(1) : lines

            const csvRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/g; // Match commas NOT inside quotes

            for (let i = 0; i < dataLines.length; i++) {
                const parts = dataLines[i].split(csvRegex).map(p => p.trim().replace(/^["']|["']$/g, ""))
                const [name, phone, email] = parts
                if (!name || !phone) {
                    parseErrors.push(`Row ${i + 1}: missing name or phone`)
                    continue
                }
                parsedLeads.push({
                    name,
                    phone: phone.replace(/[^\d+]/g, ""),
                    email: email || undefined,
                    source: "CSV_IMPORT"
                })
            }
        } else {
            return NextResponse.json({ error: "Missing 'leads' or 'csv' data." }, { status: 400 })
        }

        if (parsedLeads.length === 0) {
            return NextResponse.json({ error: "No valid leads found.", errors: parseErrors }, { status: 400 })
        }

        const created = await prisma.lead.createMany({
            data: parsedLeads.map((l) => ({
                userId,
                name: l.name,
                phone: l.phone,
                email: l.email || null,
                source: l.source,
                campaignId: campaignId || null,
                status: "NEW",
            })),
        })

        return NextResponse.json({
            success: true,
            imported: created.count,
            skipped: parseErrors.length,
            errors: parseErrors.length > 0 ? parseErrors.slice(0, 20) : undefined,
        }, { status: 201 })
    } catch (error) {
        if (error instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        console.error("[Lead Import] Error:", error)
        return NextResponse.json({ error: "Failed to import" }, { status: 500 })
    }
}
