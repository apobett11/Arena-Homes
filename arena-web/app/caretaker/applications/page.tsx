"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FileText, User, Mail, Phone, Calendar, CheckCircle, XCircle, Clock, Home, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { getCurrentCaretakerEmployee, getCaretakerUnits } from "@/lib/caretaker/dashboard";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { CaretakerApplication } from "@/lib/caretaker/types";

interface ApplicationWithProperty extends CaretakerApplication {
  property_name?: string;
  selectedUnitId?: string;
}

export default function CaretakerApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithProperty[]>([]);
  const [units, setUnits] = useState<{ id: string; room_number: string | null; availability_status: string; status: string; current_tenant_id: string | null }[]>([]);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get caretaker's assigned property
      const employee = await getCurrentCaretakerEmployee();
      if (!employee || !employee.assigned_property_id) {
        setError("No assigned property found. Contact administrator.");
        setLoading(false);
        return;
      }

      setPropertyId(employee.assigned_property_id);

      // Load applications and units in parallel
      const supabase = getSupabaseClient() as any;
      
      // Fetch applications directly from Supabase
      const { data: applicationsData, error: appsError } = await supabase
        .from('tenant_applications')
        .select('*')
        .eq('property_id', employee.assigned_property_id)
        .order('created_at', { ascending: false });
      
      if (appsError) throw appsError;
      
      // Fetch units with current_tenant_id for proper availability check
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('id, room_number, availability_status, status, current_tenant_id')
        .eq('property_id', employee.assigned_property_id)
        .order('room_number', { ascending: true });
      
      if (unitsError) throw unitsError;

      // Map applications to CaretakerApplication type (snake_case fields)
      const mappedApps: ApplicationWithProperty[] = (applicationsData || []).map((app: Record<string, unknown>) => ({
        id: app.id as string,
        applicant_user_id: app.applicant_user_id as string | null,
        full_name: app.full_name as string | null,
        email: app.email as string | null,
        phone_number: app.phone_number as string | null,
        whatsapp_number: app.whatsapp_number as string | null,
        registration_number: app.registration_number as string | null,
        notes: app.notes as string | null,
        property_id: app.property_id as string | null,
        unit_id: app.unit_id as string | null,
        status: app.status as 'WAITING' | 'ACCEPTED' | 'REJECTED',
        caretaker_employee_id: app.caretaker_employee_id as string | null,
        created_at: app.created_at as string,
        updated_at: app.updated_at as string,
        preferred_move_in_date: app.preferred_move_in_date as string | null,
        assigned_unit_id: app.assigned_unit_id as string | undefined,
        // For the interface with ApplicationWithProperty
        property_name: undefined,
        selectedUnitId: undefined,
      }));
      
      setApplications(mappedApps);
      setUnits(unitsData || []);
    } catch (err) {
      console.error("Error loading applications:", err);
      setError("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (appId: string, unitId?: string) => {
    if (!unitId) {
      setError("Please select a unit to assign");
      return;
    }

    // Verify unit is actually available (no tenant assigned)
    const selectedUnit = units.find(u => u.id === unitId);
    if (!selectedUnit) {
      setError("Selected unit not found");
      return;
    }
    if (selectedUnit.current_tenant_id !== null) {
      setError("Selected unit is already occupied");
      return;
    }
    if (selectedUnit.availability_status !== 'AVAILABLE') {
      setError(`Selected unit is not available (status: ${selectedUnit.availability_status})`);
      return;
    }

    try {
      setProcessingId(appId);
      setError(null);
      
      // Call the proper accept_application RPC
      const supabase = getSupabaseClient() as any;
      const { data, error } = await supabase.rpc('accept_application', {
        p_application_id: appId,
        p_assigned_unit_id: unitId,
        p_start_date: new Date().toISOString().split('T')[0],
        p_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Failed to accept application');
      }

      // Build success message with email status
      let successMsg = "Application accepted and unit assigned successfully";
      if (data?.emailQueued) {
        successMsg += ". Tenant setup email has been queued";
        if (data?.emailTriggerResult?.success === false) {
          successMsg += " (delivery pending - will retry automatically)";
        } else {
          successMsg += " and sent";
        }
      }
      setSuccessMessage(successMsg);
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Refresh the list
      await loadData();
    } catch (err) {
      console.error("Error approving application:", err);
      setError(err instanceof Error ? err.message : "Failed to approve application");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (appId: string) => {
    try {
      setProcessingId(appId);
      setError(null);
      
      // Call the reject_application RPC
      const supabase = getSupabaseClient() as any;
      const { data, error } = await supabase.rpc('reject_application', {
        p_application_id: appId,
        p_reason: "Application rejected by caretaker"
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Failed to reject application');
      }

      setSuccessMessage("Application rejected");
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh the list
      await loadData();
    } catch (err) {
      console.error("Error rejecting application:", err);
      setError(err instanceof Error ? err.message : "Failed to reject application");
    } finally {
      setProcessingId(null);
    }
  };

  const toggleExpand = (appId: string) => {
    setExpandedApp(expandedApp === appId ? null : appId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "WAITING":
        return <Clock className="w-5 h-5 text-amber-500" />;
      case "ACCEPTED":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "REJECTED":
        return <XCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      WAITING: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
      ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
      REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
    };
    return styles[status as keyof typeof styles] || "bg-slate-100 text-slate-700";
  };

  const waitingCount = applications.filter(a => a.status === "WAITING").length;
  // Available units must have: no tenant assigned AND availability_status = 'AVAILABLE'
  const availableUnits = units;
  const vacantUnits = units.filter(u => 
    u.current_tenant_id === null && u.availability_status === "AVAILABLE"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Applications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage tenant applications for your property
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{waitingCount}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Waiting</p>
          </div>
          <div className="h-10 w-px bg-slate-200 dark:bg-white/10" />
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{vacantUnits.length}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Units Available</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <p className="text-rose-700 dark:text-rose-400">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <p className="text-emerald-700 dark:text-emerald-400">{successMessage}</p>
        </div>
      )}

      {/* Applications List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Applications</h3>
            <p className="text-slate-500 mt-2">You haven&apos;t received any applications yet.</p>
          </div>
        ) : (
          applications.map((app) => (
            <div
              key={app.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden"
            >
              {/* Application Header - Always Visible */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => toggleExpand(app.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{app.full_name}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {app.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {app.phone_number}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}>
                    {app.status}
                  </span>
                  {expandedApp === app.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedApp === app.id && (
                <div className="border-t border-slate-200 dark:border-white/10 p-4 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">WhatsApp</p>
                      <p className="text-sm text-slate-900 dark:text-white">{app.whatsapp_number || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Registration Number</p>
                      <p className="text-sm text-slate-900 dark:text-white">{app.registration_number || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Preferred Move-in</p>
                      <p className="text-sm text-slate-900 dark:text-white flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {app.preferred_move_in_date ? new Date(app.preferred_move_in_date).toLocaleDateString() : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Submitted</p>
                      <p className="text-sm text-slate-900 dark:text-white">
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {app.notes && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Message</p>
                      <p className="text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-white/10">
                        {app.notes}
                      </p>
                    </div>
                  )}

                  {/* Actions for Waiting Applications */}
                  {app.status === "WAITING" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                          Select Unit to Assign
                        </label>
                        <select
                          value={app.selectedUnitId || ""}
                          onChange={(e) => {
                            setApplications(apps => 
                              apps.map(a => 
                                a.id === app.id ? { ...a, selectedUnitId: e.target.value } : a
                              )
                            );
                          }}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                        >
                          <option value="">Select Unit ID...</option>
                          {availableUnits.map(unit => {
                            const isTrulyAvailable = unit.current_tenant_id === null && unit.availability_status === "AVAILABLE";
                            return (
                              <option 
                                key={unit.id} 
                                value={unit.id}
                                disabled={!isTrulyAvailable}
                              >
                                {unit.room_number ? `Room ${unit.room_number}` : unit.id.substring(0, 8)} 
                                {isTrulyAvailable ? " [AVAILABLE]" : unit.current_tenant_id ? " [OCCUPIED]" : " [NOT AVAILABLE]"}
                              </option>
                            );
                          })}
                        </select>
                        {vacantUnits.length === 0 && (
                          <p className="text-xs text-rose-500 mt-1">
                            No vacant units available. All units are occupied or under maintenance.
                          </p>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(app.id, app.selectedUnitId)}
                          disabled={processingId === app.id || !app.selectedUnitId || vacantUnits.length === 0}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {processingId === app.id ? "Processing..." : "Approve & Assign"}
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          disabled={processingId === app.id}
                          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          {processingId === app.id ? "Processing..." : "Reject"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
