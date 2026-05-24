"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  CheckCircle,
  ClipboardList,
  FileText,
  Home,
  Image as ImageIcon,
  ShieldCheck,
} from "lucide-react";

import {
  getCaretakerDashboardData,
  getCaretakerDashboardDataFallback,
  getCaretakerProperty,
  getCaretakerUnits,
  getCaretakerTenants,
  getCaretakerIssues,
  getCaretakerLeases,
  getCaretakerAnnouncements,
  getCaretakerRules,
  getCaretakerFaqs,
  getCurrentCaretakerEmployee,
  getCaretakerRepairs,
  getCaretakerApplications,
  getCaretakerFacilities,
  getCaretakerInventory,
} from "@/lib/caretaker/dashboard";

import type {
  CaretakerDashboardData,
  CaretakerProperty,
  CaretakerUnit,
  CaretakerTenant,
  CaretakerIssue,
  CaretakerLease,
  CaretakerAnnouncement,
  CaretakerRule,
  CaretakerFaq,
  CaretakerRepair,
  CaretakerApplication,
  CaretakerFacilities,
  CaretakerInventoryItem,
} from "@/lib/caretaker/types";

import { IdentityCard } from "@/components/caretaker/IdentityCard";
import { QuickStats } from "@/components/caretaker/QuickStats";
import { UnitsPanel } from "@/components/caretaker/UnitsPanel";
import { TenantsPanel } from "@/components/caretaker/TenantsPanel";
import { IssuesPanel } from "@/components/caretaker/IssuesPanel";
import { LeasesPanel } from "@/components/caretaker/LeasesPanel";
import { AnnouncementsPanel } from "@/components/caretaker/AnnouncementsPanel";
import { RulesFaqsPanel } from "@/components/caretaker/RulesFaqsPanel";
import { PhotosPanel } from "@/components/caretaker/PhotosPanel";
import { RepairsPanel } from "@/components/caretaker/RepairsPanel";
import { ApplicationsPanel } from "@/components/caretaker/ApplicationsPanel";
import { FacilitiesInventoryPanel } from "@/components/caretaker/FacilitiesInventoryPanel";
import { PriorityAlerts } from "@/components/caretaker/PriorityAlerts";
import { SettingsPanel } from "@/components/caretaker/SettingsPanel";
import { cn, ck, statusChipClass, statusToneFromValue } from "@/components/caretaker/caretaker-ui";
import { getPropertyPhotoCount } from "@/lib/supabase/storage";

type TabType =
  | "overview"
  | "units"
  | "tenants"
  | "issues"
  | "leases"
  | "photos"
  | "announcements"
  | "rules"
  | "repairs"
  | "applications"
  | "facilities"
  | "settings";

const VALID_TABS: TabType[] = [
  "overview",
  "units",
  "tenants",
  "issues",
  "leases",
  "photos",
  "announcements",
  "rules",
  "repairs",
  "applications",
  "facilities",
  "settings",
];

function CaretakerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabType =
    tabParam && VALID_TABS.includes(tabParam as TabType) ? (tabParam as TabType) : "overview";

  const setActiveTab = (tab: TabType) => {
    if (tab === "overview") {
      router.push("/caretaker/dashboard");
    } else {
      router.push(`/caretaker/dashboard?tab=${tab}`);
    }
  };

  const [dashboardData, setDashboardData] = useState<CaretakerDashboardData | null>(null);
  const [property, setProperty] = useState<CaretakerProperty | null>(null);
  const [units, setUnits] = useState<CaretakerUnit[]>([]);
  const [tenants, setTenants] = useState<CaretakerTenant[]>([]);
  const [issues, setIssues] = useState<CaretakerIssue[]>([]);
  const [leases, setLeases] = useState<CaretakerLease[]>([]);
  const [announcements, setAnnouncements] = useState<{
    incoming: CaretakerAnnouncement[];
    outgoing: CaretakerAnnouncement[];
  }>({ incoming: [], outgoing: [] });
  const [rules, setRules] = useState<CaretakerRule[]>([]);
  const [faqs, setFaqs] = useState<CaretakerFaq[]>([]);
  const [repairs, setRepairs] = useState<CaretakerRepair[]>([]);
  const [applications, setApplications] = useState<CaretakerApplication[]>([]);
  const [facilities, setFacilities] = useState<CaretakerFacilities | null>(null);
  const [inventory, setInventory] = useState<CaretakerInventoryItem[]>([]);
  const [photoStatus, setPhotoStatus] = useState({
    total_count: 0,
    has_cover: false,
    has_gate: false,
    gallery_count: 0,
  });
  const [caretakerEmployeeId, setCaretakerEmployeeId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      const employee = await getCurrentCaretakerEmployee();
      if (!employee || !employee.assigned_property_id) {
        setError("No assigned property found. Contact administrator.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setCaretakerEmployeeId(employee.id);
      const propertyId = employee.assigned_property_id;

      let dashboard = await getCaretakerDashboardData();
      if (!dashboard) {
        dashboard = await getCaretakerDashboardDataFallback();
      }
      setDashboardData(dashboard);

      const [
        propertyData,
        unitsData,
        tenantsData,
        issuesData,
        leasesData,
        announcementsData,
        rulesData,
        faqsData,
        repairsData,
        applicationsData,
        facilitiesData,
        inventoryData,
        photoCountData,
      ] = await Promise.all([
        getCaretakerProperty(propertyId),
        getCaretakerUnits(propertyId),
        getCaretakerTenants(propertyId),
        getCaretakerIssues(propertyId),
        getCaretakerLeases(propertyId),
        getCaretakerAnnouncements(propertyId, employee.id),
        getCaretakerRules(propertyId),
        getCaretakerFaqs(propertyId),
        getCaretakerRepairs(propertyId),
        getCaretakerApplications(propertyId),
        getCaretakerFacilities(propertyId),
        getCaretakerInventory(propertyId),
        getPropertyPhotoCount(propertyId),
      ]);

      setProperty(propertyData);
      setUnits(unitsData);
      setTenants(tenantsData);
      setIssues(issuesData);
      setLeases(leasesData);
      setAnnouncements(announcementsData);
      setRules(rulesData);
      setFaqs(faqsData);
      setRepairs(repairsData);
      setApplications(applicationsData);
      setFacilities(facilitiesData);
      setInventory(inventoryData);
      setPhotoStatus(photoCountData);
    } catch (err) {
      console.error("Failed to load caretaker data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    await loadData();
  };

  const propertyId = dashboardData?.assigned_property_id || property?.id || "";
  const pendingIssues = dashboardData?.pending_issues_count ?? issues.filter((i) => i.status === "PENDING").length;
  const pendingApps =
    dashboardData?.pending_applications_count ?? applications.filter((a) => a.status === "WAITING").length;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const photosComplete =
    photoStatus.total_count >= 10 &&
    photoStatus.has_cover &&
    photoStatus.has_gate &&
    photoStatus.gallery_count >= 8;

  const tabs: { id: TabType; label: string; badge?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "issues", label: `Issues (${issues.filter((i) => i.status === "PENDING").length})`, badge: issues.filter((i) => i.status === "PENDING").length },
    { id: "applications", label: `Applications (${applications.length})`, badge: pendingApps },
    { id: "repairs", label: `Repairs (${repairs.length})` },
    { id: "leases", label: `Leases (${leases.length})` },
    { id: "photos", label: "Photos" },
    { id: "announcements", label: "Announcements", badge: announcements.incoming.length },
    { id: "rules", label: "Rules & FAQ" },
    { id: "facilities", label: "Property Content" },
    { id: "settings", label: "Settings" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="caretaker-card p-6 max-w-md text-center border-l-4 border-error">
          <p className="text-on-error-container font-medium">{error}</p>
          <button type="button" onClick={handleRefresh} className={cn(ck.btnPrimary, "mt-4")}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={ck.page}>
      <section className="rounded-2xl bg-[#071a33] px-5 py-5 text-white shadow-[0_18px_45px_rgba(7,26,51,0.18)] md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="caretaker-display-lg text-white">
            {greeting()}, {dashboardData?.caretaker_full_name?.split(" ")[0] || "Caretaker"}
          </h2>
          <div className="flex items-center gap-2 mt-1 text-blue-100/82">
            <Home className="w-4 h-4 text-sky-200" />
            <p className="text-sm">
              {property?.name || dashboardData?.property_name || "Assigned property"} -{" "}
              {property?.location || dashboardData?.property_location || "Location not set"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab("photos")}
          className={cn(
            "inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition active:scale-[0.98] self-start md:self-auto",
            photosComplete
              ? "bg-emerald-500 text-white shadow-[0_10px_22px_rgba(16,185,129,0.24)] hover:bg-emerald-600"
              : "bg-red-600 text-white shadow-[0_10px_22px_rgba(220,38,38,0.25)] hover:bg-red-700"
          )}
        >
          <ImageIcon className="w-4 h-4" />
          {photosComplete ? "Photos uploaded" : "Photos need to be uploaded"}
        </button>
        </div>
      </section>

      <PriorityAlerts
        pendingApplications={pendingApps}
        pendingIssues={pendingIssues}
        incomingAnnouncements={announcements.incoming.length}
        onViewApplications={() => setActiveTab("applications")}
        onViewIssues={() => setActiveTab("issues")}
        onViewAnnouncements={() => setActiveTab("announcements")}
      />

      <IdentityCard
        caretaker={dashboardData}
        property={property}
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
      />

      <QuickStats
        totalRooms={dashboardData?.total_rooms ?? 0}
        occupiedRooms={dashboardData?.occupied_rooms ?? 0}
        vacantRooms={dashboardData?.vacant_rooms ?? 0}
        tenantsCount={dashboardData?.tenants_count ?? 0}
        pendingIssues={pendingIssues}
        resolvedIssues={dashboardData?.resolved_issues_count ?? 0}
        pendingRepairs={dashboardData?.pending_repairs_count ?? 0}
        solvedRepairs={dashboardData?.solved_repairs_count ?? 0}
        pendingApplications={pendingApps}
        incomingAnnouncements={announcements.incoming.length}
      />

      <div className="caretaker-card p-3 md:p-4 bg-arena-surface-container-low">
        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                ck.tabButton,
                activeTab === tab.id
                  ? "bg-primary text-white shadow-[0_8px_18px_rgba(46,91,255,0.22)]"
                  : "bg-white/70 text-arena-on-surface-variant hover:text-arena-on-surface hover:bg-white hover:shadow-sm"
              )}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 bg-error text-white text-[10px] rounded-full font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="pb-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {property && (
              <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-5">
                <div className={cn(ck.card, "caretaker-info-card")}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={ck.iconTile}>
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={ck.sectionTitle}>Managed property</p>
                      <h3 className={ck.headline}>{property.name}</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className={ck.sectionTitle}>Property name</span>
                      <p className="font-medium text-arena-on-surface mt-1">{property.name}</p>
                    </div>
                    <div>
                      <span className={ck.sectionTitle}>Location</span>
                      <p className="font-medium text-arena-on-surface mt-1">{property.location || "Not set"}</p>
                    </div>
                    <div>
                      <span className={ck.sectionTitle}>Type</span>
                      <p className="font-medium text-arena-on-surface mt-1">{property.property_type || "Not set"}</p>
                    </div>
                    <div>
                      <span className={ck.sectionTitle}>Status</span>
                      <p className="mt-1">
                        <span className={statusChipClass(statusToneFromValue(property.verification_status))}>
                          {property.verification_status}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="caretaker-card p-5 md:p-6 bg-primary-container text-on-primary-container border-primary-container overflow-hidden relative">
                  <div className="relative z-10">
                    <p className="caretaker-label-caps opacity-80">Command readiness</p>
                    <h3 className="caretaker-display-lg mt-1">
                      {pendingIssues === 0 && pendingApps === 0 ? "All clear" : "Action needed"}
                    </h3>
                    <p className="text-sm opacity-85 mt-2">
                      {pendingIssues + pendingApps + announcements.incoming.length} item(s) need review across
                      applications, issues, and admin notices.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      pendingApps > 0
                        ? setActiveTab("applications")
                        : pendingIssues > 0
                        ? setActiveTab("issues")
                        : setActiveTab("announcements")
                    }
                    className="relative z-10 mt-5 inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-primary shadow-[0_10px_22px_rgba(0,0,0,0.18)] ring-1 ring-white/60 transition hover:bg-blue-50 hover:shadow-[0_14px_28px_rgba(0,0,0,0.22)] active:scale-[0.98]"
                  >
                    {pendingIssues === 0 && pendingApps === 0 ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    Review queue
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <OverviewListCard
                title="Recent applications"
                empty="No pending applications"
                onViewAll={() => setActiveTab("applications")}
                items={applications.slice(0, 3).map((app) => ({
                  id: app.id,
                  title: app.full_name || "Applicant",
                  subtitle: `Unit ${app.unit?.room_number || "TBD"}`,
                  badge: app.status,
                  tone: app.status === "WAITING" ? "warning" : "neutral",
                }))}
              />
              <OverviewListCard
                title="Recent issues"
                empty="No issues reported"
                onViewAll={() => setActiveTab("issues")}
                items={issues.slice(0, 3).map((issue) => ({
                  id: issue.id,
                  title: issue.title,
                  subtitle: `Room ${issue.unit?.room_number || "N/A"}`,
                  badge: issue.status,
                  tone:
                    issue.status === "PENDING"
                      ? "warning"
                      : issue.priority === "URGENT"
                      ? "danger"
                      : "info",
                }))}
              />
              <OverviewListCard
                title="Recent tenants"
                empty="No tenants"
                onViewAll={() => setActiveTab("tenants")}
                items={tenants.slice(0, 3).map((tenant) => ({
                  id: tenant.id,
                  title: tenant.full_name || "Unknown",
                  subtitle: `Room ${tenant.room_number || tenant.unit?.room_number || "N/A"}`,
                  badge: tenant.status,
                  tone: tenant.status === "ACTIVE" ? "success" : "neutral",
                }))}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <OverviewToolCard
                title="Property content"
                subtitle="Facilities, inventory, photos, and tenant-facing information."
                icon={FileText}
                action="Manage content"
                onClick={() => setActiveTab("facilities")}
              />
              <OverviewToolCard
                title="Rules and FAQ"
                subtitle={`${rules.filter((rule) => rule.is_active).length} active rules, ${faqs.filter((faq) => faq.is_active).length} active FAQs.`}
                icon={ClipboardList}
                action="Update tenant guidance"
                onClick={() => setActiveTab("rules")}
              />
              <OverviewToolCard
                title="Announcements"
                subtitle={`${announcements.incoming.length} admin notice(s), ${announcements.outgoing.length} broadcasts sent.`}
                icon={Bell}
                action="Open announcements"
                onClick={() => setActiveTab("announcements")}
              />
            </div>
          </div>
        )}

        {activeTab === "units" && propertyId && (
          <UnitsPanel units={units} propertyId={propertyId} onDataChange={handleRefresh} />
        )}
        {activeTab === "tenants" && propertyId && (
          <TenantsPanel tenants={tenants} units={units} propertyId={propertyId} />
        )}
        {activeTab === "issues" && propertyId && (
          <IssuesPanel issues={issues} propertyId={propertyId} onDataChange={handleRefresh} />
        )}
        {activeTab === "leases" && propertyId && (
          <LeasesPanel leases={leases} propertyId={propertyId} />
        )}
        {activeTab === "photos" && propertyId && (
          <PhotosPanel propertyId={propertyId} onDataChange={handleRefresh} />
        )}
        {activeTab === "announcements" && propertyId && (
          <AnnouncementsPanel
            incoming={announcements.incoming}
            outgoing={announcements.outgoing}
            propertyId={propertyId}
            caretakerEmployeeId={caretakerEmployeeId}
            onDataChange={handleRefresh}
          />
        )}
        {activeTab === "rules" && propertyId && (
          <RulesFaqsPanel rules={rules} faqs={faqs} propertyId={propertyId} onDataChange={handleRefresh} />
        )}
        {activeTab === "repairs" && propertyId && (
          <RepairsPanel
            repairs={repairs}
            issues={issues}
            propertyId={propertyId}
            onDataChange={handleRefresh}
          />
        )}
        {activeTab === "applications" && propertyId && (
          <ApplicationsPanel
            applications={applications}
            propertyId={propertyId}
            onDataChange={handleRefresh}
          />
        )}
        {activeTab === "facilities" && propertyId && (
          <FacilitiesInventoryPanel
            facilities={facilities}
            inventory={inventory}
            propertyId={propertyId}
            onDataChange={handleRefresh}
          />
        )}
        {activeTab === "settings" && dashboardData && (
          <SettingsPanel caretaker={dashboardData} property={property} />
        )}
      </div>
    </div>
  );
}

