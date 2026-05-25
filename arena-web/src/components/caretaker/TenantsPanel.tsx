"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ClipboardList,
  Eye,
  FileText,
  Home,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";
import type {
  CaretakerApplication,
  CaretakerIssue,
  CaretakerLease,
  CaretakerTenant,
  CaretakerUnit,
} from "@/lib/caretaker/types";
import { forwardCaretakerIssuesToAdmin } from "@/lib/caretaker/dashboard";
import { cn, ck, filterButtonClass, statusChipClass, statusToneFromValue } from "./caretaker-ui";

interface TenantsPanelProps {
  tenants: CaretakerTenant[];
  units: CaretakerUnit[];
  leases?: CaretakerLease[];
  issues?: CaretakerIssue[];
  applications?: CaretakerApplication[];
  propertyId: string;
  onDataChange?: () => void;
}

type TenantModal = "view" | "lease" | "issues" | "applications" | null;

const tenantFilters = [
  { value: "all", label: "All tenants" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "MOVED_OUT", label: "Moved out" },
  { value: "SUSPENDED", label: "Suspended" },
];

export const TenantsPanel = ({
  tenants,
  units,
  leases = [],
  issues = [],
  applications = [],
  onDataChange,
}: TenantsPanelProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<CaretakerTenant | null>(null);
  const [activeModal, setActiveModal] = useState<TenantModal>(null);

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

  const openTenantModal = (tenant: CaretakerTenant, modal: Exclude<TenantModal, null>) => {
    setSelectedTenant(tenant);
    setActiveModal(modal);
    setOpenMenuId(null);
  };

  const closeModal = () => {
    setSelectedTenant(null);
    setActiveModal(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={ck.display}>Tenants Registry</h2>
        <p className={ck.body}>Oversee residents, unit relationships, lease health, and tenant-specific workflows across {units.length} unit(s).</p>
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
                <TenantRow
                  key={tenant.id}
                  tenant={tenant}
                  menuOpen={openMenuId === tenant.id}
                  onToggleMenu={() => setOpenMenuId((current) => (current === tenant.id ? null : tenant.id))}
                  onOpenModal={openTenantModal}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredTenants.map((tenant) => (
          <TenantCard
            key={tenant.id}
            tenant={tenant}
            menuOpen={openMenuId === tenant.id}
            onToggleMenu={() => setOpenMenuId((current) => (current === tenant.id ? null : tenant.id))}
            onOpenModal={openTenantModal}
          />
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <div className={ck.empty}>
          <Users className="w-12 h-12 text-arena-on-surface-variant mx-auto mb-4" />
          <p className={ck.body}>No tenants found for this search or filter.</p>
        </div>
      )}

      {selectedTenant && activeModal === "view" && (
        <TenantDetailsModal tenant={selectedTenant} onClose={closeModal} />
      )}
      {selectedTenant && activeModal === "lease" && (
        <TenantLeaseModal
          tenant={selectedTenant}
          leases={leases.filter((lease) => lease.tenant_id === selectedTenant.id)}
          onClose={closeModal}
        />
      )}
      {selectedTenant && activeModal === "issues" && (
      <TenantIssuesModal
          tenant={selectedTenant}
          issues={issues.filter((issue) => issue.tenant_id === selectedTenant.id || issue.tenant_user_id === selectedTenant.user_id)}
          onClose={closeModal}
          onDataChange={onDataChange}
        />
      )}
      {selectedTenant && activeModal === "applications" && (
        <TenantApplicationsModal
          tenant={selectedTenant}
          applications={applications.filter((app) => isTenantApplication(selectedTenant, app))}
          onClose={closeModal}
        />
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

const TenantRow = ({
  tenant,
  menuOpen,
  onToggleMenu,
  onOpenModal,
}: {
  tenant: CaretakerTenant;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onOpenModal: (tenant: CaretakerTenant, modal: Exclude<TenantModal, null>) => void;
}) => (
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
      {formatDate(tenant.move_in_date)}
    </td>
    <td className={ck.tableCell}>
      {tenant.lease ? (
        <div>
          <span className={statusChipClass(statusToneFromValue(tenant.lease.status))}>{tenant.lease.status}</span>
          <p className="text-xs text-arena-on-surface-variant mt-1">
            Until {formatDate(tenant.lease.end_date)}
          </p>
        </div>
      ) : (
        <span className={statusChipClass("neutral")}>No lease</span>
      )}
    </td>
    <td className={cn(ck.tableCell, "text-right")}>
      <TenantActions tenant={tenant} open={menuOpen} onToggle={onToggleMenu} onOpenModal={onOpenModal} alignRight />
    </td>
  </tr>
);

const TenantCard = ({
  tenant,
  menuOpen,
  onToggleMenu,
  onOpenModal,
}: {
  tenant: CaretakerTenant;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onOpenModal: (tenant: CaretakerTenant, modal: Exclude<TenantModal, null>) => void;
}) => (
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
      {tenant.move_in_date && <IconLine icon={Calendar} text={`Since ${formatDate(tenant.move_in_date)}`} />}
    </div>

    <div className="mt-4 pt-4 border-t border-arena-outline-variant/40">
      <TenantActions tenant={tenant} open={menuOpen} onToggle={onToggleMenu} onOpenModal={onOpenModal} fullWidth />
    </div>
  </div>
);

const TenantActions = ({
  tenant,
  open,
  onToggle,
  onOpenModal,
  alignRight,
  fullWidth,
}: {
  tenant: CaretakerTenant;
  open: boolean;
  onToggle: () => void;
  onOpenModal: (tenant: CaretakerTenant, modal: Exclude<TenantModal, null>) => void;
  alignRight?: boolean;
  fullWidth?: boolean;
}) => (
  <div className={cn("relative inline-block text-left", fullWidth && "w-full")}>
    <button type="button" onClick={onToggle} className={cn(ck.btnManage, fullWidth ? "w-full" : "px-3")}>
      Actions
      <ChevronDown className="w-4 h-4" />
    </button>
    {open && (
      <div className={cn("absolute z-40 mt-2 w-56 rounded-xl border border-arena-outline-variant/70 bg-white p-2 text-left shadow-xl", alignRight && "right-0")}>
        <ActionButton icon={Eye} label="View tenant" onClick={() => onOpenModal(tenant, "view")} />
        <ActionButton icon={FileText} label="Lease" onClick={() => onOpenModal(tenant, "lease")} />
        <ActionButton icon={AlertTriangle} label="Issues" onClick={() => onOpenModal(tenant, "issues")} />
        <ActionButton icon={ClipboardList} label="Applications" onClick={() => onOpenModal(tenant, "applications")} />
        <Link href="/caretaker/dashboard?tab=applications" className={actionItemClass()}>
          <Home className="w-4 h-4" />
          Assign unit
        </Link>
        <Link href="/caretaker/messages" className={actionItemClass()}>
          <MessageSquare className="w-4 h-4" />
          Contact tenant
        </Link>
      </div>
    )}
  </div>
);

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) => (
  <button type="button" onClick={onClick} className={actionItemClass()}>
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

function actionItemClass() {
  return "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700";
}

const TenantDetailsModal = ({ tenant, onClose }: { tenant: CaretakerTenant; onClose: () => void }) => (
  <Modal title={tenant.full_name || "Tenant details"} subtitle="Tenant profile and assignment" onClose={onClose}>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Info label="Status" value={tenant.status} />
      <Info label="Room" value={tenant.room_number || tenant.unit?.room_number || "N/A"} />
      <Info label="Email" value={tenant.email || "Not set"} />
      <Info label="Phone" value={tenant.phone_number || "Not set"} />
      <Info label="WhatsApp" value={tenant.whatsapp_number || "Not set"} />
      <Info label="Registration" value={tenant.registration_number || "Not set"} />
      <Info label="Move-in" value={formatDate(tenant.move_in_date)} />
      <Info label="Move-out" value={formatDate(tenant.move_out_date)} />
    </div>
  </Modal>
);

const TenantLeaseModal = ({
  tenant,
  leases,
  onClose,
}: {
  tenant: CaretakerTenant;
  leases: CaretakerLease[];
  onClose: () => void;
}) => (
  <Modal title="Lease" subtitle={tenant.full_name || "Tenant"} onClose={onClose}>
    {leases.length === 0 ? (
      <EmptyState text="No lease records found for this tenant." />
    ) : (
      <div className="space-y-3">
        {leases.map((lease) => (
          <div key={lease.id} className="rounded-xl border border-arena-outline-variant/60 bg-arena-surface-container-lowest p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-arena-on-surface">{lease.lease_number || "Lease"}</p>
                <p className={ck.body}>Room {lease.unit?.room_number || tenant.room_number || "N/A"}</p>
              </div>
              <span className={statusChipClass(statusToneFromValue(lease.status))}>{lease.status}</span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Info label="Period" value={`${formatDate(lease.start_date)} - ${formatDate(lease.end_date)}`} />
              <Info label="Rent" value={`KES ${Number(lease.rent_amount || 0).toLocaleString()}`} />
              <Info label="Deposit" value={lease.deposit_amount ? `KES ${lease.deposit_amount.toLocaleString()}` : "Not set"} />
            </div>
            {lease.pdf_url && (
              <a href={lease.pdf_url} target="_blank" rel="noopener noreferrer" className={cn(ck.btnGhost, "mt-3")}>
                <FileText className="w-4 h-4" />
                Open PDF
              </a>
            )}
          </div>
        ))}
      </div>
    )}
  </Modal>
);

const TenantIssuesModal = ({
  tenant,
  issues,
  onClose,
  onDataChange,
}: {
  tenant: CaretakerTenant;
  issues: CaretakerIssue[];
  onClose: () => void;
  onDataChange?: () => void;
}) => {
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const forwardableIssues = issues.filter((issue) => !isForwarded(issue));

  const toggleIssue = (issueId: string) => {
    setSelectedIssueIds((current) =>
      current.includes(issueId) ? current.filter((id) => id !== issueId) : [...current, issueId]
    );
  };

  const handleForward = async () => {
    if (selectedIssueIds.length === 0) {
      setFeedback("Select at least one issue to forward.");
      return;
    }

    setLoading(true);
    setFeedback(null);
    const result = await forwardCaretakerIssuesToAdmin(selectedIssueIds);
    if (result.success) {
      setFeedback(`${result.forwardedCount ?? selectedIssueIds.length} issue(s) forwarded to Admin.`);
      setSelectedIssueIds([]);
      onDataChange?.();
    } else {
      setFeedback(result.error || "Could not forward issues.");
    }
    setLoading(false);
  };

  return (
    <Modal title="Tenant issues" subtitle={tenant.full_name || "Tenant"} onClose={onClose}>
      {feedback && (
        <div className="mb-3 rounded-xl border border-arena-outline-variant/60 bg-arena-surface-container-low p-3 text-sm text-arena-on-surface-variant">
          {feedback}
        </div>
      )}
      {issues.length === 0 ? (
        <EmptyState text="No issues found for this tenant." />
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => {
            const forwarded = isForwarded(issue);
            return (
              <label key={issue.id} className="flex gap-3 rounded-xl border border-arena-outline-variant/60 bg-arena-surface-container-lowest p-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  disabled={forwarded || loading}
                  checked={selectedIssueIds.includes(issue.id)}
                  onChange={() => toggleIssue(issue.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-arena-on-surface">{issue.title}</span>
                    <span className={statusChipClass(statusToneFromValue(issue.status))}>
                      {forwarded ? "Forwarded" : issue.status.replace("_", " ")}
                    </span>
                    <span className={statusChipClass(statusToneFromValue(issue.priority))}>{issue.priority}</span>
                  </span>
                  {issue.description && <span className="mt-1 block text-sm text-arena-on-surface-variant">{issue.description}</span>}
                </span>
              </label>
            );
          })}
        </div>
      )}
      <button
        type="button"
        onClick={handleForward}
        disabled={loading || selectedIssueIds.length === 0 || forwardableIssues.length === 0}
        className={cn(ck.btnPrimary, "mt-4 w-full")}
      >
        <Send className="w-4 h-4" />
        {loading ? "Forwarding..." : "Forward selected to Admin"}
      </button>
    </Modal>
  );
};

const TenantApplicationsModal = ({
  tenant,
  applications,
  onClose,
}: {
  tenant: CaretakerTenant;
  applications: CaretakerApplication[];
  onClose: () => void;
}) => (
  <Modal title="Applications" subtitle={tenant.full_name || "Tenant"} onClose={onClose}>
    {applications.length === 0 ? (
      <EmptyState text="No related applications found for this tenant." />
    ) : (
      <div className="space-y-3">
        {applications.map((app) => (
          <div key={app.id} className="rounded-xl border border-arena-outline-variant/60 bg-arena-surface-container-lowest p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-arena-on-surface">{app.full_name || "Applicant"}</p>
                <p className={ck.body}>{app.email || app.phone_number || "No contact provided"}</p>
              </div>
              <span className={statusChipClass(statusToneFromValue(app.status))}>{app.status}</span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Info label="Requested unit" value={app.unit?.room_number || "TBD"} />
              <Info label="Registration" value={app.registration_number || "Not set"} />
              <Info label="Created" value={formatDate(app.created_at)} />
            </div>
          </div>
        ))}
      </div>
    )}
  </Modal>
);

const Modal = ({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <div className={ck.modalBackdrop} role="dialog" aria-modal="true">
    <div className={ck.modalPanel}>
      <div className="flex items-start justify-between border-b border-arena-outline-variant/60 p-4">
        <div>
          <h2 className={ck.headline}>{title}</h2>
          <p className={ck.body}>{subtitle}</p>
        </div>
        <button type="button" onClick={onClose} className={ck.btnGhost} aria-label="Close modal">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto p-4">{children}</div>
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

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className={ck.sectionTitle}>{label}</p>
    <p className="mt-1 break-words text-sm font-semibold text-arena-on-surface">{value}</p>
  </div>
);

const IconLine = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="flex items-center gap-2 text-arena-on-surface-variant min-w-0">
    <Icon className="w-4 h-4 shrink-0 text-arena-on-surface-variant" />
    <span className="truncate">{text}</span>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-xl border border-arena-outline-variant/60 bg-arena-surface-container-lowest p-4 text-sm text-arena-on-surface-variant">
    {text}
  </div>
);

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString();
}

function isForwarded(issue: CaretakerIssue) {
  return issue.target_role === "ADMIN" && issue.sent_to === "ADMIN";
}

function isTenantApplication(tenant: CaretakerTenant, application: CaretakerApplication) {
  return Boolean(
    (tenant.user_id && application.applicant_user_id === tenant.user_id) ||
      (tenant.email && application.email === tenant.email) ||
      (tenant.registration_number && application.registration_number === tenant.registration_number)
  );
}
