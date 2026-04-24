"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import AccountantProfile from "@/components/accountant/AccountantProfile";
import PropertyAnalytics from "@/components/accountant/PropertyAnalytics";
import FinancialKPIs from "@/components/accountant/FinancialKPIs";
import SystemAlerts from "@/components/accountant/SystemAlerts";
import BudgetManager from "@/components/accountant/BudgetManager";
import FinancialReports from "@/components/accountant/FinancialReports";
import LedgerPreview from "@/components/accountant/LedgerPreview";
import { FinanceApi } from "@/lib/api/domains/finance";
import { PropertyApi } from "@/lib/api/domains/properties";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

export default function AccountantDashboard() {
    const [financialData, setFinancialData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // GSAP entrance animations
        const ctx = gsap.context(() => {
            // Stagger card entry
            gsap.from(".animate-card", {
                opacity: 0,
                y: 30,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out",
                delay: 0.2
            });

            // Profile card special entrance
            gsap.from(".profile-card", {
                opacity: 0,
                scale: 0.95,
                duration: 0.8,
                ease: "back.out(1.2)",
            });
        });

        // Fetch financial data
        async function loadData() {
            try {
                const [snapshots, properties] = await Promise.all([
                    FinanceApi.getSnapshots(),
                    PropertyApi.getAll()
                ]);

                const latestSnapshot = snapshots[snapshots.length - 1];

                setFinancialData({
                    totalIncome: latestSnapshot ? parseFloat(latestSnapshot.totalIncome) : 0,
                    totalExpenses: latestSnapshot ? parseFloat(latestSnapshot.totalExpenses) : 0,
                    netProfit: latestSnapshot ? parseFloat(latestSnapshot.netProfit) : 0,
                    propertyCount: properties.length,
                    snapshots: snapshots
                });
            } catch (err) {
                console.error("Failed to load financial data", err);
            } finally {
                setLoading(false);
            }
        }

        loadData();

        return () => ctx.revert();
    }, []);

    return (
        <div className="space-y-6">
            {/* Profile Section */}
            <section className="profile-card">
                <AccountantProfile />
            </section>

            {/* Financial KPIs */}
            <section className="animate-card">
                <FinancialKPIs data={financialData} loading={loading} />
            </section>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column - Analytics & Ledger (Takes 2/3 width on large screens) */}
                <div className="xl:col-span-2 space-y-6">
                    <section className="animate-card">
                        <PropertyAnalytics data={financialData} loading={loading} />
                    </section>

                    <section className="animate-card">
                        <LedgerPreview />
                    </section>
                </div>

                {/* Right Column - Alerts & Tools (Takes 1/3 width on large screens) */}
                <div className="space-y-6">
                    <section className="animate-card h-full max-h-[400px]">
                        <SystemAlerts />
                    </section>

                    <section className="animate-card h-full max-h-[400px]">
                        <BudgetManager />
                    </section>

                    <section className="animate-card h-full max-h-[400px]">
                        <FinancialReports />
                    </section>
                </div>
            </div>
        </div>
    );
}
