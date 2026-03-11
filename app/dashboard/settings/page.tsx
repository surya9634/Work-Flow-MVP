"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Globe, Calendar, Check, Save, MessageCircle, Loader2, Hash, KeyRound, AlertCircle, CheckCircle2 } from "lucide-react"

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saved, setSaved] = useState(false)
    const [agentConfig, setAgentConfig] = useState<any>({})
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [formData, setFormData] = useState({
        phoneNumberId: "",
        wabaId: "",
        accessToken: "",
    });

    useEffect(() => {
        fetch("/api/settings")
            .then((res) => res.json())
            .then((data) => {
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

    const handleConnectClick = async () => {
        if (!formData.phoneNumberId || !formData.accessToken) {
            setErrorMessage("Phone Number ID and Access Token are required.");
            setConnectionStatus("error");
            return;
        }

        setIsConnecting(true);
        setConnectionStatus("idle");

        try {
            const res = await fetch("/api/whatsapp/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accessToken: formData.accessToken,
                    wabaId: formData.wabaId || "manual_waba_" + Math.floor(Math.random() * 10000000),
                    phoneNumberId: formData.phoneNumberId
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to link WhatsApp account.");
            }

            setConnectionStatus("success");
            setFormData({ phoneNumberId: "", wabaId: "", accessToken: "" });
        } catch (err: any) {
            setErrorMessage(err.message);
            setConnectionStatus("error");
        } finally {
            setIsConnecting(false);
        }
    };

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

            {/* Settings Spacer */}
            <div className="h-2"></div>

            {/* WhatsApp Integration (Moved from old page) */}
            <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-[#25D366]" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">WhatsApp Config</h3>
                        <p className="text-xs text-zinc-500">Connect your Meta Developer app credentials.</p>
                    </div>
                </div>

                {connectionStatus === "success" ? (
                    <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-green-500/20">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                            <div>
                                <p className="text-sm font-medium text-white">WhatsApp Connected</p>
                                <p className="text-xs text-zinc-500">Your AI is actively listening to messages.</p>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-400 hover:bg-zinc-800" onClick={() => setConnectionStatus("idle")}>
                            Edit Credentials
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Phone Number ID</Label>
                            <Input
                                value={formData.phoneNumberId}
                                onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                                className="bg-zinc-800 border-zinc-700 text-white focus:border-[#25D366]/50"
                                placeholder="101234567890123"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">WABA ID (Optional)</Label>
                            <Input
                                value={formData.wabaId}
                                onChange={(e) => setFormData({ ...formData, wabaId: e.target.value })}
                                className="bg-zinc-800 border-zinc-700 text-white focus:border-[#25D366]/50"
                                placeholder="109876543210987"
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label className="text-zinc-300">Permanent Access Token</Label>
                            <Input
                                type="password"
                                value={formData.accessToken}
                                onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                                className="bg-zinc-800 border-zinc-700 text-white focus:border-[#25D366]/50 font-mono text-sm"
                                placeholder="EAAMX..."
                            />
                            <p className="text-xs text-zinc-600 mt-1">Requires <code className="bg-zinc-800 px-1 rounded break-all">whatsapp_business_messaging</code> permissions.</p>
                        </div>
                        <div className="sm:col-span-2 flex flex-col items-end gap-3 pt-2">
                             {connectionStatus === "error" && (
                                <div className="flex items-start gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-3 rounded-lg w-full break-words">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span className="leading-relaxed flex-1">{errorMessage}</span>
                                </div>
                            )}
                            <Button
                                onClick={handleConnectClick}
                                disabled={isConnecting}
                                className="bg-[#25D366] hover:bg-[#20bd5a] text-black w-full sm:w-auto"
                            >
                                {isConnecting ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="w-4 h-4 mr-2" /> Connect WhatsApp</>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
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
