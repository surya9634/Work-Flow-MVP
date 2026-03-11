"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Users, Plus, Search, MoreVertical, Edit2, Trash2,
    ShieldAlert, Loader2, ArrowLeft, ShieldCheck, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        businessName: "",
        credits: 500,
        metaAccessToken: "",
        wabaId: ""
    });
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else if (res.status === 401) {
                router.push("/admin/login");
            }
        } catch (error) {
            console.error("Failed to fetch users");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setIsCreateOpen(false);
                fetchUsers();
                resetForm();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    businessName: formData.businessName,
                    credits: formData.credits,
                    metaAccessToken: formData.metaAccessToken,
                    wabaId: formData.wabaId
                })
            });
            if (res.ok) {
                setIsEditOpen(false);
                fetchUsers();
                resetForm();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        setFormLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setIsDeleteOpen(false);
                fetchUsers();
                setSelectedUser(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setFormLoading(false);
        }
    };

    const openEdit = (user: any) => {
        setSelectedUser(user);
        setFormData({
            ...formData,
            name: user.name || "",
            email: user.email || "",
            businessName: user.businessName || "",
            credits: user.credits || 0,
            metaAccessToken: user.metaAccessToken || "",
            wabaId: user.wabaId || ""
        });
        setIsEditOpen(true);
    };

    const openDelete = (user: any) => {
        setSelectedUser(user);
        setIsDeleteOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: "", email: "", password: "", businessName: "",
            credits: 500, metaAccessToken: "", wabaId: ""
        });
        setSelectedUser(null);
    };

    const filteredUsers = users.filter(u =>
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.id && u.id.includes(searchQuery))
    );

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans p-8 pt-12 md:p-12 selection:bg-purple-500/30">
            {/* Background */}
            <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <button
                            onClick={() => router.push('/admin')}
                            className="flex items-center text-sm text-zinc-500 hover:text-white transition-colors mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </button>
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="w-8 h-8 text-blue-500" />
                            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                        </div>
                        <p className="text-zinc-400 text-sm max-w-xl">
                            Provision, edit, and offboard SAAS customers. Changes made here directly interact with the PostgreSQL database.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <Input
                                placeholder="Search by email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-64 pl-9 bg-black/50 border-zinc-800 text-sm h-10 ring-offset-black focus-visible:ring-zinc-800"
                            />
                        </div>
                        <Button
                            onClick={() => { resetForm(); setIsCreateOpen(true); }}
                            className="bg-white text-black hover:bg-zinc-200 h-10 px-5"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New User
                        </Button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4 whitespace-nowrap">Email</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Name</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Business</th>
                                    <th className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">Credits</th>
                                    <th className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">WABA ID</th>
                                    <th className="px-6 py-4 whitespace-nowrap hidden md:table-cell">Joined</th>
                                    <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            Loading database records...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                                            No users found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-zinc-900/20 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{user.email}</td>
                                            <td className="px-6 py-4 text-zinc-400">{user.name || "—"}</td>
                                            <td className="px-6 py-4 text-zinc-400">{user.businessName || "—"}</td>
                                            <td className="px-6 py-4 text-zinc-400 hidden lg:table-cell font-mono">{user.credits}</td>
                                            <td className="px-6 py-4 text-zinc-400 hidden xl:table-cell font-mono text-xs opacity-70">
                                                {user.wabaId || "Not Connected"}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-500 hidden md:table-cell">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openEdit(user)} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => openDelete(user)} className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Modals */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-4">Provision New User</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-500 uppercase tracking-wider">Email Address</label>
                                <Input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1 bg-black/50 border-zinc-800" />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase tracking-wider">Secure Password</label>
                                <Input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="mt-1 bg-black/50 border-zinc-800" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Full Name</label>
                                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1 bg-black/50 border-zinc-800" />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Starting Credits</label>
                                    <Input type="number" value={formData.credits} onChange={e => setFormData({ ...formData, credits: parseInt(e.target.value) })} className="mt-1 bg-black/50 border-zinc-800" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="hover:bg-zinc-900 border-zinc-800 text-zinc-400">Cancel</Button>
                                <Button type="submit" disabled={formLoading} className="bg-white text-black hover:bg-zinc-200">
                                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create User"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-1">Edit User Record</h2>
                        <p className="text-sm text-zinc-500 mb-6 font-mono text-xs">{selectedUser?.email}</p>

                        <form onSubmit={handleEdit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Full Name</label>
                                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1 bg-black/50 border-zinc-800" />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Credits</label>
                                    <Input type="number" value={formData.credits} onChange={e => setFormData({ ...formData, credits: parseInt(e.target.value) })} className="mt-1 bg-black/50 border-zinc-800" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase tracking-wider flex items-center gap-2"><CreditCard className="w-3 h-3" /> Meta Access Token</label>
                                <Input value={formData.metaAccessToken} onChange={e => setFormData({ ...formData, metaAccessToken: e.target.value })} className="mt-1 bg-black/50 border-zinc-800 font-mono text-xs" />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase tracking-wider">WhatsApp Business ID (WABA)</label>
                                <Input value={formData.wabaId} onChange={e => setFormData({ ...formData, wabaId: e.target.value })} className="mt-1 bg-black/50 border-zinc-800 font-mono text-xs" />
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="hover:bg-zinc-900 border-zinc-800 text-zinc-400">Cancel</Button>
                                <Button type="submit" disabled={formLoading} className="bg-blue-600 text-white hover:bg-blue-700">
                                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-950 border border-red-900/50 rounded-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200 text-center">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Delete User?</h2>
                        <p className="text-sm text-zinc-400 mb-6">
                            This will permanently remove <span className="text-white font-medium">{selectedUser?.email}</span> from the database. This action cannot be reversed.
                        </p>

                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={() => setIsDeleteOpen(false)} className="flex-1 hover:bg-zinc-900 border-zinc-800 text-zinc-400">Cancel</Button>
                            <Button type="button" onClick={handleDelete} disabled={formLoading} className="flex-1 bg-red-600 text-white hover:bg-red-700">
                                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Delete"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
