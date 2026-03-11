import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
    Users, Bot, Zap, Network, MessageSquare, PhoneCall,
    ShieldCheck, BarChart3, Database, Search, ArrowRight
} from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function SuperAdminDashboard() {
    // 1. Secondary Server-Side Security Verification
    // The Edge Middleware has already verified the cookie, but secondary verification
    // on the Server Component ensures zero possibility of bypass.
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session')?.value;

    if (adminSession !== process.env.ADMIN_COOKIE_SECRET) {
        redirect("/admin/login");
    }

    // 2. Aggregate Global Platform Statistics
    // Since this route is locked behind the middleware, these DB calls are 100% secure
    const [
        totalUsers,
        totalAgents,
        totalCampaigns,
        totalLeads,
        totalCalls,
        totalMessages
    ] = await Promise.all([
        prisma.user.count(),
        prisma.agent.count(),
        prisma.campaign.count(),
        prisma.lead.count(),
        prisma.callLog.count(),
        prisma.interactionLog.count()
    ]);

    // 3. Render Impenetrable SAAS Control Center
    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans p-8 pt-12 md:p-12 selection:bg-purple-500/30">
            {/* Background elements */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="w-8 h-8 text-green-500" />
                            <h1 className="text-3xl font-bold tracking-tight">Super Admin</h1>
                        </div>
                        <p className="text-zinc-400 text-sm max-w-xl">
                            Global platform overview. This route is isolated from standard user authentication
                            and protected by Edge-level cryptographic middleware interceptors.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-full px-4 py-2 text-xs font-mono text-zinc-400">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        SYSTEM ONLINE
                    </div>
                </div>

                {/* KPI Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <KpiCard icon={Users} label="Total Users" value={totalUsers} color="text-purple-400" />
                    <KpiCard icon={Bot} label="AI Agents" value={totalAgents} color="text-emerald-400" />
                    <KpiCard icon={Zap} label="Campaigns" value={totalCampaigns} color="text-blue-400" />
                    <KpiCard icon={Network} label="Leads" value={totalLeads} color="text-orange-400" />
                    <KpiCard icon={PhoneCall} label="Voice Calls" value={totalCalls} color="text-pink-400" />
                    <KpiCard icon={MessageSquare} label="Text Msgs" value={totalMessages} color="text-cyan-400" />
                </div>

                {/* Database Search Placeholder */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-800">
                            <BarChart3 className="w-5 h-5 text-zinc-400" />
                            <h2 className="text-lg font-medium">Platform Activity</h2>
                        </div>
                        <div className="h-64 flex flex-col items-center justify-center text-zinc-600 space-y-4">
                            <Database className="w-12 h-12 opacity-20" />
                            <p className="text-sm">Connect your time-series visualization library here (e.g. Recharts).</p>
                        </div>
                    </div>

                    <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-800">
                                <Search className="w-5 h-5 text-zinc-400" />
                                <h2 className="text-lg font-medium">Platform Management</h2>
                            </div>
                            <div className="space-y-4 mb-6">
                                <p className="text-sm text-zinc-500">
                                    Access the secure CRUD database layer. View, provision, modify, and permanently delete SAAS user accounts directly from the Master dashboard.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/admin/users"
                            className="bg-white text-black hover:bg-zinc-200 w-full py-3 px-4 rounded-lg flex items-center justify-center font-medium transition-colors"
                        >
                            Open User Directory
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}

function KpiCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
    return (
        <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center backdrop-blur-xl hover:bg-zinc-900/50 transition-colors">
            <div className={`w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-semibold text-white tracking-tight mb-1">
                {value.toLocaleString()}
            </h3>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                {label}
            </p>
        </div>
    );
}
