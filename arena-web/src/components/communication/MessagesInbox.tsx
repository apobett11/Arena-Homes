"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getMyMessages,
  markCommunicationRead,
  type CommunicationMessageItem,
} from "@/lib/communication/api";

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
    () =>
      messages.filter((m) =>
        tab === "inbox" ? m.direction === "INBOX" : m.direction === "SENT"
      ),
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
      <h1 className="text-2xl font-bold text-white mb-4">{title}</h1>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab("inbox")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === "inbox" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"
          }`}
        >
          Inbox
        </button>
        <button
          type="button"
          onClick={() => setTab("sent")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === "sent" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"
          }`}
        >
          Sent
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 max-h-[28rem] overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-slate-400">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">No messages.</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {filtered.map((item) => (
                <li key={`${item.direction}-${item.message_id}`}>
                  <button
                    type="button"
                    onClick={() => void openMessage(item)}
                    className={`w-full p-3 text-left hover:bg-slate-800/60 ${
                      selectedId === item.message_id ? "bg-slate-800/80" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white truncate">{item.title}</span>
                      {item.direction === "INBOX" && !item.read_at && (
                        <span className="shrink-0 text-[10px] uppercase tracking-wide text-blue-400">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {item.direction === "INBOX"
                        ? `From ${item.sender_name}`
                        : `To ${item.audience}`}{" "}
                      · {item.message_type}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 min-h-[12rem]">
          {selected ? (
            <>
              <h2 className="text-lg font-semibold text-white">{selected.title}</h2>
              <p className="text-xs text-slate-400 mt-1 mb-3">
                {selected.sender_name} ({selected.sender_role}) ·{" "}
                {new Date(selected.created_at).toLocaleString()}
              </p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{selected.body}</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">Select a message to read.</p>
          )}
        </div>
      </div>
    </div>
  );
}
