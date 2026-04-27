"use client";

import React, { useState } from "react";
import { Users, Mail, Phone, Home, Calendar, FileText, MessageSquare } from "lucide-react";
import type { CaretakerTenant, CaretakerUnit } from "@/lib/caretaker/types";

interface TenantsPanelProps {
  tenants: CaretakerTenant[];
  units: CaretakerUnit[];
  propertyId: string;
}

export const TenantsPanel = ({ tenants, units }: TenantsPanelProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.registration_number?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "all") return matchesSearch;
    return tenant.status === filter && matchesSearch;
  });

  const stats = {
    total: tenants.length,
    active: tenants.filter((t) => t.status === "ACTIVE").length,
    pending: tenants.filter((t) => t.status === "PENDING").length,
    movedOut: tenants.filter((t) => t.status === "MOVED_OUT").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} color="bg-slate-500" />
        <StatCard label="Active" value={stats.active} color="bg-emerald-500" />
        <StatCard label="Pending" value={stats.pending} color="bg-amber-500" />
        <StatCard label="Moved Out" value={stats.movedOut} color="bg-slate-400" />
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, room, or registration number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTenants.map((tenant) => (
          <TenantCard key={tenant.id} tenant={tenant} />
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">No tenants found.</p>
        </div>
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

const TenantCard = ({ tenant }: { tenant: CaretakerTenant }) => {
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    INACTIVE: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400",
    SUSPENDED: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
    MOVED_OUT: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400",
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{tenant.full_name || "Unknown"}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[tenant.status] || statusColors.PENDING}`}>
              {tenant.status}
            </span>
          </div>
        </div>
        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-sm font-medium">
          Room {tenant.room_number || tenant.unit?.room_number || "N/A"}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        {tenant.registration_number && (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>{tenant.registration_number}</span>
          </div>
        )}
        {tenant.phone_number && (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Phone className="w-4 h-4 text-slate-400" />
            <span>{tenant.phone_number}</span>
          </div>
        )}
        {tenant.email && (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="truncate">{tenant.email}</span>
          </div>
        )}
        {tenant.move_in_date && (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Since {new Date(tenant.move_in_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {tenant.lease && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Lease:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[tenant.lease.status] || statusColors.PENDING}`}>
              {tenant.lease.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Until {new Date(tenant.lease.end_date).toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 flex gap-2">
        <button className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Message
        </button>
      </div>
    </div>
  );
};
