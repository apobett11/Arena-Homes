"use client";

import React, { useState } from "react";
import { Wrench, CheckCircle, Search } from "lucide-react";
import type { CaretakerIssue } from "@/lib/caretaker/types";
import { markIssueAsResolved, markIssueAsInProgress } from "@/lib/caretaker/dashboard";
import { cn, ck, filterButtonClass, statusChipClass, statusToneFromValue } from "./caretaker-ui";

interface IssuesPanelProps {
  issues: CaretakerIssue[];
  propertyId: string;
  onDataChange: () => void;
}

export const IssuesPanel = ({ issues, onDataChange }: IssuesPanelProps) => {
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIssues = issues.filter((issue) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      issue.title?.toLowerCase().includes(query) ||
      issue.description?.toLowerCase().includes(query) ||
      issue.tenant?.full_name?.toLowerCase().includes(query) ||
      issue.unit?.room_number?.toLowerCase().includes(query) ||
      issue.tenant?.room_number?.toLowerCase().includes(query);
    if (filter === "all") return matchesSearch;
    return issue.status === filter && matchesSearch;
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
      <div>
        <h2 className={ck.display}>Issues & Maintenance</h2>
        <p className={ck.body}>Track tenant issues, urgency, status progression, and resolution actions.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total" value={stats.total} accent="border-primary" />
        <StatCard label="Pending" value={stats.pending} accent="border-amber-500" alert={stats.pending > 0} />
        <StatCard label="In Progress" value={stats.inProgress} accent="border-blue-500" />
        <StatCard label="Resolved" value={stats.resolved} accent="border-emerald-500" />
        <StatCard label="Escalated" value={stats.escalated} accent="border-error" alert={stats.escalated > 0} />
      </div>

      <div className="caretaker-card p-4 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-arena-on-surface-variant" />
          <input
            type="text"
            placeholder="Search issues by title, tenant, room, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(ck.input, "w-full pl-10")}
          />
        </div>
        <div className={ck.tabBar}>
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All Issues" />
        <FilterButton active={filter === "PENDING"} onClick={() => setFilter("PENDING")} label="Pending" />
        <FilterButton active={filter === "IN_PROGRESS"} onClick={() => setFilter("IN_PROGRESS")} label="In Progress" />
        <FilterButton active={filter === "RESOLVED"} onClick={() => setFilter("RESOLVED")} label="Resolved" />
        <FilterButton active={filter === "ESCALATED"} onClick={() => setFilter("ESCALATED")} label="Escalated" />
        </div>
      </div>

      {/* Issues Table */}
      <div className={ck.tableWrap}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={ck.tableHead}>
              <tr>
                <th className={ck.tableHeader}>Issue</th>
                <th className={ck.tableHeader}>Room</th>
                <th className={ck.tableHeader}>Tenant</th>
                <th className={ck.tableHeader}>Priority</th>
                <th className={ck.tableHeader}>Status</th>
                <th className={ck.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-outline-variant/60">
              {filteredIssues.map((issue) => (
                <tr key={issue.id} className={ck.tableRow}>
                  <td className={ck.tableCell}>
                    <div>
                      <p className="font-semibold text-arena-on-surface">{issue.title}</p>
                      {issue.description && (
                        <p className="text-sm text-arena-on-surface-variant line-clamp-1">{issue.description}</p>
                      )}
                    </div>
                  </td>
                  <td className={ck.tableCell}>
                    <span className="caretaker-chip bg-arena-surface-container-high text-arena-on-surface">
                      {issue.unit?.room_number || issue.tenant?.room_number || "N/A"}
                    </span>
                  </td>
                  <td className={cn(ck.tableCell, "text-arena-on-surface-variant")}>
                    {issue.tenant?.full_name || "Unknown"}
                  </td>
                  <td className={ck.tableCell}>
                    <span className={statusChipClass(statusToneFromValue(issue.priority))}>
                      {issue.priority}
                    </span>
                  </td>
                  <td className={ck.tableCell}>
                    <span className={statusChipClass(statusToneFromValue(issue.status))}>
                      {issue.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className={ck.tableCell}>
                    <div className="flex gap-2">
                      {issue.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => handleStartProgress(issue.id)}
                          disabled={loading === issue.id}
                          className={cn(ck.btnInfo, "px-3 py-1.5 min-h-0 text-xs")}
                        >
                          {loading === issue.id ? "..." : "Start"}
                        </button>
                      )}
                      {(issue.status === "PENDING" || issue.status === "IN_PROGRESS") && (
                        <button
                          type="button"
                          onClick={() => handleResolve(issue.id)}
                          disabled={loading === issue.id}
                          className={cn(ck.btnSuccess, "px-3 py-1.5 min-h-0 text-xs")}
                          aria-label="Resolve issue"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Resolve
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
            <Wrench className="w-12 h-12 text-arena-on-surface-variant mx-auto mb-4" />
            <p className={ck.body}>No issues found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, accent, alert }: { label: string; value: number; accent: string; alert?: boolean }) => (
  <div className={cn(ck.statCard, "border-l-4", accent, alert && "ring-1 ring-error/20")}>
    <p className={ck.sectionTitle}>{label}</p>
    <p className="caretaker-display-lg text-arena-on-surface mt-1">{value}</p>
  </div>
);

const FilterButton = ({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={filterButtonClass(active)}
    >
      {label}
    </button>
  );
};