function OverviewListCard({
  title,
  empty,
  onViewAll,
  items,
}: {
  title: string;
  empty: string;
  onViewAll: () => void;
  items: { id: string; title: string; subtitle: string; badge: string; tone: "warning" | "danger" | "info" | "success" | "neutral" }[];
}) {
  return (
    <div className={cn(ck.card, "caretaker-info-card")}>
      <div className="flex justify-between items-center mb-4">
        <h4 className={ck.headline}>{title}</h4>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex min-h-[34px] items-center justify-center rounded-lg bg-white px-3 py-1 text-xs font-bold uppercase text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary hover:text-white active:scale-[0.98]"
        >
          View all
        </button>
      </div>
      {items.length === 0 ? (
        <p className={ck.body}>{empty}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-white/78 rounded-xl border border-arena-outline-variant/45 shadow-sm"
            >
              <div>
                <p className="font-semibold text-sm text-arena-on-surface">{item.title}</p>
                <p className="text-xs text-arena-on-surface-variant">{item.subtitle}</p>
              </div>
              <span className={statusChipClass(item.tone)}>{item.badge}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OverviewToolCard({
  title,
  subtitle,
  icon: Icon,
  action,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  action: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        ck.card,
        "caretaker-info-card text-left active-tap hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={ck.iconTile}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h4 className={ck.headline}>{title}</h4>
          <p className={cn(ck.body, "mt-1")}>{subtitle}</p>
          <span className="mt-4 inline-flex min-h-[38px] items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-bold uppercase text-white shadow-[0_9px_18px_rgba(46,91,255,0.22)] transition group-hover:bg-[#071a33]">
            {action}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function CaretakerDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CaretakerDashboardContent />
    </Suspense>
  );
}
