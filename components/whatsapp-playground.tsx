"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APIPlayground } from "@/components/ui/api-playground"
import { APIConfig, APITestResponse } from "@/lib/types"

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
    const [saved, setSaved] = useState(false)
    const [saving, setSaving] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")

    // Map the internal component state back to the configuration format 
    // expected by the database.
    const [phoneNumberId, setPhoneNumberId] = useState(initialPhoneNumberId)
    const [wabaId, setWabaId] = useState(initialWabaId)
    const [accessToken, setAccessToken] = useState(initialAccessToken)

    const [config, setConfig] = useState<APIConfig>({
        url: `https://graph.facebook.com/v17.0/${initialPhoneNumberId || ":phone_number_id"}/messages`,
        method: "POST",
        headers: [
            {
                id: "auth-header",
                key: "Authorization",
                value: `Bearer ${initialAccessToken || "EAAMX..."}`,
            },
            {
                id: "ct-header",
                key: "Content-Type",
                value: "application/json",
            },
        ],
        query: [],
        path: [
            {
                id: "path-1",
                key: "phone_number_id",
                value: initialPhoneNumberId,
            }
        ],
        body: [
            {
                id: "body-1",
                key: "messaging_product",
                value: "whatsapp",
            },
            {
                id: "body-2",
                key: "to",
                value: "+1234567890", // Test recipient phone
            },
            {
                id: "body-3",
                key: "type",
                value: "text",
            },
            {
                id: "body-4",
                key: "text",
                value: JSON.stringify({ body: "Hello from WorkFlow Sandbox!" }),
            },
        ],
    })

    // Sync extraction logic whenever the user edits the API playground setup
    // so we can save their Graph API credentials back to the database
    const handleConfigChange = (newConfig: APIConfig) => {
        setConfig(newConfig)

        // Try extracting Token from Headers
        const authHeader = newConfig.headers.find((h) => h.key.toLowerCase() === "authorization")
        if (authHeader && authHeader.value.startsWith("Bearer ")) {
            setAccessToken(authHeader.value.replace("Bearer ", "").trim())
        }

        // Try extracting Phone Number ID from path parameter
        const phonePath = newConfig.path.find((p) => p.key === "phone_number_id")
        if (phonePath && phonePath.value) {
            setPhoneNumberId(phonePath.value)
        }
    }

    const testGraphApi = async (testConfig: APIConfig): Promise<APITestResponse> => {
        // Prepare Real HTTP Request 
        let url = testConfig.url;
        const queryParams = new URLSearchParams();
        testConfig.query?.forEach((p) => {
            if (p.key && p.value) queryParams.append(p.key, p.value);
        });
        if (queryParams.toString()) url += `?${queryParams.toString()}`;

        const headers: Record<string, string> = {};
        testConfig.headers?.forEach((p) => {
            if (p.key && p.value) headers[p.key] = p.value;
        });

        const bodyData: Record<string, any> = {};
        testConfig.body?.forEach((p) => {
            if (p.key) {
                try {
                    // Automatically un-stringify nested JSON structures like "text": {"body": "msg"}
                    bodyData[p.key] = p.value.startsWith('{') ? JSON.parse(p.value) : p.value;
                } catch {
                    bodyData[p.key] = p.value;
                }
            }
        });

        const response = await fetch(url, {
            method: testConfig.method,
            headers,
            body: JSON.stringify(bodyData),
        });

        return {
            status: response.status,
            data: await response.json(),
        };
    };

    const handleSaveToDatabase = async () => {
        if (!phoneNumberId || !accessToken) {
            setErrorMsg("Missing Phone Number ID or Access Token in the configuration.");
            return;
        }

        setSaving(true)
        setErrorMsg("")

        try {
            const res = await fetch("/api/whatsapp/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accessToken: accessToken,
                    wabaId: wabaId,
                    phoneNumberId: phoneNumberId,
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to link WhatsApp account.")
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
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">Graph API Playground</h3>
                    <p className="text-sm text-zinc-400">Configure your Meta Developer credentials and test message payloads.</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {errorMsg && (
                        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-md">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <Button
                        onClick={handleSaveToDatabase}
                        disabled={saving || !phoneNumberId || !accessToken}
                        className="bg-[#25D366] hover:bg-[#20bd5a] text-black h-9 text-sm font-medium"
                    >
                        {saving ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                        ) : saved ? (
                            <><CheckCircle2 className="w-4 h-4 mr-2" /> Saved</>
                        ) : (
                            <><Save className="w-4 h-4 mr-2" /> Save Credentials</>
                        )}
                    </Button>
                </div>
            </div>

            <div className="h-[600px] border border-zinc-800 rounded-lg overflow-hidden shrink-0">
                <APIPlayground
                    config={config}
                    onConfigChange={handleConfigChange}
                    onTest={testGraphApi}
                />
            </div>
            
            <p className="text-xs text-zinc-500 mt-2">
                This sandbox tests live outbound API calls through Meta to the <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">to</code> phone number parameter. Standard messaging rates apply.
            </p>
        </div>
    )
}
