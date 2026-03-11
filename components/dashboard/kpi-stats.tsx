"use client"

import { useState, useEffect } from "react"
import { Phone, Calendar, Zap, TrendingUp, Users, Bot, Loader2 } from "lucide-react"

type Stats = {
    totalLeads: number
    totalCalls: number
    meetingsBooked: number
    activeCampaigns: number
    activeAgents: number
    conversionRate: number
    avgCallDuration: number
}

export function KPIStats() {
    const [data, setData] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/dashboard/stats")
            .then((r) => r.ok ? r.json() : null)
            .then((d) => d && setData(d))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const stats = [
        { title: "Total Leads", value: data?.totalLeads ?? 0, icon: Users, color: "text-blue-400" },
        { title: "Calls Made", value: data?.totalCalls ?? 0, icon: Phone, color: "text-purple-400" },
        { title: "Meetings Booked", value: data?.meetingsBooked ?? 0, icon: Calendar, color: "text-emerald-400" },
        {
            title: "Conversion",
            value: data ? `${data.conversionRate}%` : "0%",
            icon: TrendingUp,
            color: "text-amber-400",
        },
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {stats.map((stat) => (
                <div
                    key={stat.title}
                    className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-4 transition-all duration-300 hover:border-zinc-700"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stat.title}</span>
                        <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                    </div>
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-700" />
                    ) : (
                        <h3 className="text-xl font-bold text-white tracking-tight">
                            {stat.value === 0 || stat.value === "0%" ? (
                                <span className="text-zinc-700">—</span>
                            ) : (
                                stat.value
                            )}
                        </h3>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            ))}
        </div>
    )
}
