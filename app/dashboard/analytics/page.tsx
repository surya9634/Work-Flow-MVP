"use client"

import { useState, useEffect } from "react"
import {
    Bot, TrendingUp, Phone, Mic, BarChart3, Zap, ChevronDown, ChevronUp,
    MessageCircle, Loader2, AlertTriangle, ArrowUp, ArrowDown, Minus
} from "lucide-react"

type AgentStat = {
    agentId: string
    agentName: string
    totalCalls: number
    avgTalkRatio: number
    avgDuration: number
    sentimentBreakdown: { positive: number; neutral: number; negative: number }
    funnel: { calls: number; interested: number; booked: number; conversionRate: number }
    dailyVolume: Record<string, number>
    topObjections: { objection: string; count: number; counterScript: string }[]
}

type AnalyticsData = {
    overview: { totalCalls: number; totalBooked: number; overallConversion: number; avgTalkRatio: number; days: number }
    agents: AgentStat[]
}

function TalkRatioBar({ ratio }: { ratio: number }) {
    const pct = Math.round(ratio * 100)
    const color = pct > 45 ? "bg-emerald-500" : pct > 25 ? "bg-amber-500" : "bg-red-500"
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-500">
                <span>Agent</span>
                <span className="text-white font-medium">{100 - pct}% / {pct}% Prospect</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-purple-600 rounded-l-full" style={{ width: `${100 - pct}%` }} />
                <div className={`h-full ${color} rounded-r-full`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

function FunnelBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0
    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">{label}</span>
                <span className="text-white">{value} <span className="text-zinc-600">({pct}%)</span></span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

function ObjectionCard({ item }: { item: { objection: string; count: number; counterScript: string } }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-zinc-800/40 transition-colors"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="text-sm text-white capitalize truncate">{item.objection}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{item.count}×</span>
                    {open ? <ChevronUp className="h-3.5 w-3.5 text-zinc-600" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-600" />}
                </div>
            </button>
            {open && (
                <div className="px-3 pb-3">
                    <p className="text-xs text-zinc-400 font-medium mb-1.5">💡 Counter script:</p>
                    <p className="text-sm text-zinc-300 italic leading-relaxed bg-zinc-800/50 rounded p-2">
                        "{item.counterScript}"
                    </p>
                </div>
            )}
        </div>
    )
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [days, setDays] = useState(30)

    useEffect(() => {
        setLoading(true)
        fetch(`/api/analytics?days=${days}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => d && setData(d))
            .finally(() => setLoading(false))
    }, [days])

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
        </div>
    )

    const ov = data?.overview
    const agents = data?.agents ?? []

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Analytics</h2>
                    <p className="text-zinc-500 mt-1 text-sm">Call performance, sentiment & objection insights</p>
                </div>
                <div className="flex gap-2">
                    {[7, 30, 90].map(d => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors font-medium ${days === d
                                ? "border-purple-500/50 bg-purple-500/10 text-purple-300"
                                : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                                }`}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: "Total Calls", value: ov?.totalCalls ?? 0, icon: Phone, color: "text-blue-400", glow: "from-blue-500/10" },
                    { label: "Meetings Booked", value: ov?.totalBooked ?? 0, icon: Zap, color: "text-emerald-400", glow: "from-emerald-500/10" },
                    { label: "Conversion Rate", value: ov ? `${ov.overallConversion}%` : "—", icon: TrendingUp, color: "text-purple-400", glow: "from-purple-500/10" },
                    { label: "Avg Talk Ratio", value: ov ? `${Math.round(ov.avgTalkRatio * 100)}% prospect` : "—", icon: Mic, color: "text-amber-400", glow: "from-amber-500/10" },
                ].map(card => (
                    <div key={card.label} className={`rounded-xl border border-zinc-800 bg-gradient-to-b ${card.glow} to-zinc-900/50 p-5`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{card.label}</span>
                            <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
                        </div>
                        <p className="text-2xl font-bold text-white">{card.value === 0 ? <span className="text-zinc-700">—</span> : card.value}</p>
                    </div>
                ))}
            </div>

            {/* Per-Agent cards */}
            {agents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center">
                    <Bot className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-600 text-sm">No call data yet — run a campaign to see analytics.</p>
                </div>
            ) : (
                agents.map(agent => (
                    <div key={agent.agentId} className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
                        {/* Agent header */}
                        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                    <Bot className="h-4 w-4 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{agent.agentName}</p>
                                    <p className="text-xs text-zinc-600">{agent.totalCalls} calls · avg {agent.avgDuration}s</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-lg font-bold ${agent.funnel.conversionRate >= 10 ? "text-emerald-400" : agent.funnel.conversionRate >= 5 ? "text-amber-400" : "text-zinc-500"}`}>
                                    {agent.funnel.conversionRate}%
                                </span>
                                <span className="text-xs text-zinc-600">conv.</span>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-0 divide-x divide-zinc-800">
                            {/* Sentiment */}
                            <div className="p-5 space-y-3">
                                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <BarChart3 className="h-3.5 w-3.5" /> Sentiment
                                </h4>
                                {[
                                    { k: "positive", label: "Positive", color: "bg-emerald-500", icon: ArrowUp },
                                    { k: "neutral", label: "Neutral", color: "bg-zinc-500", icon: Minus },
                                    { k: "negative", label: "Negative", color: "bg-red-500", icon: ArrowDown },
                                ].map(({ k, label, color, icon: Icon }) => {
                                    const v = agent.sentimentBreakdown[k as keyof typeof agent.sentimentBreakdown]
                                    const total = Object.values(agent.sentimentBreakdown).reduce((a, b) => a + b, 0)
                                    const pct = total > 0 ? Math.round((v / total) * 100) : 0
                                    return (
                                        <div key={k}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-zinc-400 flex items-center gap-1"><Icon className="h-3 w-3" />{label}</span>
                                                <span className="text-white">{v} <span className="text-zinc-600">({pct}%)</span></span>
                                            </div>
                                            <div className="h-1.5 bg-zinc-800 rounded-full">
                                                <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    )
                                })}
                                <div className="pt-2">
                                    <p className="text-xs text-zinc-500 mb-2">Talk ratio</p>
                                    <TalkRatioBar ratio={agent.avgTalkRatio} />
                                </div>
                            </div>

                            {/* Conversion Funnel */}
                            <div className="p-5 space-y-3">
                                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <TrendingUp className="h-3.5 w-3.5" /> Funnel
                                </h4>
                                <FunnelBar label="Calls Made" value={agent.funnel.calls} total={agent.funnel.calls} color="bg-blue-500" />
                                <FunnelBar label="Interested" value={agent.funnel.interested} total={agent.funnel.calls} color="bg-purple-500" />
                                <FunnelBar label="Booked" value={agent.funnel.booked} total={agent.funnel.calls} color="bg-emerald-500" />
                                <div className="pt-2 border-t border-zinc-800">
                                    <p className="text-xs text-zinc-500">Conversion: <span className="text-white font-semibold">{agent.funnel.conversionRate}%</span></p>
                                </div>
                            </div>

                            {/* Objections */}
                            <div className="p-5 space-y-2">
                                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <MessageCircle className="h-3.5 w-3.5" /> Top Objections
                                </h4>
                                {agent.topObjections.length === 0 ? (
                                    <p className="text-xs text-zinc-600 py-4 text-center">No objections logged yet</p>
                                ) : (
                                    agent.topObjections.map((item, i) => (
                                        <ObjectionCard key={i} item={item} />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}
