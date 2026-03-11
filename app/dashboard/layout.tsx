"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Settings, LogOut, Bot, Menu, X, Zap, Headphones, Plus, BarChart3, ChevronRight, Sparkles, FlaskConical, MessageSquareText, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut, useSession } from "next-auth/react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const { data: session } = useSession()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const navItems = [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { name: "Onboarding", href: "/onboarding", icon: MessageSquareText },
        { name: "AI Agents", href: "/dashboard/agents", icon: Bot },
        { name: "Campaigns", href: "/dashboard/campaigns", icon: Zap },
        { name: "Live Monitoring", href: "/dashboard/monitoring", icon: Headphones },
        { name: "Activity & Logs", href: "/dashboard/activity", icon: BarChart3 },
        { name: "WhatsApp", href: "/dashboard/whatsapp", icon: MessageCircle },
        { name: "Leads", href: "/dashboard/leads", icon: Users },
        { name: "Sandbox", href: "/dashboard/sandbox", icon: FlaskConical },
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ]

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard"
        return pathname.startsWith(href)
    }

    return (
        <div className="flex h-screen bg-black text-white selection:bg-purple-500/30 font-sans">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-black border-r border-zinc-900 flex flex-col transition-transform duration-300 md:relative md:translate-x-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Brand */}
                <div className="p-6">
                    <Link href="/dashboard" className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg shadow-purple-500/5 group">
                            <Bot className="w-6 h-6 text-zinc-100 group-hover:text-purple-400 transition-colors duration-300" />
                        </div>
                        <div>
                            <span className="text-lg font-bold tracking-tight text-white block">WORK-FLOW</span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">AI Automation</span>
                        </div>
                    </Link>

                    <Button
                        onClick={() => window.location.href = "/dashboard/campaigns"}
                        className="w-full bg-white text-black hover:bg-zinc-200 font-medium border border-transparent shadow-sm transition-all hover:scale-[1.02]"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Campaign
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1">
                    <p className="px-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 mt-2">Main Menu</p>
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                            <div
                                className={cn(
                                    "group flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1",
                                    isActive(item.href)
                                        ? "bg-zinc-900 text-white shadow-inner border border-zinc-800"
                                        : "text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900/50"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className={cn(
                                        "w-4 h-4 transition-colors",
                                        isActive(item.href) ? "text-purple-400" : "text-zinc-500 group-hover:text-zinc-300"
                                    )} />
                                    {item.name}
                                </div>
                                {isActive(item.href) && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                                )}
                            </div>
                        </Link>
                    ))}
                </nav>

                {/* User info */}
                <div className="p-4 border-t border-zinc-900 bg-black">
                    <div className="flex items-center gap-3 px-1">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-400">
                            {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-200 truncate">
                                {session?.user?.name || "User"}
                            </p>
                            <p className="text-xs text-zinc-500 truncate cursor-pointer hover:text-zinc-400" onClick={() => signOut()}>
                                Sign Out
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden flex flex-col">
                {/* Mobile header */}
                <div className="sticky top-0 z-30 flex items-center justify-between p-4 bg-black/80 backdrop-blur-lg border-b border-zinc-800 md:hidden">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-zinc-100" />
                        </div>
                        <span className="text-sm font-bold tracking-tight text-white">WORK-FLOW</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-zinc-900 transition-colors text-zinc-400"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-black p-4 md:p-6 relative">
                    {/* Consistent Background Grid (reused from landing) */}
                    <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

                    <div className="relative z-10 h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
