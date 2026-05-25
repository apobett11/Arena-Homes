"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { AlertCircle, RefreshCw, Home, DoorOpen, Users, Wrench, FileText, Bell, MessageSquare, ClipboardList, Settings } from "lucide-react";

import {
  getCaretakerDashboardData,
  getCaretakerProperty,
  getCaretakerUnits,
  getCaretakerTenants,
  getCaretakerLeases,
  getCaretakerIssues,
  getCaretakerRepairs,
  getCaretakerRules,
  getCaretakerFaqs,
  getCaretakerFacilities,
  getCaretakerInventory,
  getCaretakerApplications,
  getCaretakerAnnouncements,
} from "@/lib/caretaker/dashboard";
import type {
  CaretakerDashboardData,
  CaretakerProperty,
  CaretakerUnit,
  CaretakerTenant,
  CaretakerLease,
  CaretakerIssue,
  CaretakerRepair,
  CaretakerRule,
  CaretakerFaq,
  CaretakerFacilities,
  CaretakerInventoryItem,
  CaretakerApplication,
  CaretakerAnnouncement,
} from "@/lib/caretaker/types";

import { IdentityCard } from "@/components/caretaker/IdentityCard";
import { QuickStats } from "@/components/caretaker/QuickStats";
import { IssuesPanel } from "@/components/caretaker/IssuesPanel";
import { UnitsPanel } from "@/components/caretaker/UnitsPanel";
import { TenantsPanel } from "@/components/caretaker/TenantsPanel";
import { RepairsPanel } from "@/components/caretaker/RepairsPanel";
import { AnnouncementsPanel } from "@/components/caretaker/AnnouncementsPanel";
import { ApplicationsPanel } from "@/components/caretaker/ApplicationsPanel";
import { RulesFaqsPanel } from "@/components/caretaker/RulesFaqsPanel";
import { FacilitiesInventoryPanel } from "@/components/caretaker/FacilitiesInventoryPanel";
import { LeasesPanel } from "@/components/caretaker/LeasesPanel";

type TabId = "overview" | "units" | "tenants" | "issues" | "repairs" | "applications" | "rules" | "announcements" | "leases";

interface DashboardState {
  dashboard: CaretakerDashboardData | null;
  property: CaretakerProperty | null;
  units: CaretakerUnit[];
  tenants: CaretakerTenant[];
  leases: CaretakerLease[];
  issues: CaretakerIssue[];
  repairs: CaretakerRepair[];
  rules: CaretakerRule[];
  faqs: CaretakerFaq[];
  facilities: CaretakerFacilities | null;
  inventory: CaretakerInventoryItem[];
  applications: CaretakerApplication[];
  announcements: { incoming: CaretakerAnnouncement[]; outgoing: CaretakerAnnouncement[] };
  loading: boolean;
  error: string | null;
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "units", label: "Units", icon: DoorOpen },
  { id: "tenants", label: "Tenants", icon: Users },
  { id: "issues", label: "Issues", icon: Wrench },
  { id: "repairs", label: "Repairs", icon: Settings },
  { id: "applications", label: "Applications", icon: ClipboardList },
  { id: "rules", label: "Rules & FAQs", icon: FileText },
  { id: "announcements", label: "Announcements", icon: Bell },
  { id: "leases", label: "Leases", icon: FileText },
];

