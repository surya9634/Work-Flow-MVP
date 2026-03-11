"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Upload, Phone, Search, Loader2, Zap, Trash2, Edit2 } from "lucide-react"

type Lead = {
    id: string
    name: string
    phone: string
    status: "NEW" | "CALLING" | "INTERESTED" | "NOT_INTERESTED" | "BOOKED" | "NO_ANSWER"
    lastCall: string | null
    createdAt: string
    campaignId?: string | null
}

const statusConfig: Record<string, { label: string; class: string }> = {
    NEW: { label: "New", class: "bg-zinc-800 text-zinc-300 border-zinc-700" },
    CALLING: { label: "Calling", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    INTERESTED: { label: "Interested", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    NOT_INTERESTED: { label: "Not Interested", class: "bg-red-500/10 text-red-400 border-red-500/20" },
    BOOKED: { label: "Booked", class: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    NO_ANSWER: { label: "No Answer", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newLead, setNewLead] = useState({ name: "", phone: "", campaignId: "" })
    const [editingLead, setEditingLead] = useState<Lead & { campaignId?: string | null } | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchLeads()
        fetchCampaigns()
    }, [])

    const fetchCampaigns = async () => {
        try {
            const res = await fetch("/api/campaigns")
            if (res.ok) {
                const data = await res.json()
                setCampaigns(data.campaigns || [])
            }
        } catch (error) {
            console.error("Failed to fetch campaigns", error)
        }
    }

    const fetchLeads = async () => {
        try {
            const res = await fetch("/api/leads")
            if (res.ok) {
                const data = await res.json()
                setLeads(data.leads || [])
            }
        } catch (error) {
            console.error("Failed to fetch leads", error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredLeads = leads.filter(
        (lead) =>
            lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.phone.includes(searchQuery)
    )

    const handleAddLead = async () => {
        if (!newLead.name || !newLead.phone) return
        setIsSubmitting(true)

        try {
            const res = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newLead),
            })

            if (res.ok) {
                await fetchLeads() // Refresh list
                setIsAddOpen(false)
                setNewLead({ name: "", phone: "", campaignId: "" })
            }
        } catch (error) {
            console.error("Failed to create lead", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditLead = async () => {
        if (!editingLead || !editingLead.name || !editingLead.phone) return
        setIsSubmitting(true)

        try {
            const res = await fetch(`/api/leads/${editingLead.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editingLead.name,
                    phone: editingLead.phone,
                    campaignId: editingLead.campaignId || null
                }),
            })

            if (res.ok) {
                await fetchLeads() // Refresh list
                setIsEditOpen(false)
                setEditingLead(null)
            }
        } catch (error) {
            console.error("Failed to edit lead", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const statusCounts = leads.reduce(
        (acc, lead) => {
            const status = lead.status || "NEW"
            acc[status] = (acc[status] || 0) + 1
            return acc
        },
        {} as Record<string, number>
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Leads</h2>
                    <p className="text-zinc-500 mt-1">{leads.length} total leads in pipeline</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Import CSV
                    </Button>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Lead
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                            <DialogHeader>
                                <DialogTitle className="text-white">Add New Lead</DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                    Enter lead details. An AI call will be triggered automatically.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-zinc-300">
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={newLead.name}
                                        onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                                        placeholder="John Doe"
                                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-zinc-300">
                                        Phone Number
                                    </Label>
                                    <Input
                                        id="phone"
                                        value={newLead.phone}
                                        onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                                        placeholder="+1 (555) 000-0000"
                                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="campaign" className="text-zinc-300">
                                        Assign to Campaign (Optional)
                                    </Label>
                                    <select
                                        id="campaign"
                                        className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        value={newLead.campaignId}
                                        onChange={(e) => setNewLead({ ...newLead, campaignId: e.target.value })}
                                    >
                                        <option value="">No Campaign (Add to pool)</option>
                                        {campaigns.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsAddOpen(false)}
                                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddLead}
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Phone className="mr-2 h-4 w-4" /> Save & Call
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Lead Dialog (Hidden unless editingLead is set) */}
                    <Dialog open={isEditOpen} onOpenChange={(open) => {
                        setIsEditOpen(open)
                        if (!open) setEditingLead(null)
                    }}>
                        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                            <DialogHeader>
                                <DialogTitle className="text-white">Edit Lead</DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                    Update details for this lead.
                                </DialogDescription>
                            </DialogHeader>
                            {editingLead && (
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-name" className="text-zinc-300">Name</Label>
                                        <Input
                                            id="edit-name"
                                            value={editingLead.name}
                                            onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                                            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-phone" className="text-zinc-300">Phone Number</Label>
                                        <Input
                                            id="edit-phone"
                                            value={editingLead.phone}
                                            onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                                            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-campaign" className="text-zinc-300">Assign to Campaign (Optional)</Label>
                                        <select
                                            id="edit-campaign"
                                            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            value={editingLead.campaignId || ""}
                                            onChange={(e) => setEditingLead({ ...editingLead, campaignId: e.target.value })}
                                        >
                                            <option value="">No Campaign (Add to pool)</option>
                                            {campaigns.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditOpen(false)
                                        setEditingLead(null)
                                    }}
                                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleEditLead}
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Status badges row */}
            <div className="flex flex-wrap gap-2">
                {Object.entries(statusConfig).map(([key, config]) => {
                    const count = statusCounts[key] || 0
                    if (count === 0) return null
                    return (
                        <span
                            key={key}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.class}`}
                        >
                            {config.label}
                            <span className="opacity-60">{count}</span>
                        </span>
                    )
                })}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                    placeholder="Search leads by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-purple-500"
                />
            </div>

            {/* Table */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-zinc-800 hover:bg-transparent">
                            <TableHead className="text-zinc-400 font-medium">Name</TableHead>
                            <TableHead className="text-zinc-400 font-medium">Phone</TableHead>
                            <TableHead className="text-zinc-400 font-medium">Status</TableHead>
                            <TableHead className="text-zinc-400 font-medium">Last Call</TableHead>
                            <TableHead className="text-zinc-400 font-medium w-10"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-zinc-500">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                    Loading leads...
                                </TableCell>
                            </TableRow>
                        ) : filteredLeads.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-zinc-500">
                                    {searchQuery ? "No leads match your search." : "No leads yet. Add your first lead to get started."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLeads.map((lead) => {
                                const status = statusConfig[lead.status || "NEW"] || statusConfig["NEW"]
                                return (
                                    <TableRow
                                        key={lead.id}
                                        className="border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                                    >
                                        <TableCell className="font-medium text-white">{lead.name}</TableCell>
                                        <TableCell className="text-zinc-400 font-mono text-sm">{lead.phone}</TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.class}`}
                                            >
                                                {lead.status === "CALLING" && (
                                                    <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                                                )}
                                                {status.label}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-zinc-500 text-sm">
                                            {lead.lastCall ? new Date(lead.lastCall).toLocaleDateString() : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={!lead.lastCall}
                                                    onClick={async () => {
                                                        const res = await fetch("/api/leads/qualify", {
                                                            method: "POST",
                                                            body: JSON.stringify({ leadId: lead.id }),
                                                        })
                                                        if (res.ok) fetchLeads()
                                                    }}
                                                    className="h-8 px-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border border-purple-500/20"
                                                >
                                                    <Zap className="mr-1 h-3 w-3" />
                                                    Qualify
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setEditingLead(lead)
                                                        setIsEditOpen(true)
                                                    }}
                                                    title="Edit Lead"
                                                    className="h-8 px-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 ml-1"
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={async () => {
                                                        if (!confirm('Are you sure you want to delete this lead?')) return;
                                                        const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" })
                                                        if (res.ok) fetchLeads()
                                                    }}
                                                    className="h-8 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 ml-2"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
