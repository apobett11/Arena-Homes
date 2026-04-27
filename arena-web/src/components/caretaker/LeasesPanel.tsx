"use client";

import React, { useState } from "react";
import { FileText, Download, Calendar, User, Home, Eye } from "lucide-react";
import type { CaretakerLease, CaretakerTenant } from "@/lib/caretaker/types";

interface LeasesPanelProps {
  leases: CaretakerLease[];
  propertyId: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  COMPLETED: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400",
  TERMINATED: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
};

export const LeasesPanel = ({ leases, propertyId }: LeasesPanelProps) => {
  const [filter, setFilter] = useState<string>("all");

  const filteredLeases = leases.filter((lease) => {
    if (filter === "all") return true;
    return lease.status === filter;
  });

  const stats = {
    total: leases.length,
    pending: leases.filter((l) => l.status === "PENDING").length,
    active: leases.filter((l) => l.status === "ACTIVE").length,
    completed: leases.filter((l) => l.status === "COMPLETED").length,
    terminated: leases.filter((l) => l.status === "TERMINATED").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total" value={stats.total} color="bg-slate-500" />
        <StatCard label="Pending" value={stats.pending} color="bg-amber-500" />
        <StatCard label="Active" value={stats.active} color="bg-emerald-500" />
        <StatCard label="Completed" value={stats.completed} color="bg-slate-400" />
        <StatCard label="Terminated" value={stats.terminated} color="bg-rose-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All" />
        <FilterButton active={filter === "PENDING"} onClick={() => setFilter("PENDING")} label="Pending" color="amber" />
        <FilterButton active={filter === "ACTIVE"} onClick={() => setFilter("ACTIVE")} label="Active" color="emerald" />
        <FilterButton active={filter === "COMPLETED"} onClick={() => setFilter("COMPLETED")} label="Completed" color="slate" />
        <FilterButton active={filter === "TERMINATED"} onClick={() => setFilter("TERMINATED")} label="Terminated" color="rose" />
      </div>

      {/* Leases Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Lease #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tenant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Room</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Period</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Rent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {filteredLeases.map((lease) => (
                <tr key={lease.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900 dark:text-white">{lease.lease_number || "N/A"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {lease.tenant?.full_name || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-sm">
                      {lease.unit?.room_number || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(lease.start_date).toLocaleDateString()} - {new Date(lease.end_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                    KES {lease.rent_amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[lease.status] || statusColors.PENDING}`}>
                      {lease.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {lease.pdf_url && (
                        <a
                          href={lease.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="View PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLeases.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">No leases found.</p>
          </div>
        )}
      </div>
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
