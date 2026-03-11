"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
    Loader2, Save, Plus, Shield, Zap, Mic, Target,
    BrainCircuit, Volume2, Globe, Sparkles, ChevronRight,
    Activity, CheckCircle2, Copy
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

type TabValue = "identity" | "voice" | "directives" | "memory";

export function ToolsPanel() {
    const [loading, setLoading] = useState(true)
    const [saved, setSaved] = useState(false)
    const [activeTab, setActiveTab] = useState<TabValue>("identity")
    const [agentConfig, setAgentConfig] = useState({
        name: "Alex",
        voice: "professional_male",
        language: "en",
        greeting: "Hi, this is Alex from {company}. I'm reaching out because...",
        objective: "Book a 15-minute demo call",
        tone: "friendly",
    })

    const fetchSettings = () => {
        fetch("/api/settings")
            .then((res) => res.json())
            .then((data) => {
                if (data.id) {
                    setAgentConfig({
                        name: data.name || "Alex",
                        voice: data.voice || "professional_male",
                        language: data.language || "en",
                        greeting: data.greeting || "",
                        objective: data.objective || "",
                        tone: data.tone || "friendly",
                    })
                }
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }

    useEffect(() => {
        fetchSettings()
        const handleUpdate = () => {
            fetchSettings()
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        }
        window.addEventListener("agentConfigUpdated", handleUpdate)
        return () => window.removeEventListener("agentConfigUpdated", handleUpdate)
    }, [])

    const handleSave = async () => {
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(agentConfig),
            })
            if (res.ok) {
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
            }
        } catch (error) {
            console.error(error)
        }
    }

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
                    <p className="text-[10px] text-zinc-700 uppercase tracking-widest">Loading config</p>
                </div>
            </div>
        )
    }

    const tabs: { value: TabValue; label: string; icon: React.ReactNode }[] = [
        { value: "identity", label: "Identity", icon: <BrainCircuit className="w-3.5 h-3.5" /> },
        { value: "voice", label: "Voice", icon: <Volume2 className="w-3.5 h-3.5" /> },
        { value: "directives", label: "Directives", icon: <Target className="w-3.5 h-3.5" /> },
        { value: "memory", label: "Memory", icon: <Shield className="w-3.5 h-3.5" /> },
    ]

    return (
        <div className="h-full bg-black text-white flex flex-col relative">
            {/* ─── HEADER ─────────────────────────── */}
            <div className="px-5 pt-5 pb-4">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-zinc-300" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-black" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold tracking-tight text-white">{agentConfig.name}</h2>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                <p className="text-[10px] text-zinc-500 font-medium">Ready to deploy</p>
                            </div>
                        </div>
                    </div>
                    <Badge className="bg-zinc-900 text-zinc-400 border-zinc-800 font-normal text-[10px] px-2">
                        v1.0
                    </Badge>
                </div>

                {/* ─── TABS ───────────────────────────── */}
                <div className="flex gap-1 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800/50">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-medium transition-all duration-200",
                                activeTab === tab.value
                                    ? "bg-zinc-800 text-white shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            {tab.icon}
                            <span className="hidden lg:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── CONTENT ────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 scrollbar-hide">
                <AnimatePresence mode="wait">
                    {activeTab === "identity" && (
                        <motion.div
                            key="identity"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="space-y-5"
                        >
                            {/* Agent Avatar Card */}
                            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-2xl font-bold text-purple-300">
                                            {agentConfig.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Input
                                            value={agentConfig.name}
                                            onChange={(e) => setAgentConfig({ ...agentConfig, name: e.target.value })}
                                            className="bg-transparent border-none text-white text-lg font-semibold h-auto p-0 focus-visible:ring-0 placeholder:text-zinc-700"
                                            placeholder="Agent name"
                                        />
                                        <p className="text-[10px] text-zinc-600 mt-0.5">AI Sales Development Rep</p>
                                    </div>
                                </div>
                            </div>

                            {/* Language */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Language</Label>
                                <Select
                                    value={agentConfig.language}
                                    onValueChange={(val) => setAgentConfig({ ...agentConfig, language: val })}
                                >
                                    <SelectTrigger className="bg-zinc-900/60 border-zinc-800/50 text-white focus:ring-0 h-10 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <Globe className="w-3.5 h-3.5 text-zinc-500" />
                                            <SelectValue />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                                        <SelectItem value="en">English (US)</SelectItem>
                                        <SelectItem value="en-gb">English (UK)</SelectItem>
                                        <SelectItem value="es">Spanish</SelectItem>
                                        <SelectItem value="fr">French</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>


                        </motion.div>
                    )}

                    {activeTab === "voice" && (
                        <motion.div
                            key="voice"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="space-y-5"
                        >
                            {/* Voice Model Selector */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Voice Model</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: "professional_male", label: "Male", sub: "Professional" },
                                        { value: "professional_female", label: "Female", sub: "Professional" },
                                        { value: "casual_male", label: "Male", sub: "Casual" },
                                        { value: "casual_female", label: "Female", sub: "Casual" },
                                    ].map((voice) => (
                                        <button
                                            key={voice.value}
                                            onClick={() => setAgentConfig({ ...agentConfig, voice: voice.value })}
                                            className={cn(
                                                "p-3 rounded-xl border text-left transition-all duration-200",
                                                agentConfig.voice === voice.value
                                                    ? "bg-white/5 border-white/20 ring-1 ring-white/10"
                                                    : "bg-zinc-900/40 border-zinc-800/30 hover:border-zinc-700/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Volume2 className={cn(
                                                    "w-3 h-3",
                                                    agentConfig.voice === voice.value ? "text-white" : "text-zinc-600"
                                                )} />
                                                <span className={cn(
                                                    "text-xs font-medium",
                                                    agentConfig.voice === voice.value ? "text-white" : "text-zinc-400"
                                                )}>{voice.label}</span>
                                            </div>
                                            <p className="text-[10px] text-zinc-600">{voice.sub}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tone Selector */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Conversation Tone</Label>
                                <div className="flex flex-wrap gap-2">
                                    {["professional", "friendly", "urgent", "sympathetic"].map((tone) => (
                                        <button
                                            key={tone}
                                            onClick={() => setAgentConfig({ ...agentConfig, tone })}
                                            className={cn(
                                                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 capitalize",
                                                agentConfig.tone === tone
                                                    ? "bg-white text-black border-white"
                                                    : "bg-transparent text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700"
                                            )}
                                        >
                                            {tone}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Preview Card */}
                            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/30 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-zinc-600" />
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Voice Preview</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 hover:bg-zinc-200 transition-colors">
                                        <Mic className="w-4 h-4 text-black" />
                                    </button>
                                    <div className="flex-1 h-8 flex items-center gap-0.5">
                                        {Array.from({ length: 32 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 bg-zinc-800 rounded-full"
                                                style={{ height: `${Math.random() * 100}%`, minHeight: 2 }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-[10px] text-zinc-600">Click to preview — 3s sample</p>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "directives" && (
                        <motion.div
                            key="directives"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="space-y-5"
                        >
                            {/* Primary Goal */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Primary Goal</Label>
                                <Input
                                    value={agentConfig.objective}
                                    onChange={(e) => setAgentConfig({ ...agentConfig, objective: e.target.value })}
                                    className="bg-zinc-900/60 border-zinc-800/50 text-white placeholder:text-zinc-700 focus-visible:ring-0 focus-visible:border-zinc-700 h-10 rounded-xl"
                                    placeholder="e.g. Book a demo call"
                                />
                            </div>

                            {/* Opening Script */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Opening Script</Label>
                                    <button className="text-zinc-600 hover:text-zinc-400 transition-colors">
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                                <Textarea
                                    className="min-h-[120px] bg-zinc-900/60 border-zinc-800/50 text-white placeholder:text-zinc-700 focus-visible:ring-0 focus-visible:border-zinc-700 resize-none leading-relaxed text-sm rounded-xl"
                                    value={agentConfig.greeting}
                                    onChange={(e) => setAgentConfig({ ...agentConfig, greeting: e.target.value })}
                                    placeholder="What your agent says first..."
                                />
                            </div>

                            {/* Constraints */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Constraints</Label>
                                <div className="space-y-2">
                                    {[
                                        "Stay concise — max 3 sentences per turn",
                                        "Never hallucinate product features",
                                        "Always move toward conversion",
                                    ].map((constraint, i) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/30"
                                        >
                                            <CheckCircle2 className="w-3 h-3 text-emerald-500/70 mt-0.5 flex-shrink-0" />
                                            <span className="text-xs text-zinc-400 leading-relaxed">{constraint}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "memory" && (
                        <motion.div
                            key="memory"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="space-y-5"
                        >
                            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/30 space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Context Store</p>
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-medium">Active</Badge>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { type: "Fact", text: "Company name is \"Acme Corp\"" },
                                        { type: "Rule", text: "Never promise specific ROI numbers without checking first." },
                                        { type: "Persona", text: "Tone: Friendly and professional SDR" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3 group">
                                            <span className={cn(
                                                "text-[9px] font-bold uppercase tracking-widest mt-1 min-w-[44px]",
                                                item.type === "Fact" ? "text-blue-400/60" :
                                                    item.type === "Rule" ? "text-amber-400/60" :
                                                        "text-purple-400/60"
                                            )}>
                                                {item.type}
                                            </span>
                                            <span className="text-xs text-zinc-400 leading-relaxed">{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Missions Empty State */}
                            <div className="p-6 rounded-xl border border-dashed border-zinc-800/50 flex flex-col items-center text-center">
                                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800/50 flex items-center justify-center mb-3">
                                    <Zap className="h-4 w-4 text-zinc-600" />
                                </div>
                                <h3 className="text-xs font-medium text-zinc-300 mb-1">No Active Campaigns</h3>
                                <p className="text-[10px] text-zinc-600 mb-4 max-w-[180px] leading-relaxed">
                                    Complete onboarding to deploy your first campaign.
                                </p>
                                <Button
                                    variant="outline"
                                    className="border-zinc-800 bg-zinc-900/60 text-white hover:bg-zinc-800 hover:text-white h-8 text-[11px] px-4 rounded-lg"
                                >
                                    <Plus className="w-3 h-3 mr-1.5" />
                                    Create
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ─── BOTTOM ACTION BAR ─────────────── */}
            <div className="flex-shrink-0 p-4 border-t border-zinc-800/50">
                <Button
                    onClick={handleSave}
                    className={cn(
                        "w-full h-10 font-medium text-sm transition-all rounded-xl",
                        saved
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-white text-black hover:bg-zinc-200"
                    )}
                >
                    {saved ? (
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" /> Configuration Saved
                        </span>
                    ) : (
                        "Save Configuration"
                    )}
                </Button>
            </div>
        </div>
    )
}
