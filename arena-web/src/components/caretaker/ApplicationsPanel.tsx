"use client";

import React, { useState, useEffect } from "react";
import { ClipboardList, CheckCircle, XCircle, User, Home, FileText, Search } from "lucide-react";
import type { CaretakerApplication, CaretakerUnit } from "@/lib/caretaker/types";
import { getSupabaseClient } from "@/lib/supabase/client";
import { cn, ck, filterButtonClass, statusChipClass, statusToneFromValue } from "./caretaker-ui";

interface ApplicationsPanelProps {
  applications: CaretakerApplication[];
  propertyId: string;
  onDataChange: () => void;
}

interface ApplicationRpcResult {
  success?: boolean;
  error?: string;
  emailQueued?: boolean;
  emailTriggerResult?: {
    success?: boolean;
  };
}

type ApplicationRpc = (
  fn: string,
  args: Record<string, unknown>
) => Promise<{ data: ApplicationRpcResult | null; error: Error | null }>;

export const ApplicationsPanel = ({ applications, propertyId, onDataChange }: ApplicationsPanelProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("WAITING");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState<CaretakerApplication | null>(null);
  const [units, setUnits] = useState<CaretakerUnit[]>([]);

  const filteredApplications = applications.filter((app) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      app.full_name?.toLowerCase().includes(query) ||
      app.email?.toLowerCase().includes(query) ||
      app.phone_number?.toLowerCase().includes(query) ||
      app.registration_number?.toLowerCase().includes(query) ||
      app.unit?.room_number?.toLowerCase().includes(query);
    if (filter === "all") return matchesSearch;
    return app.status === filter && matchesSearch;
  });

  // Load available units for assignment (must have no tenant assigned)
  useEffect(() => {
    async function loadUnits() {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('units')
        .select('id, room_number, room_type, availability_status, status, current_tenant_id, base_price, deposit_amount')
        .eq('property_id', propertyId)
        .is('current_tenant_id', null)  // Only units with NO tenant assigned
        .eq('availability_status', 'AVAILABLE')  // Must be explicitly available
        .order('room_number', { ascending: true });
      setUnits(data || []);
    }
    loadUnits();
  }, [propertyId]);

  const handleAccept = async (appId: string, unitId: string) => {
    setLoading(appId);
    const supabase = getSupabaseClient();
    const rpc = supabase.rpc as unknown as ApplicationRpc;
    
    try {
      const { data, error } = await rpc('accept_application', {
        p_application_id: appId,
        p_assigned_unit_id: unitId,
        p_start_date: new Date().toISOString().split('T')[0],
        p_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      
      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to accept application');
      }

      // Show success with email status - approval already complete even if email fails later
      let message = 'Application accepted. Tenant setup email has been queued';
      if (data?.emailTriggerResult?.success === false) {
        message += ' (delivery will retry automatically)';
      } else if (data?.emailQueued) {
        message += '/sent';
      }
      alert(message);

      setSelectedApp(null);
      onDataChange();  // Refresh parent data
      
      // Refresh units list (this unit is now occupied)
      const { data: refreshedUnits } = await supabase
        .from('units')
        .select('id, room_number, room_type, availability_status, status, current_tenant_id, base_price, deposit_amount')
        .eq('property_id', propertyId)
        .is('current_tenant_id', null)
        .eq('availability_status', 'AVAILABLE')
        .order('room_number', { ascending: true });
      setUnits(refreshedUnits || []);
      
    } catch (err) {
      console.error('Error accepting application:', err);
      alert(err instanceof Error ? err.message : 'Failed to accept application');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (appId: string, reason?: string) => {
    setLoading(appId);
    const supabase = getSupabaseClient();
    const rpc = supabase.rpc as unknown as ApplicationRpc;
    const { data, error } = await rpc('reject_application', {
      p_application_id: appId,
      p_reason: reason
    });
    if (!error && data?.success) {
      setSelectedApp(null);
      onDataChange();
    }
    setLoading(null);
  };

  const stats = {
    total: applications.length,
    waiting: applications.filter((a) => a.status === "WAITING").length,
    accepted: applications.filter((a) => a.status === "ACCEPTED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={ck.display}>Applications</h2>
        <p className={ck.body}>Review applicants, verify details, approve with safe unit assignment, or reject with a reason.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} accent="border-primary" />
        <StatCard label="Waiting" value={stats.waiting} accent="border-amber-500" alert={stats.waiting > 0} />
        <StatCard label="Accepted" value={stats.accepted} accent="border-emerald-500" />
        <StatCard label="Rejected" value={stats.rejected} accent="border-error" />
      </div>

      <div className="caretaker-card p-4 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-arena-on-surface-variant" />
          <input
            type="text"
            placeholder="Search applicants by name, email, phone, unit, or registration..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(ck.input, "w-full pl-10")}
          />
        </div>
        <div className={ck.tabBar}>
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All" />
        <FilterButton active={filter === "WAITING"} onClick={() => setFilter("WAITING")} label="Waiting" />
        <FilterButton active={filter === "ACCEPTED"} onClick={() => setFilter("ACCEPTED")} label="Accepted" />
        <FilterButton active={filter === "REJECTED"} onClick={() => setFilter("REJECTED")} label="Rejected" />
        </div>
      </div>

      {/* Applications List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredApplications.map((app) => (
          <ApplicationCard
            key={app.id}
            application={app}
            isLoading={loading === app.id}
            onViewDetails={() => setSelectedApp(app)}
          />
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <div className={ck.empty}>
          <ClipboardList className="w-12 h-12 text-arena-on-surface-variant mx-auto mb-4" />
          <p className={ck.body}>No applications found.</p>
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          units={units}
          onClose={() => setSelectedApp(null)}
          onAccept={handleAccept}
          onReject={handleReject}
          isLoading={loading === selectedApp.id}
        />
      )}
    </div>
  );
};

const StatCard = ({ label, value, accent, alert }: { label: string; value: number; accent: string; alert?: boolean }) => (
  <div className={cn(ck.statCard, "border-l-4", accent, alert && "ring-1 ring-amber-300/60")}>
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

const ApplicationCard = ({
  application,
  isLoading,
  onViewDetails,
}: {
  application: CaretakerApplication;
  isLoading: boolean;
  onViewDetails: () => void;
}) => {
  return (
    <div className={ck.card}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={ck.iconTile}>
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-arena-on-surface">{application.full_name || "Unknown"}</h3>
            <span className={statusChipClass(statusToneFromValue(application.status))}>{application.status}</span>
          </div>
        </div>
        <span className="text-xs text-arena-on-surface-variant">
          {new Date(application.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="space-y-2 text-sm mb-4">
        {application.registration_number && (
          <div className="flex items-center gap-2 text-arena-on-surface-variant">
            <FileText className="w-4 h-4" />
            <span>{application.registration_number}</span>
          </div>
        )}
        {application.phone_number && (
          <div className="flex items-center gap-2 text-arena-on-surface-variant">
            <span className={ck.sectionTitle}>Phone</span>
            <span>{application.phone_number}</span>
          </div>
        )}
        {application.email && (
          <div className="flex items-center gap-2 text-arena-on-surface-variant">
            <span className={ck.sectionTitle}>Email</span>
            <span className="truncate">{application.email}</span>
          </div>
        )}
        {application.unit && (
          <div className="flex items-center gap-2 text-arena-on-surface-variant">
            <Home className="w-4 h-4" />
            <span>Requested: Room {application.unit.room_number} ({application.unit.room_type})</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onViewDetails}
        disabled={isLoading}
        className={cn(ck.btnManage, "w-full")}
      >
        {isLoading ? 'Processing...' : 'View Details & Manage'}
      </button>
    </div>
  );
};

const ApplicationDetailModal = ({
  application,
  units,
  onClose,
  onAccept,
  onReject,
  isLoading,
}: {
  application: CaretakerApplication;
  units: CaretakerUnit[];
  onClose: () => void;
  onAccept: (appId: string, unitId: string) => Promise<void>;
  onReject: (appId: string, reason?: string) => Promise<void>;
  isLoading: boolean;
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState<'overview' | 'actions'>('overview');

  const isWaiting = application.status === 'WAITING';
  const isAccepted = application.status === 'ACCEPTED';
  const isRejected = application.status === 'REJECTED';

  return (
    <div className={ck.modalBackdrop}>
      <div className={ck.modalPanel}>
        {/* Header */}
        <div className="p-6 border-b border-arena-outline-variant/50 flex items-start justify-between">
          <div>
            <h2 className={ck.headline}>{application.full_name}</h2>
            <p className={ck.body}>Application Details</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-arena-surface-container-low rounded-xl text-arena-on-surface-variant">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-arena-outline-variant/50">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 text-sm font-semibold ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-arena-on-surface-variant'}`}
          >
            Overview
          </button>
          {isWaiting && (
            <button
              type="button"
              onClick={() => setActiveTab('actions')}
              className={`flex-1 py-3 text-sm font-semibold ${activeTab === 'actions' ? 'text-primary border-b-2 border-primary' : 'text-arena-on-surface-variant'}`}
            >
              Actions
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' ? (
            <div className="space-y-6">
              {/* Status */}
              <div className="p-4 bg-arena-surface-container-low rounded-xl">
                <p className={ck.sectionTitle}>Application Status</p>
                <span className={statusChipClass(statusToneFromValue(application.status))}>
                  {application.status}
                </span>
              </div>

              {/* Applicant Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-arena-on-surface flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Applicant Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className={ck.sectionTitle}>Email</p>
                    <p className="font-medium">{application.email}</p>
                  </div>
                  <div>
                    <p className={ck.sectionTitle}>Phone</p>
                    <p className="font-medium">{application.phone_number}</p>
                  </div>
                  {application.whatsapp_number && (
                    <div>
                      <p className={ck.sectionTitle}>WhatsApp</p>
                      <p className="font-medium">{application.whatsapp_number}</p>
                    </div>
                  )}
                  {application.registration_number && (
                    <div>
                      <p className={ck.sectionTitle}>Registration No</p>
                      <p className="font-medium">{application.registration_number}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Unit Info */}
              {application.unit && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-arena-on-surface flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Requested Unit
                  </h3>
                  <div className="p-4 bg-arena-surface-container-low rounded-xl">
                    <p className="font-medium">Room {application.unit.room_number}</p>
                    <p className={ck.body}>{application.unit.room_type}</p>
                  </div>
                </div>
              )}

              {/* Status Messages */}
              {isAccepted && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <h3 className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    Application Accepted
                  </h3>
                  <p className={ck.body}>
                    The applicant has been sent a secure setup link via email to create their password and activate their tenant dashboard.
                  </p>
                </div>
              )}
              
              {isRejected && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
                  <h3 className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4" />
                    Application Rejected
                  </h3>
                  {application.rejection_reason && (
                    <p className={ck.body}>
                      Reason: {application.rejection_reason}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Accept Section */}
              {isWaiting && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-arena-on-surface flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Accept Application
                  </h3>
                  <p className={ck.body}>
                    Select an available unit and accept to create the tenant account. A congratulations email with setup link will be sent.
                  </p>
                  
                  <div className="space-y-2">
                    <label className={ck.fieldLabel}>Select Unit to Assign *</label>
                    <select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className={cn(ck.input, "w-full")}
                    >
                      <option value="">Select a unit...</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          Room {unit.room_number} - {unit.room_type} ({unit.availability_status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => selectedUnitId && onAccept(application.id, selectedUnitId)}
                    disabled={isLoading || !selectedUnitId}
                    className={cn(ck.btnSuccess, "w-full")}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isLoading ? 'Accepting...' : 'Accept & Assign Unit'}
                  </button>
                </div>
              )}

              {/* Reject Section */}
              {isWaiting && (
                <div className="space-y-3 pt-4 border-t border-arena-outline-variant/50">
                  <h3 className="font-semibold text-error flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Reject Application
                  </h3>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reason for rejection (e.g., All units occupied, Application requirements not met)"
                    className={cn(ck.input, "w-full border-error/40")}
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={() => onReject(application.id, rejectionReason)}
                    disabled={isLoading}
                    className={cn(ck.btnDanger, "w-full")}
                  >
                    <XCircle className="w-4 h-4" />
                    {isLoading ? 'Rejecting...' : 'Reject Application'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
