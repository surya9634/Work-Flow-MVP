"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bot, Save, Globe, Calendar, Check } from "lucide-react"

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saved, setSaved] = useState(false)
    const [agentConfig, setAgentConfig] = useState({
        name: "Alex",
        voice: "professional_male",
        language: "en",
        greeting: "Hi, this is Alex from {company}. I'm reaching out because...",
        objective: "Book a 15-minute demo call",
        tone: "friendly",
    })

    useEffect(() => {
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
            .catch((err) => {
                console.error(err)
                setLoading(false)
            })
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
        return <div className="text-white">Loading settings...</div>
    }

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Settings</h2>
                <p className="text-zinc-500 mt-1">Configure your AI agent and account preferences</p>
            </div>

            {/* Agent Configuration */}
            <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Agent Persona</h3>
                        <p className="text-xs text-zinc-500">How your AI agent sounds and behaves on calls</p>
                    </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Agent Name</Label>
                        <Input
                            value={agentConfig.name}
                            onChange={(e) => setAgentConfig({ ...agentConfig, name: e.target.value })}
                            className="bg-zinc-800 border-zinc-700 text-white focus:border-purple-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Voice</Label>
                        <Select
                            value={agentConfig.voice}
                            onValueChange={(val) => setAgentConfig({ ...agentConfig, voice: val })}
                        >
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800">
                                <SelectItem value="professional_male">Professional Male</SelectItem>
                                <SelectItem value="professional_female">Professional Female</SelectItem>
                                <SelectItem value="friendly_male">Friendly Male</SelectItem>
                                <SelectItem value="friendly_female">Friendly Female</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Language</Label>
                        <Select
                            value={agentConfig.language}
                            onValueChange={(val) => setAgentConfig({ ...agentConfig, language: val })}
                        >
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800">
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Spanish</SelectItem>
                                <SelectItem value="fr">French</SelectItem>
                                <SelectItem value="de">German</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Tone</Label>
                        <Select
                            value={agentConfig.tone}
                            onValueChange={(val) => setAgentConfig({ ...agentConfig, tone: val })}
                        >
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800">
                                <SelectItem value="friendly">Friendly</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="casual">Casual</SelectItem>
                                <SelectItem value="assertive">Assertive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label className="text-zinc-300">Opening Script</Label>
                        <textarea
                            value={agentConfig.greeting}
                            onChange={(e) => setAgentConfig({ ...agentConfig, greeting: e.target.value })}
                            rows={3}
                            className="flex w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                            placeholder="Hi, this is {agent_name} from {company}..."
                        />
                        <p className="text-xs text-zinc-600">
                            Use {"{company}"}, {"{agent_name}"}, {"{lead_name}"} as dynamic variables.
                        </p>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label className="text-zinc-300">Call Objective</Label>
                        <Input
                            value={agentConfig.objective}
                            onChange={(e) => setAgentConfig({ ...agentConfig, objective: e.target.value })}
                            className="bg-zinc-800 border-zinc-700 text-white focus:border-purple-500"
                            placeholder="Book a 15-minute demo call"
                        />
                    </div>
                </div>
            </div>

            {/* Integrations */}
            <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Integrations</h3>
                        <p className="text-xs text-zinc-500">Connect external services</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-blue-400" />
                            <div>
                                <p className="text-sm font-medium text-white">Google Calendar</p>
                                <p className="text-xs text-zinc-500">Auto-book meetings from calls</p>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                            <Check className="mr-1.5 h-3 w-3" /> Connected
                        </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                        <div className="flex items-center gap-3">
                            <Globe className="h-5 w-5 text-zinc-400" />
                            <div>
                                <p className="text-sm font-medium text-white">CRM Webhook</p>
                                <p className="text-xs text-zinc-500">Push lead updates to your CRM</p>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-400 hover:bg-zinc-800">
                            Connect
                        </Button>
                    </div>
                </div>
            </div>


            {/* Save Button */}
            <div className="flex justify-end pb-8">
                <Button
                    onClick={handleSave}
                    className="bg-purple-600 hover:bg-purple-700 text-white min-w-[140px]"
                >
                    {saved ? (
                        <>
                            <Check className="mr-2 h-4 w-4" /> Saved
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" /> Save Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
