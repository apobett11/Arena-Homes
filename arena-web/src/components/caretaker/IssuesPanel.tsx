"use client";

import React, { useState } from "react";
import { Wrench, CheckCircle, Clock, AlertTriangle, ArrowRight, Filter } from "lucide-react";
import type { CaretakerIssue } from "@/lib/caretaker/types";
import { markIssueAsResolved, markIssueAsInProgress } from "@/lib/caretaker/dashboard";

interface IssuesPanelProps {
  issues: CaretakerIssue[];
  propertyId: string;
  onDataChange: () => void;
}

const priorityColors: Record<string, string> = {
  URGENT: "bg-rose-500",
  HIGH: "bg-amber-500",
  NORMAL: "bg-blue-500",
  LOW: "bg-slate-500",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  RESOLVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  ESCALATED: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
  CLOSED: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400",
};

export const IssuesPanel = ({ issues, propertyId, onDataChange }: IssuesPanelProps) => {
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState<string | null>(null);

  const filteredIssues = issues.filter((issue) => {
    if (filter === "all") return true;
    return issue.status === filter;
  });

  const handleResolve = async (issueId: string) => {
    setLoading(issueId);
    const result = await markIssueAsResolved(issueId);
    if (result.success) {
      onDataChange();
    }
    setLoading(null);
  };

  const handleStartProgress = async (issueId: string) => {
    setLoading(issueId);
    const result = await markIssueAsInProgress(issueId);
    if (result.success) {
      onDataChange();
    }
    setLoading(null);
  };

  const stats = {
    total: issues.length,
    pending: issues.filter((i) => i.status === "PENDING").length,
    inProgress: issues.filter((i) => i.status === "IN_PROGRESS").length,
    resolved: issues.filter((i) => i.status === "RESOLVED").length,
    escalated: issues.filter((i) => i.status === "ESCALATED").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total" value={stats.total} color="bg-slate-500" />
        <StatCard label="Pending" value={stats.pending} color="bg-amber-500" alert={stats.pending > 0} />
        <StatCard label="In Progress" value={stats.inProgress} color="bg-blue-500" />
        <StatCard label="Resolved" value={stats.resolved} color="bg-emerald-500" />
        <StatCard label="Escalated" value={stats.escalated} color="bg-rose-500" alert={stats.escalated > 0} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All Issues" />
        <FilterButton active={filter === "PENDING"} onClick={() => setFilter("PENDING")} label="Pending" color="amber" />
        <FilterButton active={filter === "IN_PROGRESS"} onClick={() => setFilter("IN_PROGRESS")} label="In Progress" color="blue" />
        <FilterButton active={filter === "RESOLVED"} onClick={() => setFilter("RESOLVED")} label="Resolved" color="emerald" />
        <FilterButton active={filter === "ESCALATED"} onClick={() => setFilter("ESCALATED")} label="Escalated" color="rose" />
      </div>

      {/* Issues Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Issue</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Room</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tenant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {filteredIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{issue.title}</p>
                      {issue.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{issue.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-sm">
                      {issue.unit?.room_number || issue.tenant?.room_number || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                    {issue.tenant?.full_name || "Unknown"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${priorityColors[issue.priority] || "bg-slate-500"}`}>
                      {issue.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[issue.status] || "bg-slate-100"}`}>
                      {issue.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {issue.status === "PENDING" && (
                        <button
                          onClick={() => handleStartProgress(issue.id)}
                          disabled={loading === issue.id}
                          className="px-3 py-1.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-200 disabled:opacity-50"
                        >
                          {loading === issue.id ? "..." : "Start"}
                        </button>
                      )}
                      {(issue.status === "PENDING" || issue.status === "IN_PROGRESS") && (
                        <button
                          onClick={() => handleResolve(issue.id)}
                          disabled={loading === issue.id}
                          className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-200 disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredIssues.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">No issues found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color, alert }: { label: string; value: number; color: string; alert?: boolean }) => (
  <div className={`p-4 rounded-xl border ${alert ? "border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/5" : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"}`}>
    <div className={`w-3 h-3 rounded-full ${color} mb-2`} />
    <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
  </div>
);

const FilterButton = ({
  active,
  onClick,
  label,
  color = "slate",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) => {
  const colorClasses: Record<string, string> = {
    slate: active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    amber: active ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    blue: active ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    emerald: active ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    rose: active ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${colorClasses[color]}`}
    >
      {label}
    </button>
  );
};
