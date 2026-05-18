"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminModal from "@/components/admin/AdminModal";
import {
  getMyNotificationsRpc,
  markCommunicationRead,
  type CommunicationNotificationItem,
} from "@/lib/communication/api";

interface NotificationsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ open, onClose }: NotificationsModalProps) {
  const router = useRouter();
  const [items, setItems] = useState<CommunicationNotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = useMemo(() => items.filter((item) => !item.is_read).length, [items]);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getMyNotificationsRpc();
        setItems(data);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [open]);

  const openNotification = async (item: CommunicationNotificationItem) => {
    const messageId =
      (item.data?.communication_message_id as string) ||
      (item.data?.message_id as string) ||
      null;
    if (messageId) {
      await markCommunicationRead(messageId);
    }
    setItems((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    );
    onClose();
    router.push("/admin/messages");
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      for (const item of items.filter((n) => !n.is_read)) {
        const messageId =
          (item.data?.communication_message_id as string) ||
          (item.data?.message_id as string) ||
          null;
        if (messageId) {
          await markCommunicationRead(messageId);
        }
      }
      setItems((prev) => prev.map((item) => ({ ...item, is_read: true, read_at: new Date().toISOString() })));
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <AdminModal open={open} onClose={onClose} title="Notifications">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{unreadCount} unread</p>
        <button
          onClick={() => void markAllAsRead()}
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
              type="button"
              onClick={() => void openNotification(item)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                item.is_read
                  ? "border-slate-800 bg-slate-950/40 text-slate-300"
                  : "border-blue-500/30 bg-blue-500/10 text-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{item.title}</p>
                <span className="text-[11px] text-slate-400">
                  {new Date(item.created_at).toLocaleString()}
                </span>
                </div>
              <p className="mt-1 text-sm text-slate-300">{item.body}</p>
            </button>
          ))}
        </div>
      )}
    </AdminModal>
  );
}
