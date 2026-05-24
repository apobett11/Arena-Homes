"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, FileText, Mail, MessageSquare, Phone, Search, Users } from "lucide-react";
import type { CaretakerTenant, CaretakerUnit } from "@/lib/caretaker/types";
import { cn, ck, filterButtonClass, statusChipClass, statusToneFromValue } from "./caretaker-ui";

interface TenantsPanelProps {
  tenants: CaretakerTenant[];
  units: CaretakerUnit[];
  propertyId: string;
}

const tenantFilters = [
  { value: "all", label: "All tenants" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "MOVED_OUT", label: "Moved out" },
  { value: "SUSPENDED", label: "Suspended" },
];

export const TenantsPanel = ({ tenants, units }: TenantsPanelProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filteredTenants = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return tenants.filter((tenant) => {
      const matchesSearch =
        !query ||
        tenant.full_name?.toLowerCase().includes(query) ||
        tenant.room_number?.toLowerCase().includes(query) ||
        tenant.unit?.room_number?.toLowerCase().includes(query) ||
        tenant.registration_number?.toLowerCase().includes(query) ||
        tenant.email?.toLowerCase().includes(query) ||
        tenant.phone_number?.toLowerCase().includes(query);

      return matchesSearch && (filter === "all" || tenant.status === filter);
    });
  }, [filter, searchTerm, tenants]);

  const stats = {
    total: tenants.length,
    active: tenants.filter((t) => t.status === "ACTIVE").length,
    pending: tenants.filter((t) => t.status === "PENDING").length,
    movedOut: tenants.filter((t) => t.status === "MOVED_OUT").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={ck.display}>Tenants Registry</h2>
        <p className={ck.body}>Oversee residents, unit relationships, lease health, and communication across {units.length} unit(s).</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total tenants" value={stats.total} accent="border-primary" />
        <StatCard label="Active" value={stats.active} accent="border-emerald-500" />
        <StatCard label="Pending" value={stats.pending} accent="border-amber-500" />
        <StatCard label="Moved out" value={stats.movedOut} accent="border-slate-400" />
      </div>

      <div className="caretaker-card p-4 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-arena-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by name, room, registration, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(ck.input, "w-full pl-10")}
          />
        </div>
        <div className={ck.tabBar}>
          {tenantFilters.map((item) => (
            <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={filterButtonClass(filter === item.value)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn(ck.tableWrap, "hidden md:block")}>
        <div className="caretaker-table-scroll">
          <table className="w-full text-left border-collapse">
            <thead className={ck.tableHead}>
              <tr>
                <th className={ck.tableHeader}>Tenant</th>
                <th className={ck.tableHeader}>Status</th>
                <th className={ck.tableHeader}>Unit</th>
                <th className={ck.tableHeader}>Contact</th>
                <th className={ck.tableHeader}>Move-in</th>
                <th className={ck.tableHeader}>Lease</th>
                <th className={cn(ck.tableHeader, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-outline-variant/60">
              {filteredTenants.map((tenant) => (
                <TenantRow key={tenant.id} tenant={tenant} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredTenants.map((tenant) => (
          <TenantCard key={tenant.id} tenant={tenant} />
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <div className={ck.empty}>
          <Users className="w-12 h-12 text-arena-on-surface-variant mx-auto mb-4" />
          <p className={ck.body}>No tenants found for this search or filter.</p>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, accent }: { label: string; value: number; accent: string }) => (
  <div className={cn(ck.statCard, "border-l-4", accent)}>
    <p className={ck.sectionTitle}>{label}</p>
    <p className="caretaker-display-lg text-arena-on-surface mt-1">{value}</p>
  </div>
);

const TenantRow = ({ tenant }: { tenant: CaretakerTenant }) => (
  <tr className={ck.tableRow}>
    <td className={ck.tableCell}>
      <div className="flex items-center gap-3">
        <Avatar name={tenant.full_name} />
        <div>
          <p className="font-bold">{tenant.full_name || "Unknown tenant"}</p>
          <p className="caretaker-label-caps text-arena-on-surface-variant">
            ID: {tenant.registration_number || tenant.id.slice(0, 8)}
          </p>
        </div>
      </div>
    </td>
    <td className={ck.tableCell}>
      <span className={statusChipClass(statusToneFromValue(tenant.status))}>{tenant.status}</span>
    </td>
    <td className={ck.tableCell}>Room {tenant.room_number || tenant.unit?.room_number || "N/A"}</td>
    <td className={ck.tableCell}>
      <div className="space-y-1 text-arena-on-surface-variant">
        {tenant.phone_number && <IconLine icon={Phone} text={tenant.phone_number} />}
        {tenant.email && <IconLine icon={Mail} text={tenant.email} />}
      </div>
    </td>
    <td className={cn(ck.tableCell, "text-arena-on-surface-variant")}>
      {tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString() : "Not set"}
    </td>
    <td className={ck.tableCell}>
      {tenant.lease ? (
        <div>
          <span className={statusChipClass(statusToneFromValue(tenant.lease.status))}>{tenant.lease.status}</span>
          <p className="text-xs text-arena-on-surface-variant mt-1">
            Until {new Date(tenant.lease.end_date).toLocaleDateString()}
          </p>
        </div>
      ) : (
        <span className={statusChipClass("neutral")}>No lease</span>
      )}
    </td>
    <td className={cn(ck.tableCell, "text-right")}>
      <Link href="/caretaker/messages" className={cn(ck.btnInfo, "px-3")}>
        <MessageSquare className="w-4 h-4" />
        Message
      </Link>
    </td>
  </tr>
);

const TenantCard = ({ tenant }: { tenant: CaretakerTenant }) => (
  <div className={ck.card}>
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={tenant.full_name} />
        <div className="min-w-0">
          <h3 className="font-semibold text-arena-on-surface truncate">{tenant.full_name || "Unknown tenant"}</h3>
          <p className={ck.body}>Room {tenant.room_number || tenant.unit?.room_number || "N/A"}</p>
        </div>
      </div>
      <span className={statusChipClass(statusToneFromValue(tenant.status))}>{tenant.status}</span>
    </div>

    <div className="space-y-2 text-sm">
      {tenant.registration_number && <IconLine icon={FileText} text={tenant.registration_number} />}
      {tenant.phone_number && <IconLine icon={Phone} text={tenant.phone_number} />}
      {tenant.email && <IconLine icon={Mail} text={tenant.email} />}
      {tenant.move_in_date && <IconLine icon={Calendar} text={`Since ${new Date(tenant.move_in_date).toLocaleDateString()}`} />}
    </div>

    {tenant.lease && (
      <div className="mt-4 pt-4 border-t border-arena-outline-variant/40">
        <div className="flex items-center justify-between text-sm">
          <span className={ck.sectionTitle}>Lease</span>
          <span className={statusChipClass(statusToneFromValue(tenant.lease.status))}>{tenant.lease.status}</span>
        </div>
        <p className="text-xs text-arena-on-surface-variant mt-1">
          Until {new Date(tenant.lease.end_date).toLocaleDateString()}
        </p>
      </div>
    )}

    <div className="mt-4 pt-4 border-t border-arena-outline-variant/40">
      <Link href="/caretaker/messages" className={cn(ck.btnInfo, "w-full")}>
        <MessageSquare className="w-4 h-4" />
        Message tenant
      </Link>
    </div>
  </div>
);

const Avatar = ({ name }: { name?: string | null }) => {
  const initials =
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "T";

  return (
    <div className="h-10 w-10 rounded-full bg-arena-surface-container-highest flex items-center justify-center text-primary font-bold shrink-0">
      {initials}
    </div>
  );
};

const IconLine = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="flex items-center gap-2 text-arena-on-surface-variant min-w-0">
    <Icon className="w-4 h-4 shrink-0 text-arena-on-surface-variant" />
    <span className="truncate">{text}</span>
  </div>
);
