"use client";

import React, { useState } from "react";
import { Settings, Plus, CheckCircle, Wrench, AlertCircle } from "lucide-react";
import type { CaretakerRepair, CaretakerIssue } from "@/lib/caretaker/types";
import { createCaretakerRepair, markRepairAsSolved } from "@/lib/caretaker/dashboard";

interface RepairsPanelProps {
  repairs: CaretakerRepair[];
  issues: CaretakerIssue[];
  propertyId: string;
  onDataChange: () => void;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  SOLVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  CANCELLED: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400",
};

export const RepairsPanel = ({ repairs, issues, propertyId, onDataChange }: RepairsPanelProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleCreate = async (payload: {
    title: string;
    description: string;
    issue_id?: string;
  }) => {
    setLoading("creating");
    const result = await createCaretakerRepair({
      ...payload,
      property_id: propertyId,
    });
    if (result.success) {
      setShowCreateModal(false);
      onDataChange();
    }
    setLoading(null);
  };

  const handleResolve = async (repairId: string) => {
    setLoading(repairId);
    const result = await markRepairAsSolved(repairId);
    if (result.success) {
      onDataChange();
    }
    setLoading(null);
  };

  const stats = {
    total: repairs.length,
    pending: repairs.filter((r) => r.status === "PENDING").length,
    inProgress: repairs.filter((r) => r.status === "IN_PROGRESS").length,
    solved: repairs.filter((r) => r.status === "SOLVED").length,
  };

  // Get unresolved issues for linking
  const unresolvedIssues = issues.filter((i) => i.status !== "RESOLVED" && i.status !== "CLOSED");

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} color="bg-slate-500" />
        <StatCard label="Pending" value={stats.pending} color="bg-amber-500" />
        <StatCard label="In Progress" value={stats.inProgress} color="bg-blue-500" />
        <StatCard label="Solved" value={stats.solved} color="bg-emerald-500" />
      </div>

      {/* Create Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create Repair
      </button>

      {/* Repairs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {repairs.map((repair) => (
          <RepairCard
            key={repair.id}
            repair={repair}
            isLoading={loading === repair.id}
            onResolve={() => handleResolve(repair.id)}
          />
        ))}
      </div>

      {repairs.length === 0 && (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10">
          <Settings className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">No repairs found.</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateRepairModal
          issues={unresolvedIssues}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
          loading={loading === "creating"}
        />
      )}
    </div>
  );
};

const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10">
    <div className={`w-3 h-3 rounded-full ${color} mb-2`} />
    <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
  </div>
);

const RepairCard = ({
  repair,
  isLoading,
  onResolve,
}: {
  repair: CaretakerRepair;
  isLoading: boolean;
  onResolve: () => void;
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{repair.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[repair.status]}`}>
              {repair.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      {repair.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{repair.description}</p>
      )}

      {repair.issue && (
        <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm">
          <p className="text-slate-500 dark:text-slate-400">Linked Issue:</p>
          <p className="font-medium text-slate-900 dark:text-white">{repair.issue.title}</p>
        </div>
      )}

      <div className="space-y-1 text-sm mb-3">
        {repair.unit?.room_number && (
          <p className="text-slate-500 dark:text-slate-400">Room: {repair.unit.room_number}</p>
        )}
        {repair.tenant?.full_name && (
          <p className="text-slate-500 dark:text-slate-400">Tenant: {repair.tenant.full_name}</p>
        )}
      </div>

      {repair.resolution_notes && (
        <div className="mb-3 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-sm">
          <p className="text-emerald-700 dark:text-emerald-400 font-medium">Resolution:</p>
          <p className="text-emerald-600 dark:text-emerald-300">{repair.resolution_notes}</p>
        </div>
      )}

      {repair.status !== "SOLVED" && repair.status !== "CANCELLED" && (
        <button
          onClick={onResolve}
          disabled={isLoading}
          className="w-full py-2 px-4 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          {isLoading ? "Updating..." : "Mark as Solved"}
        </button>
      )}
    </div>
  );
};

const CreateRepairModal = ({
  issues,
  onClose,
  onCreate,
  loading,
}: {
  issues: CaretakerIssue[];
  onClose: () => void;
  onCreate: (payload: { title: string; description: string; issue_id?: string }) => void;
  loading: boolean;
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issueId, setIssueId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ title, description, issue_id: issueId || undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Create Repair</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Fix leaking pipe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe the repair needed..."
            />
          </div>

          {issues.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Link to Issue (optional)
              </label>
              <select
                value={issueId}
                onChange={(e) => setIssueId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No linked issue</option>
                {issues.map((issue) => (
                  <option key={issue.id} value={issue.id}>
                    {issue.title} ({issue.unit?.room_number || "No room"})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Repair"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
