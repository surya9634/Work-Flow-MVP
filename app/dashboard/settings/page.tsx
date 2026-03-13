"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Globe, Calendar, Check, Save, MessageCircle, Loader2, Hash, KeyRound, AlertCircle, CheckCircle2 } from "lucide-react"
import { WhatsAppPlayground } from "@/components/whatsapp-playground"

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [initialConfig, setInitialConfig] = useState({
        phoneNumberId: "",
        wabaId: "",
        accessToken: "",
    })

    useEffect(() => {
        fetch("/api/settings")
            .then((res) => res.json())
            .then((data) => {
                if (data.whatsappConfig) {
                    setInitialConfig({
                        phoneNumberId: data.whatsappConfig.phoneNumberId || "",
                        wabaId: data.whatsappConfig.wabaId || "",
                        accessToken: data.whatsappConfig.accessToken || "",
                    })
                }
                setLoading(false)
            })
            .catch((err) => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    if (loading) {
        return <div className="text-white">Loading settings...</div>
    }

    return (
        <div className="space-y-8 w-full pr-4 pb-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Settings</h2>
                <p className="text-zinc-500 mt-1">Configure your AI agent and account preferences</p>
            </div>

            {/* Settings Spacer */}
            <div className="h-2"></div>

            {/* WhatsApp Integration (Moved from old page) */}
            {/* WhatsApp Integration (Moved from old page) */}
            <div className="w-full">
               <WhatsAppPlayground 
                  initialPhoneNumberId={initialConfig.phoneNumberId}
                  initialWabaId={initialConfig.wabaId}
                  initialAccessToken={initialConfig.accessToken}
               />
            </div>

        </div>
    )
}
