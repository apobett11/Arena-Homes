"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getMyMessages,
  markCommunicationRead,
  type CommunicationMessageItem,
} from "@/lib/communication/api";
import { cn, ck, filterButtonClass, statusChipClass } from "@/components/caretaker/caretaker-ui";

type Tab = "inbox" | "sent";

interface MessagesInboxProps {
  title?: string;
  className?: string;
}

export default function MessagesInbox({ title = "Messages", className = "" }: MessagesInboxProps) {
  const [tab, setTab] = useState<Tab>("inbox");
  const [messages, setMessages] = useState<CommunicationMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await getMyMessages();
      setMessages(rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => messages.filter((m) => (tab === "inbox" ? m.direction === "INBOX" : m.direction === "SENT")),
    [messages, tab]
  );

  const selected = filtered.find((m) => m.message_id === selectedId) ?? null;

  const openMessage = async (item: CommunicationMessageItem) => {
    setSelectedId(item.message_id);
    if (item.direction === "INBOX" && !item.read_at) {
      const result = await markCommunicationRead(item.message_id);
      if (result.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m.message_id === item.message_id ? { ...m, read_at: new Date().toISOString() } : m
          )
        );
      }
    }
  };

  return (
    <div className={className}>
      <h1 className={cn(ck.headline, "mb-4")}>{title}</h1>
      {error && <p className="mb-3 text-sm text-error">{error}</p>}

      <div className={cn(ck.tabBar, "mb-4")}>
        <button type="button" onClick={() => setTab("inbox")} className={filterButtonClass(tab === "inbox")}>
          Inbox
        </button>
        <button type="button" onClick={() => setTab("sent")} className={filterButtonClass(tab === "sent")}>
          Sent
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-arena-outline-variant/70 bg-arena-surface-container-lowest max-h-[28rem] overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-arena-on-surface-variant">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-sm text-arena-on-surface-variant">No messages.</p>
          ) : (
            <ul className="divide-y divide-arena-outline-variant/60">
              {filtered.map((item) => (
                <li key={`${item.direction}-${item.message_id}`}>
                  <button
                    type="button"
                    onClick={() => void openMessage(item)}
                    className={cn(
                      "w-full p-4 text-left hover:bg-arena-surface-container-low transition-colors",
                      selectedId === item.message_id && "bg-arena-surface-container-low"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-arena-on-surface truncate">{item.title}</span>
                      {item.direction === "INBOX" && !item.read_at && (
                        <span className={cn(statusChipClass("info"), "shrink-0")}>New</span>
                      )}
                    </div>
                    <p className="text-xs text-arena-on-surface-variant mt-1">
                      {item.direction === "INBOX" ? `From ${item.sender_name}` : `To ${item.audience}`} -{" "}
                      {item.message_type}
                    </p>
                    <p className="text-xs text-arena-on-surface-variant/80 mt-1">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-arena-outline-variant/70 bg-arena-surface-container-lowest p-4 min-h-[12rem]">
          {selected ? (
            <>
              <h2 className="text-lg font-semibold text-arena-on-surface">{selected.title}</h2>
              <p className="text-xs text-arena-on-surface-variant mt-1 mb-3">
                {selected.sender_name} ({selected.sender_role}) - {new Date(selected.created_at).toLocaleString()}
              </p>
              <p className="text-sm text-arena-on-surface whitespace-pre-wrap">{selected.body}</p>
            </>
          ) : (
            <p className="text-sm text-arena-on-surface-variant">Select a message to read.</p>
          )}
        </div>
      </div>
    </div>
  );
}
