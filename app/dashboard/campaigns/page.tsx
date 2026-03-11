"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Plus, Zap, Play, Pause, RotateCcw, Users, Phone, BarChart3, Loader2, CheckCircle2, Clock, XCircle, Trash2, RefreshCw, MessageCircle, Edit2 } from "lucide-react"

type Campaign = {
    id: string
    name: string
    type: string
    status: string
    objective: string | null
    aiPersonality: string | null
    createdAt: string
    _count: { leads: number }
}

const statusConfig: Record<string, { label: string; class: string; icon: React.FC<{ className?: string }> }> = {
    DRAFT: { label: "Draft", class: "bg-zinc-800 text-zinc-400 border-zinc-700", icon: Clock },
    ACTIVE: { label: "Active", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
    PAUSED: { label: "Paused", class: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Pause },
    COMPLETED: { label: "Completed", class: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: CheckCircle2 },
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [newCampaign, setNewCampaign] = useState({
        name: "",
        type: "VOICE",
        objective: "",
        aiPersonality: "professional",
    })
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)

    useEffect(() => {
        fetchCampaigns()
    }, [])

    const fetchCampaigns = async () => {
        try {
            const res = await fetch("/api/campaigns")
            if (res.ok) {
                const data = await res.json()
                setCampaigns(data.campaigns || [])
            }
        } catch (err) {
            console.error("Failed to fetch campaigns", err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!newCampaign.name) return
        setIsSubmitting(true)
        try {
            const res = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCampaign),
            })
            if (res.ok) {
                await fetchCampaigns()
                setIsCreateOpen(false)
                setNewCampaign({ name: "", type: "OUTBOUND", objective: "", aiPersonality: "professional" })
            }
        } catch (err) {
            console.error("Failed to create campaign", err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = async () => {
        if (!editingCampaign || !editingCampaign.name) return
        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/campaigns/${editingCampaign.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editingCampaign.name,
                    type: editingCampaign.type,
                    objective: editingCampaign.objective,
                    aiPersonality: editingCampaign.aiPersonality,
                }),
            })
            if (res.ok) {
                await fetchCampaigns()
                setIsEditOpen(false)
                setEditingCampaign(null)
            }
        } catch (err) {
            console.error("Failed to edit campaign", err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAction = async (id: string, action: "activate" | "pause" | "resume" | "reset" | "delete") => {
        setActionLoading(id + action)
        try {
            const method = action === "delete" ? "DELETE" : "POST"
            const url = action === "delete" ? `/api/campaigns/${id}` : `/api/campaigns/${id}/${action}`
            const res = await fetch(url, { method })
            if (res.ok) await fetchCampaigns()
        } catch (err) {
            console.error(`Failed to ${action}`, err)
        } finally {
            setActionLoading(null)
        }
    }

    const stats = {
        total: campaigns.length,
        active: campaigns.filter((c) => c.status === "ACTIVE").length,
        totalLeads: campaigns.reduce((s, c) => s + c._count.leads, 0),
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Campaigns</h2>
                    <p className="text-zinc-500 mt-1">Manage your outbound AI calling campaigns</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            New Campaign
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-white">Create Campaign</DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                Launch an AI outbound calling campaign for your leads.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Campaign Name</Label>
                                <Input
                                    value={newCampaign.name}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                    placeholder="e.g. February Outreach Q1"
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Channel</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setNewCampaign({ ...newCampaign, type: "VOICE" })}
                                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${newCampaign.type === "VOICE"
                                            ? "bg-purple-600 border-purple-500 text-white"
                                            : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                            }`}
                                    >
                                        <Phone className="w-4 h-4" /> Voice
                                    </button>
                                    <button
                                        onClick={() => setNewCampaign({ ...newCampaign, type: "WHATSAPP" })}
                                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${newCampaign.type === "WHATSAPP"
                                            ? "bg-emerald-600 border-emerald-500 text-white"
                                            : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                            }`}
                                    >
                                        <MessageCircle className="w-4 h-4" /> Text
                                    </button>
                                    <button
                                        onClick={() => setNewCampaign({ ...newCampaign, type: "BOTH" })}
                                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${newCampaign.type === "BOTH"
                                            ? "bg-blue-600 border-blue-500 text-white"
                                            : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                            }`}
                                    >
                                        <Zap className="w-4 h-4" /> Both
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Objective</Label>
                                <Input
                                    value={newCampaign.objective}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, objective: e.target.value })}
                                    placeholder="e.g. Book a 15-min demo call"
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">AI Personality</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["professional", "friendly", "assertive", "casual"].map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setNewCampaign({ ...newCampaign, aiPersonality: p })}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${newCampaign.aiPersonality === p
                                                ? "bg-purple-600 border-purple-500 text-white"
                                                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreate}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                disabled={isSubmitting || !newCampaign.name}
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                                ) : (
                                    <><Zap className="mr-2 h-4 w-4" /> Create Campaign</>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Campaign Dialog (Hidden unless editingCampaign is set) */}
                <Dialog open={isEditOpen} onOpenChange={(open) => {
                    setIsEditOpen(open)
                    if (!open) setEditingCampaign(null)
                }}>
                    <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-white">Edit Campaign</DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                Update the configuration of this campaign.
                            </DialogDescription>
                        </DialogHeader>
                        {editingCampaign && (
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Campaign Name</Label>
                                    <Input
                                        value={editingCampaign.name}
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, name: e.target.value })}
                                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Channel</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(["VOICE", "WHATSAPP", "BOTH"] as const).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setEditingCampaign({ ...editingCampaign, type })}
                                                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${editingCampaign.type === type
                                                    ? (type === "VOICE" ? "bg-purple-600 border-purple-500 text-white" : type === "WHATSAPP" ? "bg-emerald-600 border-emerald-500 text-white" : "bg-blue-600 border-blue-500 text-white")
                                                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                                    }`}
                                            >
                                                {type === "VOICE" && <Phone className="w-4 h-4" />}
                                                {type === "WHATSAPP" && <MessageCircle className="w-4 h-4" />}
                                                {type === "BOTH" && <Zap className="w-4 h-4" />}
                                                <span className="capitalize">{type.toLowerCase()}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Objective</Label>
                                    <Input
                                        value={editingCampaign.objective || ""}
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, objective: e.target.value })}
                                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">AI Personality</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {["professional", "friendly", "assertive", "casual"].map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => setEditingCampaign({ ...editingCampaign, aiPersonality: p })}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${editingCampaign.aiPersonality === p
                                                    ? "bg-purple-600 border-purple-500 text-white"
                                                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditOpen(false)
                                    setEditingCampaign(null)
                                }}
                                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleEdit}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                disabled={isSubmitting || !editingCampaign?.name}
                            >
                                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Campaigns", value: stats.total, icon: Zap, color: "text-purple-400" },
                    { label: "Active Now", value: stats.active, icon: CheckCircle2, color: "text-emerald-400" },
                    { label: "Total Leads", value: stats.totalLeads, icon: Users, color: "text-blue-400" },
                ].map((card) => (
                    <div key={card.label} className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                            <span className="text-xs text-zinc-500">{card.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Campaigns list */}
            {isLoading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
                </div>
            ) : campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                        <Zap className="h-5 w-5 text-zinc-600" />
                    </div>
                    <h3 className="text-sm font-medium text-zinc-300 mb-1">No campaigns yet</h3>
                    <p className="text-xs text-zinc-600 mb-6 max-w-[240px] leading-relaxed">
                        Create your first campaign and import leads to start AI calling at scale.
                    </p>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Campaign
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {campaigns.map((campaign) => {
                        const status = statusConfig[campaign.status] || statusConfig["DRAFT"]
                        const StatusIcon = status.icon
                        return (
                            <div
                                key={campaign.id}
                                className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-5 hover:border-zinc-700 transition-colors"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-white truncate">{campaign.name}</h3>
                                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${status.class}`}>
                                                {campaign.status === "ACTIVE" && (
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                )}
                                                <StatusIcon className="h-3 w-3" />
                                                {status.label}
                                            </span>
                                        </div>
                                        {campaign.objective && (
                                            <p className="text-sm text-zinc-500 truncate mb-3">{campaign.objective}</p>
                                        )}
                                        <div className="flex items-center gap-4 text-xs text-zinc-600">
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {campaign._count.leads} leads
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" />
                                                {campaign.type}
                                            </span>
                                            <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {campaign.status === "DRAFT" && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleAction(campaign.id, "activate")}
                                                disabled={!!actionLoading}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                                            >
                                                {actionLoading === campaign.id + "activate" ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <><Play className="h-3 w-3 mr-1" /> Activate</>
                                                )}
                                            </Button>
                                        )}
                                        {campaign.status === "ACTIVE" && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleAction(campaign.id, "pause")}
                                                disabled={!!actionLoading}
                                                variant="outline"
                                                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 h-8 text-xs"
                                            >
                                                {actionLoading === campaign.id + "pause" ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <><Pause className="h-3 w-3 mr-1" /> Pause</>
                                                )}
                                            </Button>
                                        )}
                                        {campaign.status === "PAUSED" && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleAction(campaign.id, "resume")}
                                                disabled={!!actionLoading}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                                            >
                                                {actionLoading === campaign.id + "resume" ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <><RotateCcw className="h-3 w-3 mr-1" /> Resume</>
                                                )}
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 h-8 text-xs"
                                            onClick={() => window.location.href = `/dashboard/campaigns/${campaign.id}`}
                                        >
                                            <BarChart3 className="h-3 w-3 mr-1" /> Stats
                                        </Button>
                                        {campaign.status !== "DRAFT" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleAction(campaign.id, "reset")}
                                                disabled={!!actionLoading}
                                                className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 text-xs"
                                                title="Reset Campaign back to Draft"
                                            >
                                                {actionLoading === campaign.id + "reset" ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <><RefreshCw className="h-3 w-3" /></>
                                                )}
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setEditingCampaign(campaign)
                                                setIsEditOpen(true)
                                            }}
                                            className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 px-2"
                                            title="Edit Campaign"
                                        >
                                            <Edit2 className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleAction(campaign.id, "delete")}
                                            disabled={!!actionLoading}
                                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 px-2"
                                            title="Delete Campaign"
                                        >
                                            {actionLoading === campaign.id + "delete" ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
