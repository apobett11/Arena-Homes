"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FileText, User, Mail, Phone, Calendar, CheckCircle, XCircle, Clock, Home, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { getCurrentCaretakerEmployee, getCaretakerUnits } from "@/lib/caretaker/dashboard";
import { ApplicationApi } from "@/lib/api/domains/applications";
import type { CaretakerApplication } from "@/lib/api/domains/applications";

interface ApplicationWithProperty extends CaretakerApplication {
  property_name?: string;
  selectedUnitId?: string;
}

export default function CaretakerApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithProperty[]>([]);
  const [units, setUnits] = useState<{ id: string; room_number: string | null; availability_status: string; status: string }[]>([]);
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
      const [applicationsData, unitsData] = await Promise.all([
        ApplicationApi.getCaretakerApplications(),
        getCaretakerUnits(employee.assigned_property_id),
      ]);

      setApplications(applicationsData || []);
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

    try {
      setProcessingId(appId);
      setError(null);
      
      await ApplicationApi.respond(appId, { 
        status: "ACCEPTED",
        notes: `Approved and assigned to unit ${unitId}` 
      });

      setSuccessMessage("Application approved successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh the list
      await loadData();
    } catch (err) {
      console.error("Error approving application:", err);
      setError("Failed to approve application");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (appId: string) => {
    try {
      setProcessingId(appId);
      setError(null);
      
      await ApplicationApi.respond(appId, { 
        status: "REJECTED",
        notes: "Application rejected by caretaker" 
      });

      setSuccessMessage("Application rejected");
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh the list
      await loadData();
    } catch (err) {
      console.error("Error rejecting application:", err);
      setError("Failed to reject application");
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
  // Show all units, available units are those with AVAILABLE status
  const availableUnits = units;
  const vacantUnits = units.filter(u => u.availability_status === "AVAILABLE");

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
                    <h3 className="font-semibold text-slate-900 dark:text-white">{app.fullName}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {app.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {app.phoneNumber}
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
                      <p className="text-sm text-slate-900 dark:text-white">{app.whatsappNumber || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Registration Number</p>
                      <p className="text-sm text-slate-900 dark:text-white">{app.universityRegNo || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Preferred Move-in</p>
                      <p className="text-sm text-slate-900 dark:text-white flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {app.preferredMoveInDate ? new Date(app.preferredMoveInDate).toLocaleDateString() : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Submitted</p>
                      <p className="text-sm text-slate-900 dark:text-white">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {app.message && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Message</p>
                      <p className="text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-white/10">
                        {app.message}
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
                          {availableUnits.map(unit => (
                            <option 
                              key={unit.id} 
                              value={unit.id}
                              disabled={unit.availability_status !== "AVAILABLE"}
                            >
                              {unit.id.substring(0, 8)}... {unit.room_number ? `(Room ${unit.room_number})` : ''} {unit.availability_status !== "AVAILABLE" ? "[OCCUPIED]" : "[AVAILABLE]"}
                            </option>
                          ))}
                        </select>
                        {vacantUnits.length === 0 && (
                          <p className="text-xs text-rose-500 mt-1">
                            No vacant units available. Free up a unit first.
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
