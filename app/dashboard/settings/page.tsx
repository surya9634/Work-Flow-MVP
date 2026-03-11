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
            <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-4 sm:p-6 overflow-hidden w-full overflow-x-hidden">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#25D366]/20 to-[#128C7E]/10 border border-[#25D366]/30 flex items-center justify-center shrink-0">
                        <MessageCircle className="h-5 w-5 text-[#25D366]" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">WhatsApp API Connection</h3>
                        <p className="text-xs text-zinc-500">Connect your Meta Developer app to send & receive messages.</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start w-full">
                    {/* Left Info */}
                    <div className="w-full md:w-[45%] space-y-6">
                        <ul className="space-y-5">
                            <li className="flex items-start gap-4">
                                <div className="min-w-8 min-h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mt-0.5">
                                    <Hash className="w-4 h-4 text-green-500" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-[14px] text-white leading-none">Phone Number ID</p>
                                    <p className="text-zinc-500 text-sm">Found in WhatsApp &gt; API Setup.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="min-w-8 min-h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mt-0.5">
                                    <KeyRound className="w-4 h-4 text-blue-500" />
                                </div>
                                <div className="space-y-1 w-full">
                                    <p className="font-medium text-[14px] text-white leading-none">System User Access Token</p>
                                    <p className="text-zinc-500 text-xs mt-1 w-full">A permanent token with <code className="bg-zinc-800 px-1 rounded break-all">whatsapp_business_messaging</code> permissions.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Right Form (With Mobile overflow fixes: min-w-0, w-full, break-words) */}
                    <div className="w-full md:w-[55%] shrink-0 flex flex-col gap-4 min-w-0">
                        {connectionStatus === "success" ? (
                            <div className="p-4 sm:p-6 border border-green-500/30 bg-green-500/10 rounded-xl text-center space-y-4 w-full">
                                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-xl font-semibold text-green-500">Credentials Saved!</p>
                                    <p className="text-sm text-green-500/80 mt-1">Your AI is listening to inbound messages.</p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="border-green-500/30 hover:bg-green-500/20 text-green-400 mt-2"
                                    onClick={() => setConnectionStatus("idle")}
                                >
                                    Update Credentials
                                </Button>
                            </div>
                        ) : (
                            <div className="p-4 sm:p-6 border border-zinc-800 bg-black/40 rounded-xl space-y-4 w-full">
                                <div className="space-y-1.5 w-full">
                                    <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">Phone Number ID</label>
                                    <input
                                        type="text"
                                        value={formData.phoneNumberId}
                                        onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                                        placeholder="101234567890123"
                                        className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#25D366]/50 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5 w-full">
                                    <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">WABA ID (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.wabaId}
                                        onChange={(e) => setFormData({ ...formData, wabaId: e.target.value })}
                                        placeholder="109876543210987"
                                        className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#25D366]/50 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5 w-full">
                                    <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">Permanent Access Token</label>
                                    <input
                                        type="password"
                                        value={formData.accessToken}
                                        onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                                        placeholder="EAAMX..."
                                        className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#25D366]/50 font-mono text-sm"
                                    />
                                </div>

                                <Button
                                    onClick={handleConnectClick}
                                    disabled={isConnecting}
                                    className="w-full h-10 mt-2 text-sm font-medium bg-[#25D366] hover:bg-[#20bd5a] text-black rounded-lg transition-all"
                                >
                                    {isConnecting ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                                    ) : (
                                        <><Save className="w-4 h-4 mr-2" /> Save Credentials</>
                                    )}
                                </Button>
                                
                                {connectionStatus === "error" && (
                                    <div className="flex items-start gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-3 rounded-lg mt-4 w-full break-words">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span className="leading-relaxed flex-1">{errorMessage}</span>
                                    </div>
                                )}
                            </div>
                        )}
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
