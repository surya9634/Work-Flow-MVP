"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle2, Loader2, Save, MessageSquare, Key, Hash, Phone, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface WhatsAppPlaygroundProps {
    initialPhoneNumberId?: string
    initialWabaId?: string
    initialAccessToken?: string
}

export function WhatsAppPlayground({
    initialPhoneNumberId = "",
    initialWabaId = "",
    initialAccessToken = "",
}: WhatsAppPlaygroundProps) {
    const [phoneNumberId, setPhoneNumberId] = useState(initialPhoneNumberId)
    const [wabaId, setWabaId] = useState(initialWabaId)
    const [accessToken, setAccessToken] = useState(initialAccessToken)
    const [saved, setSaved] = useState(false)
    const [saving, setSaving] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")

    const handleSave = async () => {
        if (!phoneNumberId || !accessToken) {
            setErrorMsg("Phone Number ID and Access Token are required.")
            return
        }

        setSaving(true)
        setErrorMsg("")

        try {
            const res = await fetch("/api/whatsapp/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accessToken, wabaId, phoneNumberId }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to save credentials.")
            }

            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err: any) {
            setErrorMsg(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-5 h-5 text-[#25D366]" />
                        <h3 className="text-lg font-semibold text-white">WhatsApp Integration</h3>
                    </div>
                    <p className="text-sm text-zinc-400">
                        Enter your Meta Developer credentials to connect your WhatsApp Business account.
                    </p>
                </div>
                <a
                    href="https://developers.facebook.com/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 mt-1"
                >
                    Meta Developer Console
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>

            {/* Credential Fields */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
                {/* Phone Number ID */}
                <div className="space-y-2">
                    <Label className="text-zinc-300 text-sm flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-zinc-500" />
                        Phone Number ID
                    </Label>
                    <Input
                        id="whatsapp-phone-number-id"
                        value={phoneNumberId}
                        onChange={(e) => setPhoneNumberId(e.target.value)}
                        placeholder="e.g. 123456789012345"
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-[#25D366] focus:ring-[#25D366]/20 h-10 font-mono text-sm"
                    />
                    <p className="text-xs text-zinc-600">
                        Found in Meta Developer Console → Your App → WhatsApp → API Setup
                    </p>
                </div>

                {/* WABA ID */}
                <div className="space-y-2">
                    <Label className="text-zinc-300 text-sm flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5 text-zinc-500" />
                        WhatsApp Business Account ID <span className="text-zinc-600 text-xs">(optional)</span>
                    </Label>
                    <Input
                        id="whatsapp-waba-id"
                        value={wabaId}
                        onChange={(e) => setWabaId(e.target.value)}
                        placeholder="e.g. 987654321098765"
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-[#25D366] focus:ring-[#25D366]/20 h-10 font-mono text-sm"
                    />
                    <p className="text-xs text-zinc-600">
                        Found in Meta Business Suite → Settings → Business Info
                    </p>
                </div>

                {/* Access Token */}
                <div className="space-y-2">
                    <Label className="text-zinc-300 text-sm flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-zinc-500" />
                        Permanent Access Token
                    </Label>
                    <Input
                        id="whatsapp-access-token"
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="EAAMx..."
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-[#25D366] focus:ring-[#25D366]/20 h-10 font-mono text-sm"
                    />
                    <p className="text-xs text-zinc-600">
                        Generate in Meta Developer Console → Your App → WhatsApp → API Setup → Generate Permanent Token
                    </p>
                </div>
            </div>

            {/* Status + Save Button */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    {errorMsg && (
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}
                    {saved && (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>Credentials saved successfully!</span>
                        </div>
                    )}
                </div>

                <Button
                    id="whatsapp-save-btn"
                    onClick={handleSave}
                    disabled={saving || !phoneNumberId || !accessToken}
                    className="bg-[#25D366] hover:bg-[#20bd5a] text-black font-semibold h-10 px-6 shrink-0"
                >
                    {saving ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                    ) : saved ? (
                        <><CheckCircle2 className="w-4 h-4 mr-2" /> Saved</>
                    ) : (
                        <><Save className="w-4 h-4 mr-2" /> Save & Connect</>
                    )}
                </Button>
            </div>
        </div>
    )
}
