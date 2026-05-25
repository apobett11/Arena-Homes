"use client";

import { useCallback, useEffect, useState } from "react";
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
import { getUnreadCommunicationCount } from "@/lib/communication/api";
import { getPropertyPhotoCount } from "@/lib/supabase/storage";
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

export interface CaretakerWorkspaceState {
  dashboardData: CaretakerDashboardData | null;
  property: CaretakerProperty | null;
  propertyId: string;
  caretakerEmployeeId: string;
  units: CaretakerUnit[];
  tenants: CaretakerTenant[];
  issues: CaretakerIssue[];
  leases: CaretakerLease[];
  announcements: { incoming: CaretakerAnnouncement[]; outgoing: CaretakerAnnouncement[] };
  rules: CaretakerRule[];
  faqs: CaretakerFaq[];
  repairs: CaretakerRepair[];
  applications: CaretakerApplication[];
  facilities: CaretakerFacilities | null;
  inventory: CaretakerInventoryItem[];
  photoStatus: {
    total_count: number;
    has_cover: boolean;
    has_gate: boolean;
    gallery_count: number;
  };
  unreadMessages: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  pendingApplications: number;
  pendingIssues: number;
  pendingRepairs: number;
  incomingAnnouncements: number;
}

export function useCaretakerWorkspace(options?: { loadFacilities?: boolean }): CaretakerWorkspaceState {
  const loadFacilities = options?.loadFacilities ?? false;

  const [dashboardData, setDashboardData] = useState<CaretakerDashboardData | null>(null);
  const [property, setProperty] = useState<CaretakerProperty | null>(null);
  const [propertyId, setPropertyId] = useState("");
  const [caretakerEmployeeId, setCaretakerEmployeeId] = useState("");
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
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      const employee = await getCurrentCaretakerEmployee();
      if (!employee?.assigned_property_id) {
        setError("No assigned property found. Contact administrator.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setCaretakerEmployeeId(employee.id);
      const pid = employee.assigned_property_id;
      setPropertyId(pid);

      let dashboard = await getCaretakerDashboardData();
      if (!dashboard) {
        dashboard = await getCaretakerDashboardDataFallback();
      }
      setDashboardData(dashboard);

      const fetches: Promise<unknown>[] = [
        getCaretakerProperty(pid),
        getCaretakerUnits(pid),
        getCaretakerTenants(pid),
        getCaretakerIssues(pid),
        getCaretakerLeases(pid),
        getCaretakerAnnouncements(pid, employee.id),
        getCaretakerRules(pid),
        getCaretakerFaqs(pid),
        getCaretakerRepairs(pid),
        getCaretakerApplications(pid),
        getPropertyPhotoCount(pid),
        getUnreadCommunicationCount(),
      ];

      if (loadFacilities) {
        fetches.push(getCaretakerFacilities(pid), getCaretakerInventory(pid));
      }

      const results = await Promise.all(fetches);
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
        photoCountData,
        unreadCount,
        facilitiesData,
        inventoryData,
      ] = results as [
        CaretakerProperty | null,
        CaretakerUnit[],
        CaretakerTenant[],
        CaretakerIssue[],
        CaretakerLease[],
        { incoming: CaretakerAnnouncement[]; outgoing: CaretakerAnnouncement[] },
        CaretakerRule[],
        CaretakerFaq[],
        CaretakerRepair[],
        CaretakerApplication[],
        { total_count: number; has_cover: boolean; has_gate: boolean; gallery_count: number },
        number,
        CaretakerFacilities | null | undefined,
        CaretakerInventoryItem[] | undefined,
      ];

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
      setPhotoStatus(photoCountData);
      setUnreadMessages(unreadCount);
      if (loadFacilities) {
        setFacilities(facilitiesData ?? null);
        setInventory(inventoryData ?? []);
      }
    } catch (err) {
      console.error("Failed to load caretaker workspace:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadFacilities]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingApplications =
    dashboardData?.pending_applications_count ??
    applications.filter((a) => a.status === "WAITING").length;
  const pendingIssues =
    dashboardData?.pending_issues_count ?? issues.filter((i) => i.status === "PENDING").length;
  const pendingRepairs =
    dashboardData?.pending_repairs_count ??
    repairs.filter((r) => r.status === "PENDING" || r.status === "IN_PROGRESS").length;
  const incomingAnnouncements =
    dashboardData?.incoming_announcements_count ?? announcements.incoming.length;

  return {
    dashboardData,
    property,
    propertyId,
    caretakerEmployeeId,
    units,
    tenants,
    issues,
    leases,
    announcements,
    rules,
    faqs,
    repairs,
    applications,
    facilities,
    inventory,
    photoStatus,
    unreadMessages,
    loading,
    refreshing,
    error,
    refresh: loadData,
    pendingApplications,
    pendingIssues,
    pendingRepairs,
    incomingAnnouncements,
  };
}
