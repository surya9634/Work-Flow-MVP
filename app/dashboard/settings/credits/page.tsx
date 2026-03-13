"use client"

import { useState, useEffect } from "react"
import { CreditCard, Zap, ArrowUpRight, ArrowDownLeft, Plus, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

const CREDIT_PACKS = [
    { label: "Starter", credits: 500, price: "$9", description: "~500 call minutes" },
    { label: "Growth", credits: 2000, price: "$29", description: "~2,000 call minutes", popular: true },
    { label: "Scale", credits: 10000, price: "$99", description: "~10,000 call minutes" },
]

type Transaction = {
    id: string
    amount: number
    reason: string
    createdAt: string
    callLogId?: string
}

export default function CreditsPage() {
    const [balance, setBalance] = useState<number | null>(null)
    const [history, setHistory] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState<string | null>(null)

    useEffect(() => {
        fetch("/api/credits")
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (d) { setBalance(d.balance); setHistory(d.history ?? []) }
            })
            .finally(() => setLoading(false))
    }, [])

    async function handlePurchase(credits: number, packLabel: string) {
        setAdding(packLabel)
        try {
            const res = await fetch("/api/credits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: credits, reason: "purchase" }),
            })
            const data = await res.json()
            if (data.balance !== undefined) {
                setBalance(data.balance)
                setHistory(prev => [{
                    id: Date.now().toString(),
                    amount: credits,
                    reason: "purchase",
                    createdAt: new Date().toISOString(),
                }, ...prev])
            }
        } finally {
            setAdding(null)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
        </div>
    )

    const isLow = balance !== null && balance < 50

    return (
        <div className="space-y-6 pb-10 max-w-3xl mx-auto">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Credits</h2>
                <p className="text-zinc-500 mt-1 text-sm">1 credit = 1 call minute. Credits never expire.</p>
            </div>

            {/* Balance card */}
            <div className={`rounded-2xl border p-8 bg-gradient-to-br ${isLow ? "from-red-500/10 border-red-500/20 to-zinc-900/80" : "from-purple-500/10 border-purple-500/20 to-zinc-900/80"}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-full ${isLow ? "bg-red-500/10 border-red-500/20" : "bg-purple-500/10 border-purple-500/20"} border flex items-center justify-center`}>
                        <CreditCard className={`h-5 w-5 ${isLow ? "text-red-400" : "text-purple-400"}`} />
                    </div>
                    <p className="text-sm text-zinc-400">Current Balance</p>
                </div>
                <p className={`text-6xl font-black tracking-tight ${isLow ? "text-red-400" : "text-white"}`}>{balance?.toLocaleString() ?? "—"}</p>
                <p className="text-zinc-500 mt-2 text-sm">credits available</p>
                {isLow && (
                    <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        Low balance — outbound calls will be blocked when credits reach 0.
                    </div>
                )}
            </div>

            {/* Buy packs */}
            <div>
                <h3 className="text-sm font-semibold text-white mb-3">Buy Credits</h3>
                <div className="grid grid-cols-3 gap-3">
                    {CREDIT_PACKS.map(pack => (
                        <div key={pack.label} className={`relative rounded-xl border p-5 ${pack.popular
                            ? "border-purple-500/40 bg-purple-500/5"
                            : "border-zinc-800 bg-zinc-900/50"
                            }`}>
                            {pack.popular && (
                                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-purple-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Popular
                                </span>
                            )}
                            <p className="text-xs text-zinc-500 font-medium mb-1">{pack.label}</p>
                            <p className="text-2xl font-black text-white">{pack.price}</p>
                            <p className="text-xs text-purple-400 font-semibold mt-1">{pack.credits.toLocaleString()} credits</p>
                            <p className="text-xs text-zinc-600 mb-4">{pack.description}</p>
                            <Button
                                onClick={() => handlePurchase(pack.credits, pack.label)}
                                disabled={adding !== null}
                                className={`w-full text-xs h-8 ${pack.popular
                                    ? "bg-purple-600 hover:bg-purple-500 text-white"
                                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                                    }`}
                            >
                                {adding === pack.label ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Plus className="h-3 w-3 mr-1" />Buy</>}
                            </Button>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-zinc-600 mt-2">* Stripe integration coming soon. Clicking Buy adds credits instantly for now.</p>
            </div>

            {/* Transaction history */}
            <div>
                <h3 className="text-sm font-semibold text-white mb-3">Transaction History</h3>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                    {history.length === 0 ? (
                        <p className="text-zinc-600 text-sm text-center py-10">No transactions yet.</p>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {history.slice(0, 30).map(tx => {
                                const isCredit = tx.amount > 0
                                return (
                                    <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isCredit ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                                                {isCredit
                                                    ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                                                    : <ArrowDownLeft className="h-3.5 w-3.5 text-red-400" />}
                                            </div>
                                            <div>
                                                <p className="text-sm text-white capitalize">{tx.reason.replace(/_/g, " ")}</p>
                                                <p className="text-xs text-zinc-600">{new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-semibold ${isCredit ? "text-emerald-400" : "text-red-400"}`}>
                                            {isCredit ? "+" : ""}{tx.amount}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
