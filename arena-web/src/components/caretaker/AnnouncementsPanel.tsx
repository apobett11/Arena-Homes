"use client";

import React, { useState } from "react";
import { Bell, Plus, Send } from "lucide-react";
import type { CaretakerAnnouncement } from "@/lib/caretaker/types";
import { createCaretakerAnnouncement } from "@/lib/caretaker/dashboard";
import { getCaretakerBroadcastStats } from "@/lib/communication/api";
import { cn, ck, filterButtonClass } from "./caretaker-ui";

interface AnnouncementsPanelProps {
  incoming: CaretakerAnnouncement[];
  outgoing: CaretakerAnnouncement[];
  propertyId: string;
  caretakerEmployeeId: string;
  onDataChange: () => void;
}

export const AnnouncementsPanel = ({
  incoming,
  outgoing,
  propertyId,
  onDataChange,
}: AnnouncementsPanelProps) => {
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">("incoming");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [statsFor, setStatsFor] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const handleCreate = async (data: { title: string; body: string }) => {
    setLoading(true);
    setFeedback(null);
    const result = await createCaretakerAnnouncement({
      title: data.title,
      body: data.body,
      property_id: propertyId,
      target_role: "TENANT",
    });
    setLoading(false);
    if (result.success) {
      setFeedback(`Broadcast sent to ${result.recipientCount ?? 0} tenant(s).`);
      setShowCreateModal(false);
      onDataChange();
    } else {
      setFeedback(result.error || "Failed to send broadcast");
    }
  };

  const loadStats = async (messageId: string) => {
    setStatsFor(messageId);
    setStatsLoading(true);
    setStats(null);
    const result = await getCaretakerBroadcastStats(messageId);
    setStatsLoading(false);
    if (result.success) {
      setStats(result.stats);
    } else {
      setFeedback(result.error || "Failed to load stats");
    }
  };

  const announcements = activeTab === "incoming" ? incoming : outgoing;

  return (
    <div className="space-y-6">
      <div>
        <h2 className={ck.display}>Notifications & Announcements</h2>
        <p className={ck.body}>Read admin notices and broadcast updates to tenants assigned to your property.</p>
      </div>

      <div className={ck.tabBar}>
        <button
          type="button"
          onClick={() => setActiveTab("incoming")}
          className={filterButtonClass(activeTab === "incoming")}
        >
          <Bell className="w-4 h-4" />
          Incoming ({incoming.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("outgoing")}
          className={filterButtonClass(activeTab === "outgoing")}
        >
          <Send className="w-4 h-4" />
          My broadcasts ({outgoing.length})
        </button>
      </div>

      {feedback && (
        <p className="text-sm text-arena-on-surface-variant bg-arena-surface-container-low border border-arena-outline-variant/60 rounded-xl px-3 py-2">
          {feedback}
        </p>
      )}

      {activeTab === "outgoing" && (
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className={ck.btnManage}
        >
          <Plus className="w-4 h-4" />
          Send broadcast to my tenants
        </button>
      )}

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <AnnouncementCard
            key={announcement.id}
            announcement={announcement}
            type={activeTab}
            onViewStats={activeTab === "outgoing" ? () => void loadStats(announcement.id) : undefined}
          />
        ))}
      </div>

      {announcements.length === 0 && (
        <div className={ck.empty}>
          <Bell className="w-12 h-12 text-arena-on-surface-variant mx-auto mb-4" />
          <p className={ck.body}>
            No {activeTab === "incoming" ? "incoming" : "outgoing"} items.
          </p>
        </div>
      )}

      {statsFor && activeTab === "outgoing" && (
        <div className="rounded-xl border border-arena-outline-variant/60 bg-arena-surface-container-low p-4 text-sm">
          {statsLoading ? (
            <p className={ck.body}>Loading read stats...</p>
          ) : stats ? (
            <div className="space-y-2 text-arena-on-surface">
              <p>
                Read: {String(stats.read_count)} / {String(stats.total_tenants)} (
                {String(stats.read_percentage)}%)
              </p>
              <p className="text-xs text-arena-on-surface-variant">
                Unread tenants:{" "}
                {Array.isArray(stats.unread_tenants)
                  ? (stats.unread_tenants as { name?: string }[]).map((t) => t.name).join(", ") || "None"
                  : "-"}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {showCreateModal && (
        <CreateModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
          loading={loading}
        />
      )}
    </div>
  );
};

const AnnouncementCard = ({
  announcement,
  type,
  onViewStats,
}: {
  announcement: CaretakerAnnouncement;
  type: "incoming" | "outgoing";
  onViewStats?: () => void;
}) => {
  return (
    <div className={ck.card}>
      <div className="flex items-start gap-3">
        <div className={ck.iconTile}>
          {type === "incoming" ? (
            <Bell className="w-5 h-5 text-primary" />
          ) : (
            <Send className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-arena-on-surface">{announcement.title}</h3>
          <p className={cn(ck.body, "mt-1")}>{announcement.body}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-arena-on-surface-variant">
            <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
            {onViewStats && (
              <button type="button" onClick={onViewStats} className="text-primary font-semibold hover:underline">
                View read stats
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateModal = ({
  onClose,
  onCreate,
  loading,
}: {
  onClose: () => void;
  onCreate: (data: { title: string; body: string }) => void;
  loading: boolean;
}) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ title, body });
  };

  return (
    <div className={ck.modalBackdrop}>
      <div className="caretaker-card p-6 w-full max-w-md">
        <h2 className={cn(ck.headline, "mb-2")}>
          Broadcast to my tenants
        </h2>
        <p className={cn(ck.body, "mb-4")}>
          Only tenants assigned to your properties will receive this message.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={ck.fieldLabel}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={cn(ck.input, "w-full")}
            />
          </div>

          <div>
            <label className={ck.fieldLabel}>Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              required
              className={cn(ck.input, "w-full")}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={cn(ck.btnGhost, "flex-1")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(ck.btnInfo, "flex-1")}
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
