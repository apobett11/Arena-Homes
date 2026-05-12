"use client";

import { useEffect, useState } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { sendBroadcastMessage } from "@/lib/admin/dashboard";

export default function AdminBroadcastPage() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [targetRole, setTargetRole] = useState("ALL");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await sendBroadcastMessage({
                target_role: targetRole as "TENANT" | "EMPLOYEE" | "ALL",
                message_head: { title, type: "BROADCAST" },
                message_body: { content, timestamp: new Date().toISOString() }
            });
            setTitle("");
            setContent("");
            setMessage({ type: "success", text: "Broadcast sent successfully!" });
        } catch (err: any) {
            setMessage({ type: "error", text: err?.message || "Failed to send broadcast" });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen pb-24 lg:pb-8">
            <AdminTopBar />
            <div className="p-4 md:p-6 lg:p-8">
                <h1 className="text-3xl font-bold text-white mb-4">Broadcast System</h1>
                <p className="text-slate-400 mb-6">Send alerts and announcements to Tenants, Staff, or All.</p>
                {message && <p className={`mb-4 text-sm ${message.type === "success" ? "text-emerald-300" : "text-red-400"}`}>{message.text}</p>}

                <form onSubmit={handleCreate} className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 md:p-6 space-y-4 mb-6">
                    <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Announcement title" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} required placeholder="Announcement content" rows={4} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                    <div className="flex items-center gap-3">
                        <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                            <option value="ALL">All Users</option>
                            <option value="TENANT">Tenants Only</option>
                            <option value="EMPLOYEE">Staff Only</option>
                        </select>
                        <button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                            {saving ? "Sending..." : "Send Broadcast"}
                        </button>
                    </div>
                </form>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 md:p-6">
                    <h2 className="mb-3 text-lg font-semibold text-white">Recent Broadcasts</h2>
                    <div className="text-sm text-slate-400">
                        Broadcast messages are now stored as messages in the database. Check the messages section for delivery status.
                    </div>
                </div>
            </div>
        </div>
    );
}
