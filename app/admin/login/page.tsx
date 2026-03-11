"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLogin() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Authentication failed");
            }

            // Successfully received the secure admin_session cookie
            // Router will now be allowed to pass the middleware into /admin    
            router.push("/admin");
            router.refresh();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4 selection:bg-purple-500/30">
            {/* Background elements */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

            <div className="w-full max-w-sm relative z-10 animate-in fade-in zoom-in duration-500">
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-purple-900/10">

                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-inner">
                            <Lock className="w-8 h-8 text-zinc-400" />
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white tracking-tight">Super Admin</h1>
                        <p className="text-sm text-zinc-500 mt-2">Restricted highly-secure environment.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Master Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-black/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-purple-500 h-12 text-center text-lg tracking-widest"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isSubmitting || !password}
                            className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-semibold"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                    Authenticating
                                </>
                            ) : (
                                "Unlock Dashboard"
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-xs text-zinc-600 flex items-center justify-center gap-2">
                        <Lock className="w-3 h-3" />
                        <span>Edge Middleware Protected Route</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
