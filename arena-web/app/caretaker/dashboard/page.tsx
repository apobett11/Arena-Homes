"use client";

import React, { useEffect, useState, useCallback } from "react";
import { IdentityCard } from "@/components/caretaker/IdentityCard";
import { QuickStats } from "@/components/caretaker/QuickStats";
import { ActionGrid } from "@/components/caretaker/ActionGrid";
import { UnitsPanel } from "@/components/caretaker/UnitsPanel";
import { TenantsPanel } from "@/components/caretaker/TenantsPanel";
import { IssuesPanel } from "@/components/caretaker/IssuesPanel";
import { LeasesPanel } from "@/components/caretaker/LeasesPanel";
import { AnnouncementsPanel } from "@/components/caretaker/AnnouncementsPanel";
import { RulesFaqsPanel } from "@/components/caretaker/RulesFaqsPanel";

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
} from "@/lib/caretaker/types";

type TabType = "overview" | "units" | "tenants" | "issues" | "leases" | "announcements" | "rules";

export default function CaretakerDashboard() {
    // Data states - ALL strictly scoped to caretaker's property
    const [dashboardData, setDashboardData] = useState<CaretakerDashboardData | null>(null);
    const [property, setProperty] = useState<CaretakerProperty | null>(null);
    const [units, setUnits] = useState<CaretakerUnit[]>([]);
    const [tenants, setTenants] = useState<CaretakerTenant[]>([]);
    const [issues, setIssues] = useState<CaretakerIssue[]>([]);
    const [leases, setLeases] = useState<CaretakerLease[]>([]);
    const [announcements, setAnnouncements] = useState<{ incoming: CaretakerAnnouncement[]; outgoing: CaretakerAnnouncement[] }>({ incoming: [], outgoing: [] });
    const [rules, setRules] = useState<CaretakerRule[]>([]);
    const [faqs, setFaqs] = useState<CaretakerFaq[]>([]);
    const [caretakerEmployeeId, setCaretakerEmployeeId] = useState<string>("");
    
    // UI states
    const [activeTab, setActiveTab] = useState<TabType>("overview");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load all caretaker-scoped data
    const loadData = useCallback(async () => {
        try {
            setRefreshing(true);
            setError(null);

            // 1. Get caretaker employee to determine assigned property
            const employee = await getCurrentCaretakerEmployee();
            if (!employee || !employee.assigned_property_id) {
                setError("No assigned property found. Contact administrator.");
                setLoading(false);
                setRefreshing(false);
                return;
            }

            setCaretakerEmployeeId(employee.id);
            const propertyId = employee.assigned_property_id;

            // 2. Try dashboard view first, fallback to manual query chain
            let dashboard = await getCaretakerDashboardData();
            if (!dashboard) {
                dashboard = await getCaretakerDashboardDataFallback();
            }
            setDashboardData(dashboard);

            // 3. Load ALL property-scoped data in parallel
            const [
                propertyData,
                unitsData,
                tenantsData,
                issuesData,
                leasesData,
                announcementsData,
                rulesData,
                faqsData,
            ] = await Promise.all([
                getCaretakerProperty(propertyId),
                getCaretakerUnits(propertyId),
                getCaretakerTenants(propertyId),
                getCaretakerIssues(propertyId),
                getCaretakerLeases(propertyId),
                getCaretakerAnnouncements(propertyId, employee.id),
                getCaretakerRules(propertyId),
                getCaretakerFaqs(propertyId),
            ]);

            setProperty(propertyData);
            setUnits(unitsData);
            setTenants(tenantsData);
            setIssues(issuesData);
            setLeases(leasesData);
            setAnnouncements(announcementsData);
            setRules(rulesData);
            setFaqs(faqsData);

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

    // Handle refresh
    const handleRefresh = async () => {
        await loadData();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-500/30 rounded-xl p-6 max-w-md text-center">
                    <p className="text-rose-700 dark:text-rose-400 font-medium">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Get property ID from any available source
    const propertyId = dashboardData?.assigned_property_id || property?.id || "";

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Property Summary Header */}
            <IdentityCard
                caretaker={dashboardData}
                property={property}
                onRefresh={handleRefresh}
                isRefreshing={refreshing}
            />

            {/* Compact Quick Stats */}
            <QuickStats
                totalRooms={dashboardData?.total_rooms || units.length}
                occupiedRooms={dashboardData?.occupied_rooms || units.filter(u => u.availability_status === "OCCUPIED").length}
                vacantRooms={dashboardData?.vacant_rooms || units.filter(u => u.availability_status === "AVAILABLE").length}
                tenantsCount={dashboardData?.tenants_count || tenants.length}
                pendingIssues={dashboardData?.pending_issues_count || issues.filter(i => i.status === "PENDING").length}
                resolvedIssues={dashboardData?.resolved_issues_count || issues.filter(i => i.status === "RESOLVED").length}
                pendingRepairs={dashboardData?.pending_repairs_count || 0}
                solvedRepairs={dashboardData?.solved_repairs_count || 0}
                pendingApplications={dashboardData?.pending_applications_count || 0}
                incomingAnnouncements={announcements.incoming.length}
            />

            {/* Quick Actions - Compact */}
            <ActionGrid
                onTabChange={setActiveTab}
                activeTab={activeTab}
                pendingApplicationsCount={dashboardData?.pending_applications_count || 0}
            />

            {/* Navigation Tabs */}
            <div className="border-b border-slate-200 dark:border-white/10">
                <nav className="flex gap-1 overflow-x-auto">
                    {[
                        { id: "overview", label: "Overview" },
                        { id: "units", label: `Units (${units.length})` },
                        { id: "tenants", label: `Tenants (${tenants.length})` },
                        { id: "issues", label: `Issues (${issues.filter(i => i.status === "PENDING").length})` },
                        { id: "leases", label: `Leases (${leases.length})` },
                        { id: "announcements", label: "Announcements" },
                        { id: "rules", label: "Rules & FAQ" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                                activeTab === tab.id
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="pb-8">
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        {/* Property Details Card */}
                        {property && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 p-5">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Property Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400">Property Name</span>
                                        <p className="font-medium text-slate-900 dark:text-white">{property.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400">Location</span>
                                        <p className="font-medium text-slate-900 dark:text-white">{property.location || "Not set"}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400">Type</span>
                                        <p className="font-medium text-slate-900 dark:text-white">{property.property_type || "Not set"}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400">Status</span>
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                            property.verification_status === "VERIFIED"
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                                : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                                        }`}>
                                            {property.verification_status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recent Activity Summary */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Issues */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Issues</h3>
                                    <button
                                        onClick={() => setActiveTab("issues")}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        View all
                                    </button>
                                </div>
                                {issues.slice(0, 3).map((issue) => (
                                    <div key={issue.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{issue.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Room {issue.unit?.room_number || "N/A"}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                            issue.status === "PENDING" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                                            issue.status === "RESOLVED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                                            "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                                        }`}>
                                            {issue.status}
                                        </span>
                                    </div>
                                ))}
                                {issues.length === 0 && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">No issues reported</p>
                                )}
                            </div>

                            {/* Recent Tenants */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Tenants</h3>
                                    <button
                                        onClick={() => setActiveTab("tenants")}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        View all
                                    </button>
                                </div>
                                {tenants.slice(0, 3).map((tenant) => (
                                    <div key={tenant.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{tenant.full_name || "Unknown"}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Room {tenant.room_number || tenant.unit?.room_number || "N/A"}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                            tenant.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                                            "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400"
                                        }`}>
                                            {tenant.status}
                                        </span>
                                    </div>
                                ))}
                                {tenants.length === 0 && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">No tenants</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "units" && propertyId && (
                    <UnitsPanel
                        units={units}
                        propertyId={propertyId}
                        onDataChange={handleRefresh}
                    />
                )}

                {activeTab === "tenants" && propertyId && (
                    <TenantsPanel
                        tenants={tenants}
                        units={units}
                        propertyId={propertyId}
                    />
                )}

                {activeTab === "issues" && propertyId && (
                    <IssuesPanel
                        issues={issues}
                        propertyId={propertyId}
                        onDataChange={handleRefresh}
                    />
                )}

                {activeTab === "leases" && propertyId && (
                    <LeasesPanel
                        leases={leases}
                        propertyId={propertyId}
                    />
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
                    <RulesFaqsPanel
                        rules={rules}
                        faqs={faqs}
                        propertyId={propertyId}
                        onDataChange={handleRefresh}
                    />
                )}
            </div>
        </div>
    );
}
