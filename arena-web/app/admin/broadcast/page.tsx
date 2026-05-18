"use client";

import { useCallback, useEffect, useState } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import {
  createAdminBroadcast,
  getAdminBroadcastStats,
  getMyMessages,
  type CommunicationAudience,
  type CommunicationMessageItem,
} from "@/lib/communication/api";

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<CommunicationAudience>("ALL");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [broadcasts, setBroadcasts] = useState<CommunicationMessageItem[]>([]);
  const [statsFor, setStatsFor] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadBroadcasts = useCallback(async () => {
    const rows = await getMyMessages();
    setBroadcasts(
      rows.filter((m) => m.direction === "SENT" && m.message_type === "BROADCAST")
    );
  }, []);

  useEffect(() => {
    void loadBroadcasts();
  }, [loadBroadcasts]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const result = await createAdminBroadcast(audience, title.trim(), body.trim());
    setSaving(false);
    if (result.success) {
      setMessage({
        type: "success",
        text: `Broadcast sent to ${result.recipientCount ?? 0} recipient(s).`,
      });
      setTitle("");
      setBody("");
      await loadBroadcasts();
    } else {
      setMessage({ type: "error", text: result.error || "Failed to send broadcast" });
    }
  }

  async function viewStats(messageId: string) {
    setStatsFor(messageId);
    setStatsLoading(true);
    setStats(null);
    const result = await getAdminBroadcastStats(messageId);
    setStatsLoading(false);
    if (result.success) {
      setStats(result.stats);
    } else {
      setMessage({ type: "error", text: result.error || "Failed to load stats" });
    }
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <AdminTopBar />
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-white mb-4">Broadcast System</h1>
        <p className="text-slate-400 mb-6">
          Send secure broadcasts to all users, employees, or tenants. Delivery and read tracking are enforced server-side.
        </p>
        {message && (
          <p className={`mb-4 text-sm ${message.type === "success" ? "text-emerald-300" : "text-red-400"}`}>
            {message.text}
          </p>
        )}

        <form onSubmit={handleCreate} className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 md:p-6 space-y-4 mb-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Broadcast title"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            placeholder="Broadcast message"
            rows={4}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as CommunicationAudience)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              <option value="ALL">All Users</option>
              <option value="TENANTS">Tenants Only</option>
              <option value="EMPLOYEES">Employees Only</option>
            </select>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Sending..." : "Send Broadcast"}
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 md:p-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Recent Broadcasts</h2>
          {broadcasts.length === 0 ? (
            <p className="text-sm text-slate-400">No broadcasts sent yet.</p>
          ) : (
            <div className="space-y-2">
              {broadcasts.slice(0, 15).map((item) => (
                <div
                  key={item.message_id}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-slate-400">
                      {item.audience} · {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void viewStats(item.message_id)}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                  >
                    View stats
                  </button>
                </div>
              ))}
            </div>
          )}

          {statsFor && (
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
              {statsLoading ? (
                <p>Loading stats...</p>
              ) : stats ? (
                <div className="space-y-1">
                  <p>
                    <span className="text-slate-400">Total recipients:</span>{" "}
                    {String(stats.total_recipients)}
                  </p>
                  <p>
                    <span className="text-slate-400">Read:</span> {String(stats.read_count)} (
                    {String(stats.read_percentage)}%)
                  </p>
                  <p>
                    <span className="text-slate-400">Tenants read:</span> {String(stats.tenant_read)} /{" "}
                    {String(stats.tenant_total)} ({String(stats.tenant_read_percentage)}%)
                  </p>
                  <p>
                    <span className="text-slate-400">Employees read:</span> {String(stats.employee_read)} /{" "}
                    {String(stats.employee_total)} ({String(stats.employee_read_percentage)}%)
                  </p>
                </div>
              ) : (
                <p className="text-red-400">Could not load stats.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
