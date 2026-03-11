"use client"

import { useState, useEffect } from "react"
import { Phone, Calendar, Zap, TrendingUp, Users, Bot, BarChart3, Clock, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react"

type DashStats = {
    totalLeads: number
    totalCalls: number
    meetingsBooked: number
    activeCampaigns: number
    activeAgents: number
    conversionRate: number
    avgCallDuration: number
    callsByOutcome: Record<string, number>
    campaignPerformance: { id: string; name: string; status: string; totalLeads: number; totalCalls: number }[]
    recentCalls: {
        id: string
        status: string | null
        duration: number | null
        sentiment: string | null
        createdAt: string
        lead: { id: string; name: string; phone: string } | null
        agent: { id: string; name: string } | null
    }[]
}

const outcomeColors: Record<string, string> = {
    booked: "text-emerald-400",
    interested: "text-blue-400",
    follow_up: "text-amber-400",
    not_interested: "text-red-400",
    no_answer: "text-zinc-500",
    unknown: "text-zinc-600",
}

const sentimentIcon: Record<string, React.FC<{ className?: string }>> = {
    positive: CheckCircle2,
    negative: XCircle,
    neutral: AlertCircle,
}

export default function DashboardOverviewPage() {
    const [stats, setStats] = useState<DashStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/dashboard/stats")
            .then((r) => r.ok ? r.json() : null)
            .then((d) => d && setStats(d))
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full py-32">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
            </div>
        )
    }

    const s = stats

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Dashboard</h2>
                <p className="text-zinc-500 mt-1 text-sm">Your AI sales platform at a glance</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: "Total Leads", value: s?.totalLeads ?? 0, icon: Users, color: "text-blue-400", glow: "from-blue-500/10" },
                    { label: "Calls Made", value: s?.totalCalls ?? 0, icon: Phone, color: "text-purple-400", glow: "from-purple-500/10" },
                    { label: "Booked", value: s?.meetingsBooked ?? 0, icon: Calendar, color: "text-emerald-400", glow: "from-emerald-500/10" },
                    { label: "Conversion", value: s ? `${s.conversionRate}%` : "—", icon: TrendingUp, color: "text-amber-400", glow: "from-amber-500/10" },
                ].map((card) => (
                    <div key={card.label} className={`rounded-xl border border-zinc-800 bg-gradient-to-b ${card.glow} to-zinc-900/50 p-5 hover:border-zinc-700 transition-colors`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{card.label}</span>
                            <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
                        </div>
                        <p className="text-2xl font-bold text-white">{card.value === 0 || card.value === "0%" ? <span className="text-zinc-700">—</span> : card.value}</p>
                    </div>
                ))}
            </div>

            {/* Secondary stats row */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Active Campaigns", value: s?.activeCampaigns ?? 0, icon: Zap, color: "text-purple-400" },
                    { label: "Active Agents", value: s?.activeAgents ?? 0, icon: Bot, color: "text-blue-400" },
                    { label: "Avg Call Duration", value: s?.avgCallDuration ? `${s.avgCallDuration}s` : "—", icon: Clock, color: "text-zinc-400" },
                ].map((card) => (
                    <div key={card.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
                            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{card.label}</span>
                        </div>
                        <p className="text-xl font-bold text-white">{card.value === 0 ? <span className="text-zinc-700">—</span> : card.value}</p>
                    </div>
                ))}
            </div>

            {/* Outcomes + Campaign Performance */}
            <div className="grid lg:grid-cols-2 gap-4">
                {/* Call Outcomes */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-purple-400" />
                        Call Outcomes
                    </h3>
                    {s && Object.keys(s.callsByOutcome).length > 0 ? (
                        <div className="space-y-2.5">
                            {Object.entries(s.callsByOutcome).map(([outcome, count]) => {
                                const total = Object.values(s.callsByOutcome).reduce((a, b) => a + b, 0)
                                const pct = Math.round((count / total) * 100)
                                return (
                                    <div key={outcome}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className={`capitalize font-medium ${outcomeColors[outcome] || "text-zinc-400"}`}>{outcome.replace("_", " ")}</span>
                                            <span className="text-zinc-500">{count} <span className="text-zinc-700">({pct}%)</span></span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-zinc-600 text-sm text-center py-8">No calls yet — activate a campaign to start calling.</p>
                    )}
                </div>

                {/* Campaign Performance */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-purple-400" />
                        Campaign Performance
                    </h3>
                    {s && s.campaignPerformance.length > 0 ? (
                        <div className="space-y-2">
                            {s.campaignPerformance.map((c) => (
                                <div key={c.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                                    <div>
                                        <p className="text-sm text-white font-medium">{c.name}</p>
                                        <p className="text-xs text-zinc-600">{c.totalLeads} leads · {c.totalCalls} calls</p>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${c.status === "ACTIVE" ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/10" :
                                        c.status === "PAUSED" ? "border-amber-500/20 text-amber-400 bg-amber-500/10" :
                                            "border-zinc-700 text-zinc-500 bg-zinc-800"
                                        }`}>{c.status}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-600 text-sm text-center py-8">No campaigns yet.</p>
                    )}
                </div>
            </div>

            {/* Recent Calls */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-purple-400" />
                    Recent Calls
                </h3>
                {s && s.recentCalls.length > 0 ? (
                    <div className="space-y-2">
                        {s.recentCalls.map((call) => {
                            const SentIcon = sentimentIcon[call.sentiment || "neutral"] || AlertCircle
                            return (
                                <div key={call.id} className="flex items-center justify-between py-2.5 border-b border-zinc-800 last:border-0 gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-zinc-400">
                                                {call.lead?.name?.charAt(0)?.toUpperCase() || "?"}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-white font-medium truncate">{call.lead?.name || "Unknown"}</p>
                                            <p className="text-xs text-zinc-600 font-mono">{call.lead?.phone || "—"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 text-xs">
                                        {call.duration && (
                                            <span className="text-zinc-600"><Clock className="h-3 w-3 inline mr-1" />{call.duration}s</span>
                                        )}
                                        {call.sentiment && (
                                            <SentIcon className={`h-4 w-4 ${call.sentiment === "positive" ? "text-emerald-400" :
                                                call.sentiment === "negative" ? "text-red-400" : "text-zinc-500"
                                                }`} />
                                        )}
                                        <span className="text-zinc-600">{new Date(call.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <p className="text-zinc-600 text-sm text-center py-8">No calls recorded yet.</p>
                )}
            </div>
        </div>
    )
}
