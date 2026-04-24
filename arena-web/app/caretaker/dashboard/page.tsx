"use client";

import React, { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IdentityCard } from "@/components/caretaker/IdentityCard";
import { PlotMap } from "@/components/caretaker/PlotMap";
import { ActionGrid } from "@/components/caretaker/ActionGrid";
import { QuickStats } from "@/components/caretaker/QuickStats";
import { RecentActivity } from "@/components/caretaker/RecentActivity";
import { RoomsInventory } from "@/components/caretaker/RoomsInventory";
import { IssuesTable } from "@/components/caretaker/IssuesTable";
import { AnalyticsModule } from "@/components/caretaker/AnalyticsModule";
import { ApplicationManager } from "@/components/caretaker/ApplicationManager";

import { IssueApi } from "@/lib/api/domains/issues";
import { MaintenanceApi } from "@/lib/api/domains/maintenance";
import { PropertyApi } from "@/lib/api/domains/properties";

export default function CaretakerDashboard() {
    const [stats, setStats] = useState({
        totalOpenIssues: 0,
        pendingMaintenance: 0,
        vacantUnits: 0,
        totalUnits: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        async function loadData() {
            try {
                const [issues, maintenance, units] = await Promise.all([
                    IssueApi.getAll(),
                    MaintenanceApi.getAll(),
                    PropertyApi.getUnits() // Assumption: Caretaker sees all or backend filters
                ]);

                const openIssues = issues.filter(i => i.status === 'OPEN').length;
                const pendingMaint = maintenance.filter(m => m.status === 'SCHEDULED').length;
                const vacant = units.filter(u => u.status === 'VACANT').length;

                setStats({
                    totalOpenIssues: openIssues,
                    pendingMaintenance: pendingMaint,
                    vacantUnits: vacant,
                    totalUnits: units.length
                });

            } catch (err) {
                console.error("Failed to load caretaker data", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();

        // Reveal animation (delayed slightly to wait for layout)
        const sections = document.querySelectorAll("section, .reveal-module");
        sections.forEach((section) => {
            gsap.fromTo(
                section,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: section,
                        start: "top 85%",
                        toggleActions: "play none none none",
                    },
                }
            );
        });
    }, []);

    return (
        <div className="space-y-6">
            {/* Identity & Top Stats */}
            <IdentityCard />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                {/* Left Column - Main Map & Actions */}
                <div className="xl:col-span-2 space-y-8">
                    <PlotMap />
                    <QuickStats stats={stats} loading={loading} />
                    <ActionGrid />
                </div>

                {/* Right Column - Secondary Info */}
                <div className="space-y-8">
                    <ApplicationManager />
                    <RecentActivity />
                    <AnalyticsModule />

                    {/* Quick Plot Rules Teaser */}
                    <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-white/15 reveal-module bg-white dark:bg-slate-900/40 shadow-sm">
                        <h3 className="text-slate-900 dark:text-white font-bold mb-4 uppercase tracking-widest text-sm">Plot Rules Overview</h3>
                        <ul className="space-y-3">
                            {["No loud music after 10 PM", "Ensure gate is locked at all times", "No sub-letting allowed", "Garbage collection every Tuesday"].map((rule, i) => (
                                <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-200 font-medium">
                                    <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-bold text-[10px]">{i + 1}</span>
                                    {rule}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full mt-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-white text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-900 transition-all border border-slate-200 dark:border-white/10 uppercase tracking-widest">
                            Update Rules
                        </button>
                    </div>
                </div>
            </div>

            {/* Full Width Modules */}
            <div className="pt-8 border-t border-slate-200 dark:border-white/10 space-y-12">
                <RoomsInventory vacantCount={stats.vacantUnits} totalCount={stats.totalUnits} />
                <IssuesTable />
            </div>

            {/* Lease & Payments Registry Teaser */}
            <section className="glass rounded-3xl p-8 border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-950 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Lease & Payments Registry</h2>
                        <p className="text-slate-600 dark:text-slate-300 mt-2 max-w-xl font-medium">
                            Access official lease documents, payment history (past 4 months), and export reports for audit.
                        </p>
                        <div className="flex gap-4 mt-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Late Payments</span>
                                <span className="text-xl font-bold text-rose-600 dark:text-rose-400">3 Cases</span>
                            </div>
                            <div className="w-px h-10 bg-slate-200 dark:bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Expiring Soon</span>
                                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">5 Leases</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <button className="px-8 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg uppercase tracking-widest">
                            EXPORT PDF
                        </button>
                        <button className="px-8 py-3 bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-white border border-slate-300 dark:border-white/10 rounded-2xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-800 transition-all uppercase tracking-widest">
                            VIEW ALL LEASES
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
