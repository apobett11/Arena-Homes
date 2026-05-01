"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useRouter } from "next/navigation";
import AdminTopBar from "@/components/admin/AdminTopBar";
import AdminProfileCard from "@/components/admin/AdminProfileCard";
import GlobalAnalytics from "@/components/admin/GlobalAnalytics";
import ActionGrid from "@/components/admin/ActionGrid";
import EmployeeStatus from "@/components/admin/EmployeeStatus";
import IssueFeed from "@/components/admin/IssueFeed";
import AdminModal from "@/components/admin/AdminModal";
import { Footer } from "@/components/Footer";
import { getSupabaseClient } from "@/lib/supabase/client";
import { safeSelect } from "@/lib/supabase/safe";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalProperties: 0,
        totalUnits: 0,
        totalTenants: 0,
        activeTenants: 0,
        pendingTenants: 0,
        inactiveTenants: 0,
        occupancyRate: 0,
        totalStaff: 0,
        activeEmployees: 0,
        suspendedEmployees: 0,
        escalatedComplaints: 0,
        unresolvedComplaints: 0,
        resolvedComplaints: 0,
        pendingApprovals: 0,
        vacantUnits: 0,
        occupiedUnits: 0,
    });
    const [tenants, setTenants] = useState<any[]>([]);
    const [properties, setProperties] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [issues, setIssues] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState<null | "tenants" | "properties" | "approvals" | "complaints">(null);

    useEffect(() => {
        // Animation
        const ctx = gsap.context(() => {
            gsap.fromTo(
              ".animate-section",
              { opacity: 1, y: 0 },
              {
                opacity: 1,
                y: 0,
                duration: 0.01,
                clearProps: "opacity,transform",
              }
            );
        });

        async function loadData() {
            try {
                const [
                    propertyRows,
                    unitRows,
                    tenantRows,
                    employeeRows,
                    issueRows,
                    applicationRows,
                ] = await Promise.all([
                    safeSelect<any>("properties", (q) => q.select("*").order("created_at", { ascending: false })),
                    safeSelect<any>("units", (q) => q.select("*").order("created_at", { ascending: false })),
                    safeSelect<any>("tenants", (q) => q.select("*").order("created_at", { ascending: false })),
                    safeSelect<any>("employees", (q) => q.select("*").order("created_at", { ascending: false })),
                    safeSelect<any>("issues", (q) => q.select("*").order("created_at", { ascending: false })),
                    safeSelect<any>("tenant_applications", (q) => q.select("*").order("created_at", { ascending: false })),
                ]);

                setProperties(propertyRows);
                setUnits(unitRows);
                setTenants(tenantRows);
                setEmployees(employeeRows);
                setIssues(issueRows);
                setApplications(applicationRows);

                const totalProperties = propertyRows.length;
                const totalUnits = unitRows.length;
                const totalTenants = tenantRows.length;
                const activeTenants = tenantRows.filter((t) => t.status === "ACTIVE").length;
                const pendingTenants = tenantRows.filter((t) => t.status === "PENDING").length;
                const inactiveTenants = tenantRows.filter((t) => t.status === "INACTIVE" || t.status === "SUSPENDED" || t.status === "MOVED_OUT").length;
                const occupiedUnits = unitRows.filter((u) => u.status === "TAKEN").length;
                const vacantUnits = unitRows.filter((u) => u.status === "VACANT").length;
                const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
                const totalStaff = employeeRows.length;
                const activeEmployees = employeeRows.filter((e) => e.status === "ACTIVE").length;
                const suspendedEmployees = employeeRows.filter((e) => e.status === "SUSPENDED").length;
                const escalatedComplaints = issueRows.length;
                const unresolvedComplaints = issueRows.filter((i) => i.status !== "RESOLVED" && i.status !== "CLOSED").length;
                const resolvedComplaints = issueRows.filter((i) => i.status === "RESOLVED" || i.status === "CLOSED").length;
                const pendingApprovals = applicationRows.filter((a) => a.status === "PENDING").length;

                setStats({
                    totalProperties,
                    totalUnits,
                    totalTenants,
                    activeTenants,
                    pendingTenants,
                    inactiveTenants,
                    occupancyRate: Math.round(occupancyRate),
                    totalStaff,
                    activeEmployees,
                    suspendedEmployees,
                    escalatedComplaints,
                    unresolvedComplaints,
                    resolvedComplaints,
                    pendingApprovals,
                    vacantUnits,
                    occupiedUnits,
                });
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        }

        loadData();

        return () => ctx.revert();
    }, []);

    return (
        <div className="min-h-screen pb-24 lg:pb-8">
            <AdminTopBar />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-[1920px] mx-auto">

                {/* 1. Profile Section */}
                <section>
                    <AdminProfileCard />
                </section>

                {/* 2. Global Key Metrics */}
                <section className="animate-section">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-[#0066FF] rounded-r-md -ml-6 md:-ml-8 opacity-0 lg:opacity-100"></span>
                        Overview
                    </h2>
                    {/* Passing stats to GlobalAnalytics - Assuming I will update the component to accept them */}
                            <GlobalAnalytics
                                stats={stats}
                                loading={loading}
                                onOpenTenants={() => setOpenModal("tenants")}
                                onOpenProperties={() => setOpenModal("properties")}
                                onOpenEmployees={() => router.push("/admin/employees")}
                                onOpenApprovals={() => setOpenModal("approvals")}
                                onOpenComplaints={() => setOpenModal("complaints")}
                            />
                </section>

                {/* 3. Bento Grid - Actions, Staff, Issues */}
                <section className="animate-section">
                    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* Action Center - 1 Col */}
                        <div className="xl:col-span-1 h-full">
                            <ActionGrid />
                        </div>

                        {/* Staff Status - 1 Col */}
                        <div className="xl:col-span-1 h-full">
                            <EmployeeStatus count={stats.totalStaff} loading={loading} />
                        </div>

                        {/* Critical Issues - 1 Col */}
                        <div className="xl:col-span-2 h-full">
                            <IssueFeed count={stats.unresolvedComplaints} />
                        </div>
                    </div>
                </section>

                {/* 4. Footer */}
                <Footer />
            </div>
            <AdminModal
                open={openModal === "tenants"}
                onClose={() => setOpenModal(null)}
                title="Tenant Distribution"
            >
                {tenants.length === 0 ? (
                    <p className="text-sm text-slate-400">No tenant distribution data available yet.</p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                            <h4 className="mb-3 text-sm font-semibold text-white">By status</h4>
                            {[
                                { label: "Active", value: stats.activeTenants },
                                { label: "Pending", value: stats.pendingTenants },
                                { label: "Inactive", value: stats.inactiveTenants },
                            ].map((item) => {
                                const ratio = stats.totalTenants > 0 ? Math.round((item.value / stats.totalTenants) * 100) : 0;
                                return (
                                    <div key={item.label} className="mb-2">
                                        <div className="flex items-center justify-between text-xs text-slate-300">
                                            <span>{item.label}</span>
                                            <span>{item.value}</span>
                                        </div>
                                        <div className="mt-1 h-2 rounded-full bg-slate-800">
                                            <div className="h-2 rounded-full bg-blue-500" style={{ width: `${ratio}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                            <h4 className="mb-3 text-sm font-semibold text-white">Quick segmentation</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="rounded-lg border border-slate-800 p-3">Total: {stats.totalTenants}</div>
                                <div className="rounded-lg border border-slate-800 p-3">Approved: {stats.activeTenants}</div>
                                <div className="rounded-lg border border-slate-800 p-3">Pending: {stats.pendingTenants}</div>
                                <div className="rounded-lg border border-slate-800 p-3">Inactive: {stats.inactiveTenants}</div>
                            </div>
                        </div>
                    </div>
                )}
            </AdminModal>
            <AdminModal
                open={openModal === "properties"}
                onClose={() => setOpenModal(null)}
                title="Property Analytics"
            >
                {properties.length === 0 ? (
                    <p className="text-sm text-slate-400">No properties registered yet.</p>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <div className="rounded-lg border border-slate-800 p-3 text-sm">Total properties: {stats.totalProperties}</div>
                            <div className="rounded-lg border border-slate-800 p-3 text-sm">Total units: {stats.totalUnits}</div>
                            <div className="rounded-lg border border-slate-800 p-3 text-sm">Occupied units: {stats.occupiedUnits}</div>
                            <div className="rounded-lg border border-slate-800 p-3 text-sm">Vacant units: {stats.vacantUnits}</div>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-900">
                                    <tr className="text-left text-slate-300">
                                        <th className="px-3 py-2">Property</th>
                                        <th className="px-3 py-2">Location</th>
                                        <th className="px-3 py-2">Caretaker</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {properties.map((property) => (
                                        <tr key={property.id} className="border-t border-slate-800">
                                            <td className="px-3 py-2 text-white">{property.name || "Unnamed"}</td>
                                            <td className="px-3 py-2 text-slate-300">{property.location || "N/A"}</td>
                                            <td className="px-3 py-2 text-slate-300">{property.caretaker_id || "Unassigned"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </AdminModal>
            <AdminModal
                open={openModal === "approvals"}
                onClose={() => setOpenModal(null)}
                title="Pending Tenant Approvals"
                fullScreen
            >
                {applications.filter((app) => app.status === "PENDING").length === 0 ? (
                    <p className="text-sm text-slate-400">No pending tenant approvals right now.</p>
                ) : (
                    <div className="space-y-3">
                        {applications
                            .filter((app) => app.status === "PENDING")
                            .map((app) => (
                                <div key={app.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h4 className="font-semibold text-white">{app.full_name || "Unnamed applicant"}</h4>
                                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                                            Pending
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-300">{app.email || "No email provided"}</p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Submitted: {app.created_at ? new Date(app.created_at).toLocaleString() : "N/A"}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200">
                                            View details
                                        </button>
                                        <button disabled className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 disabled:opacity-70">
                                            Approve
                                        </button>
                                        <button disabled className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 disabled:opacity-70">
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </AdminModal>
            <AdminModal
                open={openModal === "complaints"}
                onClose={() => setOpenModal(null)}
                title="Complaints & Escalations"
            >
                {issues.length === 0 ? (
                    <p className="text-sm text-slate-400">No escalated complaints available.</p>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded-lg border border-slate-800 p-2">Total: {stats.escalatedComplaints}</div>
                            <div className="rounded-lg border border-slate-800 p-2">Unresolved: {stats.unresolvedComplaints}</div>
                            <div className="rounded-lg border border-slate-800 p-2">Resolved: {stats.resolvedComplaints}</div>
                        </div>
                        {issues.map((issue) => (
                            <div key={issue.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="font-semibold text-white">{issue.title || "Untitled complaint"}</h4>
                                    <span className="text-xs text-slate-300">{issue.priority || "MEDIUM"}</span>
                                </div>
                                <p className="mt-2 text-sm text-slate-300">{issue.description || "No description provided."}</p>
                                <p className="mt-2 text-xs text-slate-400">
                                    Status: {issue.status || "OPEN"} • Created: {issue.created_at ? new Date(issue.created_at).toLocaleString() : "N/A"}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </AdminModal>
        </div>
    );
}
