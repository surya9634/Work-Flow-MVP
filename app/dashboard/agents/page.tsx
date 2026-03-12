"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Bot, Zap, Phone, MessageSquare, Loader2, ChevronRight, FileText, Trash2, AlertTriangle, Sparkles, Volume2, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { VOICE_CATALOG, VOICE_CATEGORIES, DEFAULT_VOICE_ID, type VoiceCategory } from "@/lib/voice-catalog"

type Agent = {
    id: string
    name: string
    status: string
    createdAt: string
    systemPrompt: string | null
    openingScript: string | null
    voiceProfile: string | null
    llmModel: string | null
    _count?: { callLogs: number }
}


const LLM_OPTIONS = [
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile" },
    { id: "llama3-8b-8192", name: "Llama 3 8B (8K Context)" },
    { id: "llama3-70b-8192", name: "Llama 3 70B (8K Context)" },
    { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B (32K Context)" },
    { id: "gemma2-9b-it", name: "Gemma 2 9B IT" },
    { id: "gemma-7b-it", name: "Gemma 7B IT" }
]

const statusConfig: Record<string, { label: string; class: string }> = {
    DRAFT: { label: "Draft", class: "bg-zinc-800 text-zinc-400 border-zinc-700" },
    ACTIVE: { label: "Active", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    PAUSED: { label: "Paused", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    ARCHIVED: { label: "Archived", class: "bg-zinc-800 text-zinc-600 border-zinc-700" },
}

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selected, setSelected] = useState<Agent | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isPreviewing, setIsPreviewing] = useState<string | null>(null)

    // Edit states for the detail panel
    const [editName, setEditName] = useState("")
    const [editSystemPrompt, setEditSystemPrompt] = useState("")
    const [editOpeningScript, setEditOpeningScript] = useState("")
    const [editVoiceId, setEditVoiceId] = useState(DEFAULT_VOICE_ID)
    const [editLlmModel, setEditLlmModel] = useState("llama-3.3-70b-versatile")
    const [voiceCategory, setVoiceCategory] = useState<VoiceCategory>("English")
    const [voiceGender, setVoiceGender] = useState<"all" | "female" | "male">("all")

    const fetchAgents = () => {
        setIsLoading(true)
        fetch("/api/agents")
            .then((r) => r.json())
            .then((d) => setAgents(d.agents || []))
            .finally(() => setIsLoading(false))
    }

    useEffect(() => { fetchAgents() }, [])

    useEffect(() => {
        if (selected) {
            setEditName(selected.name || "")
            setEditSystemPrompt(selected.systemPrompt || "")
            setEditOpeningScript(selected.openingScript || "")
            setEditLlmModel(selected.llmModel || "llama-3.3-70b-versatile")
            try {
                const vp = JSON.parse(selected.voiceProfile || "{}")
                setEditVoiceId(vp.voiceId || DEFAULT_VOICE_ID)
            } catch {
                setEditVoiceId(DEFAULT_VOICE_ID)
            }
        }
    }, [selected])

    const handleSave = async () => {
        if (!selected) return
        setIsSaving(true)
        try {
            const res = await fetch(`/api/agents/${selected.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName,
                    systemPrompt: editSystemPrompt,
                    openingScript: editOpeningScript,
                    voiceProfile: { voiceId: editVoiceId },
                    llmModel: editLlmModel
                })
            })

            if (res.ok) {
                const data = await res.json()
                setAgents(prev => prev.map(a => a.id === selected.id ? data.agent : a))
                setSelected(data.agent)
            }
        } catch (err) {
            console.error("Save failed:", err)
        } finally {
            setIsSaving(false)
        }
    }

    const handlePreviewVoice = async (voiceId: string) => {
        if (typeof window === "undefined") return

        setIsPreviewing(voiceId)
        console.log(`[Preview] Requesting Cloud Neural Voice: ${voiceId}`)

        try {
            const res = await fetch("/api/sandbox/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: "Hi, I'm your AI sales agent. My voice is now processed through a high-quality neural engine for a natural, human-like sound.",
                    voiceId
                }),
            })
            const data = await res.json()

            if (data.audioBase64) {
                const audio = new Audio(`data:audio/mpeg;base64,${data.audioBase64}`)
                audio.onended = () => setIsPreviewing(null)
                await audio.play()
                console.log(`[Realistic-Preview] Success for: ${voiceId}`)
            } else {
                throw new Error("No audio returned")
            }
        } catch (err) {
            console.error("Preview failed:", err)
            setIsPreviewing(null)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/agents/${deleteTarget.id}`, { method: "DELETE" })
            if (res.ok) {
                setAgents((prev) => prev.filter((a) => a.id !== deleteTarget.id))
                if (selected?.id === deleteTarget.id) setSelected(null)
                setDeleteTarget(null)
            }
        } catch (err) {
            console.error("Delete failed:", err)
        } finally {
            setIsDeleting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">AI Agents</h2>
                <p className="text-zinc-500 mt-1">Your generated AI sales agents</p>
            </div>

            {/* Delete confirmation dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-400" />
                            </div>
                            <DialogTitle className="text-white">Delete Agent</DialogTitle>
                        </div>
                        <DialogDescription className="text-zinc-400">
                            Are you sure you want to delete <span className="text-white font-medium">{deleteTarget?.name}</span>? This will permanently remove the agent and all its versions. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => setDeleteTarget(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</>
                            ) : (
                                <><Trash2 className="h-4 w-4 mr-2" /> Delete Agent</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {agents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                        <Bot className="h-5 w-5 text-zinc-600" />
                    </div>
                    <h3 className="text-sm font-medium text-zinc-300 mb-1">No agents yet</h3>
                    <p className="text-xs text-zinc-600 mb-6 max-w-[240px] leading-relaxed">
                        Complete the AI onboarding chat to auto-generate your first sales agent.
                    </p>
                    <Button onClick={() => window.location.href = "/onboarding"} className="bg-purple-600 hover:bg-purple-700 text-white">
                        Start Onboarding
                    </Button>
                </div>
            ) : (
                <div className={`grid gap-4 ${selected ? "lg:grid-cols-2" : "grid-cols-1"}`}>
                    {/* Agent cards */}
                    <div className="space-y-3">
                        {agents.map((agent) => {
                            const status = statusConfig[agent.status] || statusConfig["DRAFT"]
                            const vp = (() => { try { return JSON.parse(agent.voiceProfile || "{}") } catch { return {} } })()
                            const isSelected = selected?.id === agent.id

                            return (
                                <div
                                    key={agent.id}
                                    onClick={() => setSelected(isSelected ? null : agent)}
                                    className={`rounded-xl border p-5 cursor-pointer transition-all ${isSelected
                                        ? "bg-zinc-800/80 border-purple-500/40"
                                        : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                                                <Bot className="h-5 w-5 text-purple-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-white">{agent.name}</h3>
                                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${status.class}`}>
                                                        {agent.status === "ACTIVE" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-zinc-600">
                                                    {vp.gender && <span className="capitalize">{vp.gender} · {vp.tone}</span>}
                                                    <span>Created {new Date(agent.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delete button (stop click propagation) */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setDeleteTarget(agent)
                                                }}
                                                className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                title="Delete agent"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                            <ChevronRight className={`h-4 w-4 text-zinc-600 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                                        </div>
                                    </div>

                                    {agent.openingScript && (
                                        <p className="text-xs text-zinc-500 italic line-clamp-2 ml-[52px] mt-3">
                                            &ldquo;{agent.openingScript}&rdquo;
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 mt-3 ml-[52px] text-xs text-zinc-600">
                                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> Voice calls</span>
                                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Sandbox ready</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Detail panel */}
                    {selected && (
                        <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-5 h-fit overflow-y-auto max-h-[80vh]">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-white">Agent Settings</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setDeleteTarget(selected)}
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                                    >
                                        <Trash2 className="h-3 w-3" /> Delete
                                    </button>
                                    <button onClick={() => setSelected(null)} className="text-zinc-600 hover:text-zinc-400 text-xs text-bold">✕</button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">Agent Name</label>
                                    <Input
                                        value={editName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                                        className="bg-zinc-800 border-zinc-700 text-sm text-white focus:border-purple-500"
                                    />
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Volume2 className="h-3 w-3" /> Agent Voice
                                    </p>

                                    {/* Category Tabs */}
                                    <div className="flex gap-1 mb-3 bg-zinc-800/50 rounded-lg p-1">
                                        {VOICE_CATEGORIES.map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => setVoiceCategory(cat)}
                                                className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                                                    voiceCategory === cat
                                                        ? "bg-purple-600 text-white shadow-sm"
                                                        : "text-zinc-500 hover:text-zinc-300"
                                                }`}
                                            >
                                                {cat === "Indian English" ? "IN English" : cat}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Gender Filter */}
                                    <div className="flex gap-1.5 mb-3">
                                        {(["all", "female", "male"] as const).map((g) => (
                                            <button
                                                key={g}
                                                onClick={() => setVoiceGender(g)}
                                                className={`px-2.5 py-0.5 rounded-full text-[11px] border transition-all capitalize ${
                                                    voiceGender === g
                                                        ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                                                        : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                                                }`}
                                            >
                                                {g === "all" ? "All" : g === "female" ? "♀ Female" : "♂ Male"}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Voice Cards */}
                                    <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                                        {VOICE_CATALOG
                                            .filter(v => v.category === voiceCategory && (voiceGender === "all" || v.gender === voiceGender))
                                            .map((voice) => (
                                                <div
                                                    key={voice.id}
                                                    onClick={() => setEditVoiceId(voice.id)}
                                                    className={`flex flex-col items-start px-3 py-2 rounded-lg text-xs border transition-all cursor-pointer ${
                                                        editVoiceId === voice.id
                                                            ? "bg-purple-500/10 border-purple-500/50 text-purple-400 ring-1 ring-purple-500/50"
                                                            : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                                    }`}
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setEditVoiceId(voice.id) }}
                                                >
                                                    <div className="flex w-full items-center justify-between gap-1 mb-0.5">
                                                        <span className="font-semibold text-white truncate">{voice.name}</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handlePreviewVoice(voice.id) }}
                                                            disabled={isPreviewing !== null}
                                                            className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-purple-400 transition-colors shrink-0"
                                                            title="Preview voice"
                                                        >
                                                            {isPreviewing === voice.id ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <Volume2 className="h-3 w-3" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <span className="capitalize opacity-60 text-[10px] truncate w-full">{voice.description}</span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">AI Model</label>
                                    <select
                                        value={editLlmModel}
                                        onChange={(e) => setEditLlmModel(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white focus:border-purple-500 focus:outline-none appearance-none mb-4"
                                    >
                                        {LLM_OPTIONS.map(model => (
                                            <option key={model.id} value={model.id}>{model.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <FileText className="h-3 w-3" /> System Prompt
                                    </p>
                                    <textarea
                                        value={editSystemPrompt}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditSystemPrompt(e.target.value)}
                                        rows={6}
                                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-3 text-xs text-zinc-300 leading-relaxed focus:border-purple-500 focus:outline-none resize-none"
                                    />
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <MessageSquare className="h-3 w-3" /> Opening Script
                                    </p>
                                    <textarea
                                        value={editOpeningScript}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditOpeningScript(e.target.value)}
                                        rows={2}
                                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-3 text-xs text-zinc-300 italic focus:border-purple-500 focus:outline-none resize-none"
                                    />
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Calendar className="h-3 w-3" /> Integrations
                                    </p>
                                    <div className="flex w-full items-center justify-between bg-zinc-800 border-zinc-700 border p-3 rounded-lg">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-white font-medium">Google Calendar</span>
                                            <span className="text-xs text-zinc-400">Allow AI to book meetings directly</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-zinc-700 text-zinc-300 hover:bg-white hover:text-black hover:border-white transition-all"
                                            onClick={() => window.location.href = "/api/auth/google"}
                                        >
                                            Connect Calendar
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                >
                                    {isSaving ? (
                                        <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Saving...</>
                                    ) : (
                                        <>Save Persistent Persona</>
                                    )}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.location.href = "/dashboard/sandbox"}
                                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs"
                                >
                                    <Zap className="h-3 w-3 mr-1" /> Test in Sandbox
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
