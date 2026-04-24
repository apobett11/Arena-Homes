"use client"

import React, { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { DashboardLayout } from "@/components/it-support/DashboardLayout"
import { HealthHeatmap } from "@/components/it-support/HealthHeatmap"
import { CoreStats } from "@/components/it-support/CoreStats"
import { ActionGrid } from "@/components/it-support/ActionGrid"
import { RecentActivity, LogsViewer, DiagnosticsPanel } from "@/components/it-support/DashboardWidgets"
import { TicketQueue, IntegrationsMonitor } from "@/components/it-support/ManagementWidgets"
import { SearchAnalytics, SecurityNexus } from "@/components/it-support/AnalyticsWidgets"
import { PerformanceMonitor } from "@/components/it-support/PerformanceMonitor"
import { SystemApi, SystemHealth, SystemLog } from "@/lib/api/domains/system"
import { IssueApi } from "@/lib/api/domains/issues"

export default function ITDashboardPage() {
    const containerRef = useRef<HTMLDivElement>(null)
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!containerRef.current) return;

        const ctx = gsap.context(() => {
            // Staggered entrance for main sections
            gsap.from(".dashboard-section", {
                y: 30,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: "power3.out",
                delay: 0.2
            })
        }, containerRef)

        async function loadData() {
            try {
                const [sysHealth, sysLogs, allTickets] = await Promise.all([
                    SystemApi.getHealth(),
                    SystemApi.getLogs(),
                    IssueApi.getAll()
                ]);
                setHealth(sysHealth);
                setLogs(sysLogs);
                setTickets(allTickets);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadData();

        return () => ctx.revert()
    }, [])

    return (
        <DashboardLayout>
            <div ref={containerRef} className="space-y-6 md:space-y-8">

                {/* Section 1: System Health Overview */}
                <section className="dashboard-section grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto min-h-[350px]">
                    <div className="lg:col-span-2 h-full">
                        <HealthHeatmap />
                    </div>
                    <div className="h-full">
                        <CoreStats health={health} loading={loading} />
                    </div>
                </section>

                {/* Section 2: Action Grid */}
                <section className="dashboard-section">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#0066FF] rounded-full"></span> Quick Actions
                    </h2>
                    <ActionGrid />
                </section>

                {/* Section 3: Comprehensive Monitoring & Management */}
                <section className="dashboard-section grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Column 1: Monitoring Stream */}
                    <div className="space-y-4">
                        <div className="h-[300px]">
                            <LogsViewer logs={logs} loading={loading} />
                        </div>
                        <div className="h-auto">
                            <DiagnosticsPanel />
                        </div>
                    </div>

                    {/* Column 2: User Support & Integrations */}
                    <div className="space-y-4">
                        <TicketQueue tickets={tickets} loading={loading} />
                        <PerformanceMonitor />
                        <div className="h-auto">
                            <IntegrationsMonitor />
                        </div>
                    </div>

                    {/* Column 3: Recent Activity & Security/Analytics */}
                    <div className="space-y-4">
                        <RecentActivity />
                        <SearchAnalytics />
                        <SecurityNexus />
                    </div>

                </section>
            </div>
        </DashboardLayout>
    )
}
