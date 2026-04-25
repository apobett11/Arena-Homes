"use client";

import { useEffect, useMemo, useState } from "react";
import AdminModal from "@/components/admin/AdminModal";
import { getSupabaseClient } from "@/lib/supabase/client";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type: string;
}

interface NotificationsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ open, onClose }: NotificationsModalProps) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = useMemo(() => items.filter((item) => !item.is_read).length, [items]);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      try {
        const supabase = getSupabaseClient() as any;
        const authResult = await supabase.auth.getUser();
        const userId = authResult.data?.user?.id;
        if (!userId) {
          setItems([]);
          return;
        }
        const { data, error } = await supabase
          .from("notifications")
          .select("id,title,message,is_read,created_at,type")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(30);
        if (error) {
          setItems([]);
          return;
        }
        setItems((data ?? []) as NotificationItem[]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [open]);

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const supabase = getSupabaseClient() as any;
      const authResult = await supabase.auth.getUser();
      const userId = authResult.data?.user?.id;
      if (!userId) return;
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
      setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } finally {
      setMarkingAll(false);
    }
  };

  const markOneAsRead = async (id: string) => {
    const supabase = getSupabaseClient() as any;
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
  };

  return (
    <AdminModal open={open} onClose={onClose} title="Notifications">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{unreadCount} unread</p>
        <button
          onClick={markAllAsRead}
          disabled={markingAll || unreadCount === 0}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {markingAll ? "Marking..." : "Mark all as read"}
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-slate-400">Loading notifications...</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-400">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (!item.is_read) void markOneAsRead(item.id);
              }}
              className={`w-full rounded-xl border p-3 text-left transition ${
                item.is_read
                  ? "border-slate-800 bg-slate-950/40 text-slate-300"
                  : "border-blue-500/30 bg-blue-500/10 text-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{item.title}</p>
                <span className="text-[11px] text-slate-400">{new Date(item.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-sm text-slate-300">{item.message}</p>
            </button>
          ))}
        </div>
      )}
    </AdminModal>
  );
}
