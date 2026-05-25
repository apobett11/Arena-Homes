"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MailPlus, MessageSquare, RefreshCw, Send, X } from "lucide-react";
import {
  createCaretakerBroadcast,
  createCaretakerDirectMessages,
  getCaretakerTenantRecipients,
  getMyMessages,
  markCommunicationRead,
  type CaretakerTenantRecipient,
  type CommunicationMessageItem,
} from "@/lib/communication/api";
import { cn, ck, filterButtonClass, statusChipClass } from "@/components/caretaker/caretaker-ui";

type ViewMode = "admin" | "sent";
type RecipientMode = "all" | "specific";

const DEFAULT_TITLE = "Message from caretaker";

export default function CaretakerMessagesPage() {
  const [messages, setMessages] = useState<CommunicationMessageItem[]>([]);
  const [tenants, setTenants] = useState<CaretakerTenantRecipient[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("admin");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("all");
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [composeError, setComposeError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [messageRows, tenantRows] = await Promise.all([
        getMyMessages(),
        getCaretakerTenantRecipients(),
      ]);
      setMessages(messageRows);
      setTenants(tenantRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const adminMessages = useMemo(
    () =>
      messages.filter(
        (message) =>
          message.direction === "INBOX" && message.sender_role === "ADMIN"
      ),
    [messages]
  );

  const sentMessages = useMemo(
    () => messages.filter((message) => message.direction === "SENT"),
    [messages]
  );

  const visibleMessages = viewMode === "admin" ? adminMessages : sentMessages;
  const selected = visibleMessages.find((message) => message.message_id === selectedId) ?? null;
  const selectedTenantSet = useMemo(() => new Set(selectedTenantIds), [selectedTenantIds]);

  const resetCompose = () => {
    setRecipientMode("all");
    setSelectedTenantIds([]);
    setSubject("");
    setBody("");
    setComposeError(null);
  };

  const closeCompose = () => {
    if (sending) return;
    setComposeOpen(false);
    resetCompose();
  };

  const openMessage = async (message: CommunicationMessageItem) => {
    setSelectedId(message.message_id);
    if (message.direction !== "INBOX" || message.read_at) return;

    const result = await markCommunicationRead(message.message_id);
    if (result.success) {
      setMessages((current) =>
        current.map((item) =>
          item.message_id === message.message_id ? { ...item, read_at: new Date().toISOString() } : item
        )
      );
    }
  };

  const toggleTenant = (tenantId: string) => {
    setSelectedTenantIds((current) =>
      current.includes(tenantId)
        ? current.filter((id) => id !== tenantId)
        : [...current, tenantId]
    );
  };

  const sendMessage = async () => {
    const trimmedBody = body.trim();
    const trimmedSubject = subject.trim() || DEFAULT_TITLE;
    const authorizedTenantIds = new Set(tenants.map((tenant) => tenant.tenant_id));

    setComposeError(null);

    if (!trimmedBody) {
      setComposeError("Message body is required.");
      return;
    }

    if (tenants.length === 0) {
      setComposeError("No assigned tenants are available to message.");
      return;
    }

    if (recipientMode === "specific") {
      if (selectedTenantIds.length === 0) {
        setComposeError("Select at least one tenant.");
        return;
      }

      if (selectedTenantIds.some((tenantId) => !authorizedTenantIds.has(tenantId))) {
        setComposeError("One or more selected tenants are not assigned to you.");
        return;
      }
    }

    setSending(true);
    try {
      if (recipientMode === "all") {
        const result = await createCaretakerBroadcast(trimmedSubject, trimmedBody);
        if (!result.success) throw new Error(result.error || "Failed to send message.");
      } else {
        const result = await createCaretakerDirectMessages(selectedTenantIds, trimmedSubject, trimmedBody);
        if (!result.success) throw new Error(result.error || "Failed to send message.");
      }

      await load();
      setViewMode("sent");
      setComposeOpen(false);
      resetCompose();
    } catch (err) {
      setComposeError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="caretaker-display-lg text-arena-on-surface">Messages</h1>
          <p className={ck.body}>Admin broadcasts and messages you have sent to your assigned tenants.</p>
        </div>
        <button type="button" onClick={() => setComposeOpen(true)} className={ck.btnPrimary}>
          <MailPlus className="h-4 w-4" />
          Compose Message
        </button>
      </div>

      {error && (
        <div className="caretaker-card border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="caretaker-card p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className={ck.tabBar}>
            <button type="button" onClick={() => setViewMode("admin")} className={filterButtonClass(viewMode === "admin")}>
              Admin Messages
            </button>
            <button type="button" onClick={() => setViewMode("sent")} className={filterButtonClass(viewMode === "sent")}>
              Sent Messages
            </button>
          </div>
          <button type="button" onClick={() => void load()} className={ck.btnGhost} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="max-h-[28rem] overflow-y-auto rounded-2xl border border-arena-outline-variant/70 bg-arena-surface-container-lowest">
            {loading ? (
              <EmptyState text="Loading messages..." />
            ) : visibleMessages.length === 0 ? (
              <EmptyState text={viewMode === "admin" ? "No admin messages yet." : "No sent messages yet."} />
            ) : (
              <ul className="divide-y divide-arena-outline-variant/60">
                {visibleMessages.map((message) => (
                  <li key={`${message.direction}-${message.message_id}`}>
                    <button
                      type="button"
                      onClick={() => void openMessage(message)}
                      className={cn(
                        "w-full p-4 text-left transition-colors hover:bg-arena-surface-container-low",
                        selectedId === message.message_id && "bg-arena-surface-container-low"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-arena-on-surface">
                          {message.title || DEFAULT_TITLE}
                        </span>
                        {message.direction === "INBOX" && !message.read_at && (
                          <span className={cn(statusChipClass("info"), "shrink-0")}>New</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-arena-on-surface-variant">
                        {message.direction === "INBOX"
                          ? `From ${message.sender_role === "ADMIN" ? "Admin" : message.sender_name}`
                          : sentRecipientLabel(message)}
                      </p>
                      <p className="mt-1 text-xs text-arena-on-surface-variant/80">
                        {formatDate(message.created_at)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <article className="min-h-[14rem] rounded-2xl border border-arena-outline-variant/70 bg-arena-surface-container-lowest p-4">
            {selected ? (
              <>
                <div className="mb-3 flex items-start gap-3">
                  <div className={ck.iconTile}>
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-arena-on-surface">{selected.title || DEFAULT_TITLE}</h2>
                    <p className="mt-1 text-xs text-arena-on-surface-variant">
                      {selected.direction === "INBOX"
                        ? `From ${selected.sender_role === "ADMIN" ? "Admin" : selected.sender_name}`
                        : sentRecipientLabel(selected)}
                      {" - "}
                      {formatDate(selected.created_at)}
                    </p>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-arena-on-surface">{selected.body}</p>
              </>
            ) : (
              <EmptyState text="Select a message to read." />
            )}
          </article>
        </div>
      </div>

      {composeOpen && (
        <div className={ck.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="compose-message-title">
          <div className={ck.modalPanel}>
            <div className="flex items-center justify-between border-b border-arena-outline-variant/60 p-4">
              <div>
                <h2 id="compose-message-title" className={ck.headline}>Compose Message</h2>
                <p className={ck.body}>Send to all assigned tenants or select specific recipients.</p>
              </div>
              <button type="button" onClick={closeCompose} className={ck.btnGhost} disabled={sending} aria-label="Close compose modal">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
              {composeError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {composeError}
                </div>
              )}

              <div>
                <span className={ck.fieldLabel}>Recipients</span>
                <div className={ck.tabBar}>
                  <button type="button" onClick={() => setRecipientMode("all")} className={filterButtonClass(recipientMode === "all")}>
                    Send to All Tenants
                  </button>
                  <button type="button" onClick={() => setRecipientMode("specific")} className={filterButtonClass(recipientMode === "specific")}>
                    Choose Specific Tenants
                  </button>
                </div>
              </div>

              {recipientMode === "specific" && (
                <div className="rounded-2xl border border-arena-outline-variant/70 bg-arena-surface-container-lowest">
                  {tenants.length === 0 ? (
                    <EmptyState text="No assigned tenants are available." />
                  ) : (
                    <div className="max-h-56 overflow-y-auto divide-y divide-arena-outline-variant/60">
                      {tenants.map((tenant) => (
                        <label key={tenant.tenant_id} className="flex cursor-pointer items-start gap-3 p-3 hover:bg-arena-surface-container-low">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4"
                            checked={selectedTenantSet.has(tenant.tenant_id)}
                            onChange={() => toggleTenant(tenant.tenant_id)}
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-arena-on-surface">
                              {tenant.full_name || "Tenant"}
                            </span>
                            <span className="block truncate text-xs text-arena-on-surface-variant">
                              Room {tenant.room_number || "N/A"}{tenant.email ? ` - ${tenant.email}` : ""}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <label className="block">
                <span className={ck.fieldLabel}>Subject</span>
                <input
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className={cn(ck.input, "w-full")}
                  placeholder={DEFAULT_TITLE}
                  maxLength={120}
                />
              </label>

              <label className="block">
                <span className={ck.fieldLabel}>Message</span>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  className={cn(ck.input, "min-h-36 w-full resize-y")}
                  placeholder="Write your message..."
                  maxLength={4000}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-arena-outline-variant/60 p-4">
              <button type="button" onClick={closeCompose} className={ck.btnGhost} disabled={sending}>
                Cancel
              </button>
              <button type="button" onClick={() => void sendMessage()} className={ck.btnPrimary} disabled={sending}>
                <Send className="h-4 w-4" />
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="p-4 text-sm text-arena-on-surface-variant">{text}</p>;
}

function sentRecipientLabel(message: CommunicationMessageItem) {
  return message.audience === "CARETAKER_TENANTS" ? "To assigned tenants" : "To selected tenant";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
}
