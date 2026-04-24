"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import AdminTopBar from "@/components/admin/AdminTopBar";
import AdminProfileCard from "@/components/admin/AdminProfileCard";
import GlobalAnalytics from "@/components/admin/GlobalAnalytics";
import ActionGrid from "@/components/admin/ActionGrid";
import EmployeeStatus from "@/components/admin/EmployeeStatus";
import IssueFeed from "@/components/admin/IssueFeed";

// API Clients
import { PropertyApi } from "@/lib/api/domains/properties";
import { TenantApi } from "@/lib/api/domains/tenants";
import { UsersApi } from "@/lib/api/domains/users";
import { IssueApi } from "@/lib/api/domains/issues";
import { FinanceApi } from "@/lib/api/domains/finance";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalProperties: 0,
        totalUnits: 0,
        activeTenants: 0,
        occupancyRate: 0,
        totalStaff: 0,
        openIssues: 0,
        netProfit: 0 // Placeholder until real finance logic
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Animation
        const ctx = gsap.context(() => {
            gsap.from(".animate-section", {
                opacity: 0,
                y: 30,
                duration: 0.8,
                stagger: 0.2,
                ease: "power2.out",
                delay: 0.3
            });
        });

        // Data Fetching
        async function loadData() {
            try {
                const [properties, tenants, users, issues, snapshots] = await Promise.all([
                    PropertyApi.getAll(),
                    TenantApi.getAll(),
                    UsersApi.getAll(),
                    IssueApi.getAll(),
                    FinanceApi.getSnapshots()
                ]);

                // Calculate aggregates
                const totalProperties = properties.length;
                // Units not returned in getAll properties usually? Need check. Assuming simplified for now.
                // Or fetch units separately.
                const units = await PropertyApi.getUnits();
                const totalUnits = units.length;

                const activeTenants = tenants.filter(t => t.status === 'ACTIVE').length;
                const occupancyRate = totalUnits > 0 ? (activeTenants / totalUnits) * 100 : 0;

                // Staff (Roles except Tenant)
                const totalStaff = users.filter(u => u.roleId !== 'TENANT').length;

                const openIssues = issues.filter(i => i.status === 'OPEN').length;

                // Finance (Latest snapshot)
                const latestSnapshot = snapshots[snapshots.length - 1];
                const netProfit = latestSnapshot ? parseFloat(latestSnapshot.netProfit) : 0;

                setStats({
                    totalProperties,
                    totalUnits,
                    activeTenants,
                    occupancyRate: Math.round(occupancyRate),
                    totalStaff,
                    openIssues,
                    netProfit
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
                    <GlobalAnalytics stats={stats} loading={loading} />
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
                            <IssueFeed count={stats.openIssues} />
                        </div>
                    </div>
                </section>

                {/* 4. Footer Note */}
                <footer className="pt-8 text-center text-slate-600 text-xs">
                    <p>Arena Homes Operating System v2.4.0 • Authorized Personnel Only</p>
                </footer>
            </div>
        </div>
    );
}
