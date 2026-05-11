"use client";

import React, { useState, useEffect } from "react";
import { ClipboardList, CheckCircle, XCircle, User, Home, FileText } from "lucide-react";
import type { CaretakerApplication, CaretakerUnit } from "@/lib/caretaker/types";
import { getSupabaseClient } from "@/lib/supabase/client";

interface ApplicationsPanelProps {
  applications: CaretakerApplication[];
  propertyId: string;
  onDataChange: () => void;
}

const statusColors: Record<string, string> = {
  WAITING: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
};

export const ApplicationsPanel = ({ applications, propertyId, onDataChange }: ApplicationsPanelProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("WAITING");
  const [selectedApp, setSelectedApp] = useState<CaretakerApplication | null>(null);
  const [units, setUnits] = useState<CaretakerUnit[]>([]);

  const filteredApplications = applications.filter((app) => {
    if (filter === "all") return true;
    return app.status === filter;
  });

  // Load available units for assignment (must have no tenant assigned)
  useEffect(() => {
    async function loadUnits() {
      const supabase = getSupabaseClient() as any;
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
    const supabase = getSupabaseClient() as any;
    
    try {
      const { data, error } = await supabase.rpc('accept_application', {
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
    const supabase = getSupabaseClient() as any;
    const { data, error } = await supabase.rpc('reject_application', {
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
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} color="bg-slate-500" />
        <StatCard label="Waiting" value={stats.waiting} color="bg-amber-500" alert={stats.waiting > 0} />
        <StatCard label="Accepted" value={stats.accepted} color="bg-emerald-500" />
        <StatCard label="Rejected" value={stats.rejected} color="bg-rose-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All" />
        <FilterButton active={filter === "WAITING"} onClick={() => setFilter("WAITING")} label="Waiting" color="amber" />
        <FilterButton active={filter === "ACCEPTED"} onClick={() => setFilter("ACCEPTED")} label="Accepted" color="emerald" />
        <FilterButton active={filter === "REJECTED"} onClick={() => setFilter("REJECTED")} label="Rejected" color="rose" />
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
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10">
          <ClipboardList className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">No applications found.</p>
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
  onViewDetails,
}: {
  application: CaretakerApplication;
  isLoading: boolean;
  onViewDetails: () => void;
}) => {
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
              {application.status}
            </span>
          </div>
        </div>
        <span className="text-xs text-slate-400">
          {new Date(application.created_at).toLocaleDateString()}
        </span>
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
            <span>Requested: Room {application.unit.room_number} ({application.unit.room_type})</span>
          </div>
        )}
      </div>

      <button
        onClick={onViewDetails}
        disabled={isLoading}
        className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{application.full_name}</h2>
            <p className="text-sm text-slate-500 mt-1">Application Details</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-white/10">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}
          >
            Overview
          </button>
          {isWaiting && (
            <button
              onClick={() => setActiveTab('actions')}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === 'actions' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}
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
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <p className="text-xs text-slate-500 uppercase mb-1">Application Status</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[application.status]}`}>
                  {application.status}
                </span>
              </div>

              {/* Applicant Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Applicant Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Email</p>
                    <p className="font-medium">{application.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Phone</p>
                    <p className="font-medium">{application.phone_number}</p>
                  </div>
                  {application.whatsapp_number && (
                    <div>
                      <p className="text-slate-500">WhatsApp</p>
                      <p className="font-medium">{application.whatsapp_number}</p>
                    </div>
                  )}
                  {application.registration_number && (
                    <div>
                      <p className="text-slate-500">Registration No</p>
                      <p className="font-medium">{application.registration_number}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Unit Info */}
              {application.unit && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Requested Unit
                  </h3>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <p className="font-medium">Room {application.unit.room_number}</p>
                    <p className="text-sm text-slate-500">{application.unit.room_type}</p>
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
                  <p className="text-sm text-slate-600 dark:text-slate-400">
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
                    <p className="text-sm text-slate-600 dark:text-slate-400">
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
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Accept Application
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Select an available unit and accept to create the tenant account. A congratulations email with setup link will be sent.
                  </p>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Unit to Assign *</label>
                    <select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
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
                    onClick={() => selectedUnitId && onAccept(application.id, selectedUnitId)}
                    disabled={isLoading || !selectedUnitId}
                    className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isLoading ? 'Accepting...' : 'Accept & Assign Unit'}
                  </button>
                </div>
              )}

              {/* Reject Section */}
              {isWaiting && (
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/10">
                  <h3 className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Reject Application
                  </h3>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reason for rejection (e.g., All units occupied, Application requirements not met)"
                    className="w-full px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-600 bg-white dark:bg-slate-800 text-sm"
                    rows={2}
                  />
                  <button
                    onClick={() => onReject(application.id, rejectionReason)}
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 rounded-lg text-sm font-medium hover:bg-rose-200 disabled:opacity-50 flex items-center justify-center gap-2"
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