export default function CaretakerDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<DashboardState>({
    dashboard: null,
    property: null,
    units: [],
    tenants: [],
    leases: [],
    issues: [],
    repairs: [],
    rules: [],
    faqs: [],
    facilities: null,
    inventory: [],
    applications: [],
    announcements: { incoming: [], outgoing: [] },
    loading: true,
    error: null,
  });

  const loadData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const dashboard = await getCaretakerDashboardData();

      if (!dashboard) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "No caretaker dashboard data found. Ensure you are logged in as a caretaker with an assigned property.",
        }));
        return;
      }

      if (!dashboard.assigned_property_id) {
        setState((prev) => ({
          ...prev,
          dashboard,
          loading: false,
          error: "No property has been assigned to your caretaker account yet. Contact admin.",
        }));
        return;
      }

      const propertyId = dashboard.assigned_property_id;

      const [
        property,
        units,
        tenants,
        leases,
        issues,
        repairs,
        rules,
        faqs,
        facilities,
        inventory,
        applications,
        announcements,
      ] = await Promise.all([
        getCaretakerProperty(propertyId),
        getCaretakerUnits(propertyId),
        getCaretakerTenants(propertyId),
        getCaretakerLeases(propertyId),
        getCaretakerIssues(propertyId),
        getCaretakerRepairs(propertyId),
        getCaretakerRules(propertyId),
        getCaretakerFaqs(propertyId),
        getCaretakerFacilities(propertyId),
        getCaretakerInventory(propertyId),
        getCaretakerApplications(propertyId),
        getCaretakerAnnouncements(propertyId, dashboard.caretaker_employee_id),
      ]);

      setState({
        dashboard,
        property,
        units,
        tenants,
        leases,
        issues,
        repairs,
        rules,
        faqs,
        facilities,
        inventory,
        applications,
        announcements,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error("Failed to load caretaker data:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load dashboard data",
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setDashboardTab = (tab: TabId, scrollMenuToTop = false) => {
    setActiveTab(tab);

    if (typeof window !== "undefined") {
      const url = tab === "overview" ? "/caretaker/dashboard" : `/caretaker/dashboard?tab=${tab}`;
      window.history.pushState({ tab }, "", url);
    }

    if (scrollMenuToTop) {
      requestAnimationFrame(() => {
        menuRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      });
    }
  };

  useEffect(() => {
    const initialParams = new URLSearchParams(window.location.search);
    const initialTab = initialParams.get("tab");
    if (initialTab && tabs.some((tab) => tab.id === initialTab)) {
      setActiveTab(initialTab as TabId);
    }

    const handlePopState = () => {
      const nextParams = new URLSearchParams(window.location.search);
      const nextTab = nextParams.get("tab");
      setActiveTab(nextTab && tabs.some((tab) => tab.id === nextTab) ? (nextTab as TabId) : "overview");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleRefresh = () => {
    loadData();
  };

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-300 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-white/10 shadow-lg">
          <div className="flex items-center gap-3 text-rose-500 mb-4">
            <AlertCircle className="w-8 h-8" />
            <h2 className="text-xl font-bold">Dashboard Error</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-300 mb-6">{state.error}</p>
          <button
            onClick={handleRefresh}
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!state.dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-white/10 shadow-lg text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Dashboard Data</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Could not load caretaker dashboard. Please ensure you have the correct permissions.
          </p>
          <button
            onClick={handleRefresh}
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <IdentityCard
          caretaker={state.dashboard}
          property={state.property}
          onRefresh={handleRefresh}
          isRefreshing={state.loading}
        />
      </div>

      <div ref={menuRef} className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/95 backdrop-blur dark:border-white/10 dark:bg-slate-950/95">
        <nav className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setDashboardTab(tab.id, true)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors rounded-t-lg ${
                  isActive
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === "issues" && state.issues.filter((i) => i.status === "PENDING").length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-rose-500 text-white text-[10px] rounded-full">
                    {state.issues.filter((i) => i.status === "PENDING").length}
                  </span>
                )}
                {tab.id === "applications" && state.applications.filter((a) => a.status === "WAITING").length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] rounded-full">
                    {state.applications.filter((a) => a.status === "WAITING").length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pb-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            <QuickStats
              totalRooms={state.dashboard.total_rooms}
              occupiedRooms={state.dashboard.occupied_rooms}
              vacantRooms={state.dashboard.vacant_rooms}
              tenantsCount={state.dashboard.tenants_count}
              pendingIssues={state.dashboard.pending_issues_count}
              resolvedIssues={state.dashboard.resolved_issues_count}
              pendingRepairs={state.dashboard.pending_repairs_count}
              solvedRepairs={state.dashboard.solved_repairs_count}
              pendingApplications={state.dashboard.pending_applications_count}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionCard
                title="Pending Issues"
                count={state.dashboard.pending_issues_count}
                icon={Wrench}
                color="rose"
                onClick={() => setDashboardTab("issues", true)}
              />
              <QuickActionCard
                title="Pending Applications"
                count={state.dashboard.pending_applications_count}
                icon={ClipboardList}
                color="amber"
                onClick={() => setDashboardTab("applications", true)}
              />
              <QuickActionCard
                title="Vacant Units"
                count={state.dashboard.vacant_rooms}
                icon={DoorOpen}
                color="emerald"
                onClick={() => setDashboardTab("units", true)}
              />
            </div>

            {state.issues.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Issues</h3>
                  <button
                    onClick={() => setDashboardTab("issues", true)}
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {state.issues.slice(0, 3).map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            issue.priority === "URGENT"
                              ? "bg-rose-500"
                              : issue.priority === "HIGH"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">{issue.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {issue.tenant?.room_number || "No room"} • {issue.tenant?.full_name || "Unknown"}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={issue.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "units" && (
          <UnitsPanel
            units={state.units}
            propertyId={state.dashboard.assigned_property_id!}
            onDataChange={loadData}
          />
        )}

        {activeTab === "tenants" && (
          <TenantsPanel
            tenants={state.tenants}
            units={state.units}
            propertyId={state.dashboard.assigned_property_id!}
          />
        )}

        {activeTab === "issues" && (
          <IssuesPanel
            issues={state.issues}
            propertyId={state.dashboard.assigned_property_id!}
            onDataChange={loadData}
          />
        )}

        {activeTab === "repairs" && (
          <RepairsPanel
            repairs={state.repairs}
            issues={state.issues}
            propertyId={state.dashboard.assigned_property_id!}
            onDataChange={loadData}
          />
        )}

        {activeTab === "applications" && (
          <ApplicationsPanel
            applications={state.applications}
            propertyId={state.dashboard.assigned_property_id!}
            onDataChange={loadData}
          />
        )}

        {activeTab === "rules" && (
          <RulesFaqsPanel
            rules={state.rules}
            faqs={state.faqs}
            propertyId={state.dashboard.assigned_property_id!}
            onDataChange={loadData}
          />
        )}

        {activeTab === "announcements" && (
          <AnnouncementsPanel
            incoming={state.announcements.incoming}
            outgoing={state.announcements.outgoing}
            propertyId={state.dashboard.assigned_property_id!}
            caretakerEmployeeId={state.dashboard.caretaker_employee_id}
            onDataChange={loadData}
          />
        )}

        {activeTab === "leases" && <LeasesPanel leases={state.leases} propertyId={state.dashboard.assigned_property_id!} />}
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  count,
  icon: Icon,
  color,
  onClick,
}: {
  title: string;
  count: number;
  icon: React.ElementType;
  color: "rose" | "amber" | "emerald" | "blue";
  onClick: () => void;
}) {
  const colors = {
    rose: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400",
    amber: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400",
    blue: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400",
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${colors[color]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-sm font-medium opacity-80">{title}</p>
        </div>
        <Icon className="w-8 h-8 opacity-50" />
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
    IN_PROGRESS: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400",
    RESOLVED: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
    ESCALATED: "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400",
    CLOSED: "bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
      {status.replace("_", " ")}
    </span>
  );
}
