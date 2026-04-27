"use client";

import React, { useState } from "react";
import { Bell, Plus, Send, Inbox, User } from "lucide-react";
import type { CaretakerAnnouncement } from "@/lib/caretaker/types";
import { createCaretakerAnnouncement } from "@/lib/caretaker/dashboard";

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
  caretakerEmployeeId,
  onDataChange,
}: AnnouncementsPanelProps) => {
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">("incoming");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (data: { title: string; body: string }) => {
    setLoading(true);
    const result = await createCaretakerAnnouncement({
      ...data,
      property_id: propertyId,
      target_role: "TENANT",
    });
    if (result.success) {
      setShowCreateModal(false);
      onDataChange();
    }
    setLoading(false);
  };

  const announcements = activeTab === "incoming" ? incoming : outgoing;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab("incoming")}
          className={`pb-3 px-4 font-medium transition-colors flex items-center gap-2 ${
            activeTab === "incoming"
              ? "text-primary border-b-2 border-primary"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Inbox className="w-4 h-4" />
          Incoming ({incoming.length})
        </button>
        <button
          onClick={() => setActiveTab("outgoing")}
          className={`pb-3 px-4 font-medium transition-colors flex items-center gap-2 ${
            activeTab === "outgoing"
              ? "text-primary border-b-2 border-primary"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Send className="w-4 h-4" />
          Outgoing ({outgoing.length})
        </button>
      </div>

      {/* Create Button (only for outgoing) */}
      {activeTab === "outgoing" && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Send Announcement
        </button>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <AnnouncementCard key={announcement.id} announcement={announcement} type={activeTab} />
        ))}
      </div>

      {announcements.length === 0 && (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10">
          <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            No {activeTab} announcements.
          </p>
        </div>
      )}

      {/* Create Modal */}
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
}: {
  announcement: CaretakerAnnouncement;
  type: "incoming" | "outgoing";
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          {type === "incoming" ? (
            <Bell className="w-5 h-5 text-primary" />
          ) : (
            <Send className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-white">{announcement.title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{announcement.body}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
            <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
            {announcement.is_global && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">Global</span>
            )}
            {announcement.target_role && (
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
                To: {announcement.target_role}
              </span>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Send Announcement</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Water Maintenance Notice"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Write your announcement..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-primary text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
