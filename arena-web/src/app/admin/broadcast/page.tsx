"use client";

import { useEffect, useState } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { AnnouncementApi, Announcement } from "@/lib/api/domains/announcements";

export default function AdminBroadcastPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [targetRole, setTargetRole] = useState("PUBLIC");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function loadAnnouncements() {
        try {
            const data = await AnnouncementApi.getAll();
            setAnnouncements(data);
        } catch (err: any) {
            setError(err?.message || "Failed to load announcements");
        }
    }

    useEffect(() => {
        loadAnnouncements();
    }, []);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            await AnnouncementApi.create({ title, content, targetRole });
            setTitle("");
            setContent("");
            await loadAnnouncements();
        } catch (err: any) {
            setError(err?.message || "Failed to create announcement");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen pb-24 lg:pb-8">
            <AdminTopBar />
            <div className="p-4 md:p-6 lg:p-8">
                <h1 className="text-3xl font-bold text-white mb-4">Broadcast System</h1>
                <p className="text-slate-400 mb-6">Send alerts and announcements to Tenants, Staff, or Public.</p>
                {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

                <form onSubmit={handleCreate} className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 md:p-6 space-y-4 mb-6">
                    <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Announcement title" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} required placeholder="Announcement content" rows={4} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                    <div className="flex items-center gap-3">
                        <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                            <option value="PUBLIC">Public</option>
                            <option value="TENANT">Tenant</option>
                            <option value="EMPLOYEE">Employee</option>
                        </select>
                        <button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                            {saving ? "Sending..." : "Send Broadcast"}
                        </button>
                    </div>
                </form>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 md:p-6">
                    <h2 className="mb-3 text-lg font-semibold text-white">Recent Broadcasts</h2>
                    <div className="space-y-2">
                        {announcements.slice(0, 10).map((item) => (
                            <div key={item.id} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                                <div className="text-sm font-semibold text-white">{item.title}</div>
                                <div className="text-xs text-slate-400">{item.targetRole}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
