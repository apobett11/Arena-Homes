"use client";

import React, { useState } from "react";
import { ClipboardList, CheckCircle, XCircle, User, Home, FileText } from "lucide-react";
import type { CaretakerApplication } from "@/lib/caretaker/types";
import { approveApplicationCaretaker, rejectApplicationCaretaker } from "@/lib/caretaker/dashboard";

interface ApplicationsPanelProps {
  applications: CaretakerApplication[];
  propertyId: string;
  onDataChange: () => void;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  CARETAKER_APPROVED: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
  CANCELLED: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400",
};

export const ApplicationsPanel = ({ applications, propertyId, onDataChange }: ApplicationsPanelProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("PENDING");

  const filteredApplications = applications.filter((app) => {
    if (filter === "all") return true;
    return app.status === filter;
  });

  const handleApprove = async (appId: string) => {
    setLoading(appId);
    const result = await approveApplicationCaretaker(appId, "Approved by caretaker");
    if (result.success) {
      onDataChange();
    }
    setLoading(null);
  };

  const handleReject = async (appId: string) => {
    setLoading(appId);
    const result = await rejectApplicationCaretaker(appId, "Rejected by caretaker");
    if (result.success) {
      onDataChange();
    }
    setLoading(null);
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "PENDING").length,
    approved: applications.filter((a) => a.status === "CARETAKER_APPROVED" || a.status === "APPROVED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} color="bg-slate-500" />
        <StatCard label="Pending" value={stats.pending} color="bg-amber-500" alert={stats.pending > 0} />
        <StatCard label="Approved" value={stats.approved} color="bg-emerald-500" />
        <StatCard label="Rejected" value={stats.rejected} color="bg-rose-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All" />
        <FilterButton active={filter === "PENDING"} onClick={() => setFilter("PENDING")} label="Pending" color="amber" />
        <FilterButton active={filter === "CARETAKER_APPROVED"} onClick={() => setFilter("CARETAKER_APPROVED")} label="Caretaker Approved" color="blue" />
        <FilterButton active={filter === "APPROVED"} onClick={() => setFilter("APPROVED")} label="Admin Approved" color="emerald" />
        <FilterButton active={filter === "REJECTED"} onClick={() => setFilter("REJECTED")} label="Rejected" color="rose" />
      </div>

      {/* Applications List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredApplications.map((app) => (
          <ApplicationCard
            key={app.id}
            application={app}
            isLoading={loading === app.id}
            onApprove={() => handleApprove(app.id)}
            onReject={() => handleReject(app.id)}
          />
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10">
          <ClipboardList className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">No applications found.</p>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color, alert }: { label: string; value: number; color: string; alert?: boolean }) => (
  <div className={`p-4 rounded-xl border ${alert ? "border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5" : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"}`}>
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

const ApplicationCard = ({
  application,
  isLoading,
  onApprove,
  onReject,
}: {
  application: CaretakerApplication;
  isLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
}) => {
  const canAct = application.status === "PENDING";

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{application.full_name || "Unknown"}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[application.status]}`}>
              {application.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm mb-4">
        {application.registration_number && (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>{application.registration_number}</span>
          </div>
        )}
        {application.phone_number && (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="text-slate-400">Phone:</span>
            <span>{application.phone_number}</span>
          </div>
        )}
        {application.email && (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="text-slate-400">Email:</span>
            <span className="truncate">{application.email}</span>
          </div>
        )}
        {application.unit && (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Home className="w-4 h-4 text-slate-400" />
            <span>
              Requested: Room {application.unit.room_number} ({application.unit.room_type})
            </span>
          </div>
        )}
      </div>

      {application.notes && (
        <div className="mb-4 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm">
          <p className="text-slate-500 dark:text-slate-400">Notes:</p>
          <p className="text-slate-700 dark:text-slate-300">{application.notes}</p>
        </div>
      )}

      {canAct && (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            disabled={isLoading}
            className="flex-1 py-2 px-4 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </button>
          <button
            onClick={onReject}
            disabled={isLoading}
            className="flex-1 py-2 px-4 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 rounded-lg text-sm font-medium hover:bg-rose-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      )}

      {application.caretaker_approved && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          ✓ Approved at caretaker level
        </p>
      )}
    </div>
  );
};
