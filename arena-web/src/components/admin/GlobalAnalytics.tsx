"use client";

import { Users, Building, AlertTriangle, Activity, UserCheck, Clock4 } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";

interface GlobalAnalyticsProps {
    stats: {
        totalProperties: number;
        totalUnits: number;
        totalTenants: number;
        activeTenants: number;
        pendingTenants: number;
        inactiveTenants: number;
        occupancyRate: number;
        totalStaff: number;
        activeEmployees: number;
        suspendedEmployees: number;
        escalatedComplaints: number;
        unresolvedComplaints: number;
        resolvedComplaints: number;
        pendingApprovals: number;
        vacantUnits: number;
        occupiedUnits: number;
    };
    loading?: boolean;
    onOpenTenants: () => void;
    onOpenProperties: () => void;
    onOpenEmployees: () => void;
    onOpenApprovals: () => void;
    onOpenComplaints: () => void;
}

export default function GlobalAnalytics({
    stats,
    loading,
    onOpenTenants,
    onOpenProperties,
    onOpenEmployees,
    onOpenApprovals,
    onOpenComplaints,
}: GlobalAnalyticsProps) {
    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (gridRef.current && !loading) {
            gsap.from(gridRef.current.children, {
                opacity: 0,
                y: 20,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out",
                delay: 0.2
            });
        }
    }, [loading]);

    const metrics = [
        {
            label: "Tenants count",
            value: stats.totalTenants,
            change: `${stats.activeTenants} active • ${stats.pendingTenants} pending`,
            icon: Users,
            color: "#0066FF",
            onClick: onOpenTenants,
        },
        {
            label: "Properties / plots",
            value: stats.totalProperties,
            change: `${stats.occupiedUnits} occupied • ${stats.vacantUnits} vacant`,
            icon: Building,
            color: "#00D084",
            onClick: onOpenProperties,
        },
        {
            label: "Employees",
            value: stats.totalStaff,
            change: `${stats.activeEmployees} active • ${stats.suspendedEmployees} suspended`,
            icon: UserCheck,
            color: "#8B5CF6",
            onClick: onOpenEmployees,
        },
        {
            label: "Occupancy rate",
            value: `${stats.occupancyRate}%`,
            change: `${stats.occupiedUnits}/${stats.totalUnits} units occupied`,
            icon: Activity,
            color: "#22c55e",
            onClick: onOpenProperties,
        },
        {
            label: "Tenants pending approval",
            value: stats.pendingApprovals,
            change: "Review pending applications",
            icon: Clock4,
            color: "#f59e0b",
            onClick: onOpenApprovals,
        },
        {
            label: "Complaints / escalations",
            value: stats.escalatedComplaints,
            change: `${stats.unresolvedComplaints} unresolved • ${stats.resolvedComplaints} resolved`,
            icon: AlertTriangle,
            color: "#ef4444",
            onClick: onOpenComplaints,
        },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-32 bg-slate-800/50 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {metrics.map((metric, idx) => {
                const Icon = metric.icon;

                return (
                    <button
                        key={idx}
                        onClick={metric.onClick}
                        className="group relative overflow-hidden rounded-xl bg-slate-900/95 hover:bg-slate-900 border border-slate-700 p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0066FF]/10 active:scale-[0.99] cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-lg bg-opacity-10`} style={{ backgroundColor: `${metric.color}20` }}>
                                <Icon className="w-6 h-6" style={{ color: metric.color }} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">{metric.value}</h3>
                            <p className="text-sm text-slate-400 font-medium">{metric.label}</p>
                            <p className="mt-2 text-xs text-slate-400">{metric.change}</p>
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </button>
                );
            })}
        </div>
    );
}
