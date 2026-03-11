"use client";

import { useState } from "react";
import { MessageCircle, CheckCircle2, AlertCircle, Loader2, KeyRound, Hash, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WhatsAppDashboardPage() {
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const [formData, setFormData] = useState({
        phoneNumberId: "",
        wabaId: "",
        accessToken: "",
    });

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

    return (
        <div className="p-8 md:p-12 xl:p-16 max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-3 relative z-20">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#25D366]/20 to-[#128C7E]/10 border border-[#25D366]/30 flex items-center justify-center shadow-[0_0_30px_rgba(37,211,102,0.15)] ring-1 ring-white/5">
                        <MessageCircle className="w-7 h-7 text-[#25D366]" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
                        WhatsApp API
                    </h1>
                </div>
                <p className="text-muted-foreground text-lg ml-[4.5rem] max-w-2xl leading-relaxed">
                    Connect your WhatsApp Business account via manual API configuration. Your AI agent will instantly take over and reply to inbound customer messages.
                </p>
            </div>

            <div className="border border-white/10 rounded-3xl bg-card/10 backdrop-blur-2xl text-card-foreground shadow-2xl relative group overflow-hidden">
                {/* Glowing orb background effects */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#25D366]/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3 transition-all duration-1000 group-hover:bg-[#25D366]/15 group-hover:blur-[140px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/3" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

                <div className="p-10 md:p-12 lg:p-16 flex flex-col lg:flex-row gap-16 lg:gap-24 items-start relative z-10 w-full">

                    {/* Left Info Section */}
                    <div className="flex-1 space-y-8 min-w-0 w-full">
                        <div className="space-y-3">
                            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Manual Configuration</h2>
                            <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                                Paste your API credentials directly from the Meta Developer Dashboard.
                                This bypasses the Facebook Popup and immediately authenticates your backend to send/receive messages on behalf of your WhatsApp number.
                            </p>
                        </div>

                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 lg:p-8 backdrop-blur-md shadow-inner max-w-lg transition-colors hover:bg-white/[0.04]">
                            <ul className="space-y-6">
                                <li className="flex items-start gap-4 text-foreground group/item">
                                    <div className="min-w-8 min-h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mt-0.5 transition-colors group-hover/item:bg-green-500/20 group-hover/item:border-green-500/40 shadow-[0_0_15px_rgba(37,211,102,0.1)]">
                                        <Hash className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium text-[15px] leading-none">Phone Number ID</p>
                                        <p className="text-muted-foreground text-sm">Found in WhatsApp &gt; API Setup in your Meta App.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4 text-foreground group/item">
                                    <div className="min-w-8 min-h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mt-0.5 transition-colors group-hover/item:bg-blue-500/20 group-hover/item:border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                        <KeyRound className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium text-[15px] leading-none">System User Access Token</p>
                                        <p className="text-muted-foreground text-sm">A permanent token with whatsapp_business_messaging permissions.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Login Action Card */}
                    <div className="w-full lg:w-[480px] shrink-0 flex flex-col gap-4">
                        {connectionStatus === "success" ? (
                            <div className="p-10 border border-green-500/30 bg-green-500/10 backdrop-blur-xl rounded-3xl text-center space-y-5 shadow-[0_0_50px_rgba(37,211,102,0.15)] relative overflow-hidden animate-in zoom-in-95 duration-500 mt-4">
                                <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent pointer-events-none" />
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-green-500/10 shadow-[0_0_30px_rgba(37,211,102,0.3)]">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-3xl font-semibold text-green-500 tracking-tight">Credentials Saved!</p>
                                    <p className="text-sm text-green-500/80 max-w-[280px] mx-auto leading-relaxed">Your AI agent is successfully linked and officially listening to inbound WhatsApp messages.</p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="mt-6 border-green-500/30 hover:bg-green-500/20 text-green-400"
                                    onClick={() => setConnectionStatus("idle")}
                                >
                                    Update Credentials
                                </Button>
                            </div>
                        ) : (
                            <div className="p-8 md:p-10 border border-white/10 bg-black/60 backdrop-blur-2xl rounded-3xl space-y-8 shadow-2xl relative overflow-hidden group/card shadow-black/60 ring-1 ring-white/5 transition-all hover:bg-black/70">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />

                                <div className="space-y-3 relative z-10 text-center mb-8">
                                    <div className="w-16 h-16 bg-[#25D366]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#25D366]/20 shadow-[0_0_25px_rgba(37,211,102,0.15)] transition-transform group-hover/card:scale-105 duration-500">
                                        <MessageCircle className="w-8 h-8 text-[#25D366]" />
                                    </div>
                                    <p className="text-2xl font-semibold tracking-tight text-white">API Connection</p>
                                    <p className="text-sm text-white/50">Save your Meta credentials securely</p>
                                </div>

                                <div className="space-y-5 relative z-10">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-white/60 ml-1 uppercase tracking-wider">Phone Number ID</label>
                                        <input
                                            type="text"
                                            value={formData.phoneNumberId}
                                            onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                                            placeholder="101234567890123"
                                            className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-white/60 ml-1 uppercase tracking-wider">WABA ID (Optional)</label>
                                        <input
                                            type="text"
                                            value={formData.wabaId}
                                            onChange={(e) => setFormData({ ...formData, wabaId: e.target.value })}
                                            placeholder="109876543210987"
                                            className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-white/60 ml-1 uppercase tracking-wider">Permanent Access Token</label>
                                        <input
                                            type="password"
                                            value={formData.accessToken}
                                            onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                                            placeholder="EAAMX..."
                                            className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-transparent transition-all font-mono text-sm"
                                        />
                                    </div>

                                    <Button
                                        onClick={handleConnectClick}
                                        disabled={isConnecting}
                                        className="w-full h-14 mt-4 text-base font-medium bg-[#25D366] hover:bg-[#20bd5a] text-black rounded-xl shadow-[0_0_20px_rgba(37,211,102,0.2)] transition-all hover:shadow-[0_0_30px_rgba(37,211,102,0.4)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
                                    >
                                        {isConnecting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5 mr-2" />
                                                Save & Connect
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-[12px] text-white/40 w-full text-center tracking-wide font-medium uppercase mt-2">AES-256 Encrypted Storage</p>
                                </div>

                                {connectionStatus === "error" && (
                                    <div className="flex items-start gap-3 text-red-500 text-sm text-left bg-red-500/10 border border-red-500/20 p-4 rounded-xl relative z-10 animate-in slide-in-from-bottom-2 fade-in zoom-in-95 duration-300 mt-6">
                                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                        <span className="leading-snug">{errorMessage}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
