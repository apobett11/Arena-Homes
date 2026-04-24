"use client";

import { Users, Building, Wallet, AlertTriangle, ArrowUp, ArrowDown, Activity } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";

const metrics = [
    {
        label: "Total Tenants",
        value: "1,248",
        change: "+12",
        trend: "up",
        icon: Users,
        color: "#0066FF",
    },
    {
        label: "Occupancy Rate",
        value: "94.2%",
        change: "+2.4%",
        trend: "up",
        icon: Building,
        color: "#00D084",
    },
    {
        label: "Monthly Revenue",
        value: "$482.5k",
        change: "+8.1%",
        trend: "up",
        icon: Wallet,
        color: "#8B5CF6",
    },
    {
        label: "Active Issues",
        value: "14",
        change: "-3",
        trend: "down",
        icon: AlertTriangle,
        color: "#F59E0B",
        isInverse: true, // For issues, down is good
    },
];

interface GlobalAnalyticsProps {
    stats?: {
        totalProperties: number;
        totalUnits: number;
        activeTenants: number;
        occupancyRate: number;
        totalStaff: number;
        openIssues: number;
        netProfit: number;
    };
    loading?: boolean;
}

export default function GlobalAnalytics({ stats, loading }: GlobalAnalyticsProps) {
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
            label: "Total Tenants",
            value: stats?.activeTenants ?? "-",
            change: "Live", // API doesn't give historical data for simplicity yet
            trend: "up",
            icon: Users,
            color: "#0066FF",
        },
        {
            label: "Occupancy Rate",
            value: stats ? `${stats.occupancyRate}%` : "-",
            change: "Live",
            trend: "up",
            icon: Building,
            color: "#00D084",
        },
        {
            label: "Net Profit (YTD)", // Assuming YTD or Monthly based on Snapshot
            value: stats ? `KES ${stats.netProfit.toLocaleString()}` : "-",
            change: "Monthly",
            trend: "up",
            icon: Wallet,
            color: "#8B5CF6",
        },
        {
            label: "Active Issues",
            value: stats?.openIssues ?? "-",
            change: "Pending",
            trend: "down", // Assume down (red icon if up?)
            icon: AlertTriangle,
            color: "#F59E0B",
            isInverse: true,
        },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-slate-800/50 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, idx) => {
                const Icon = metric.icon;
                const isPositive = true; // Hardcoded for simplified view until trend calculation
                const isGoodTrend = metric.isInverse ? metric.value === 0 : true;
                const trendColor = "text-slate-400"; // Neutral for now
                const TrendIcon = Activity; // Generic icon since we don't have change data

                return (
                    <div key={idx} className="group relative overflow-hidden rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0066FF]/5 cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-lg bg-opacity-10`} style={{ backgroundColor: `${metric.color}20` }}>
                                <Icon className="w-6 h-6" style={{ color: metric.color }} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-slate-800/30 text-slate-400`}>
                                <TrendIcon className="w-3 h-3" />
                                {metric.change}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">{metric.value}</h3>
                            <p className="text-sm text-slate-400 font-medium">{metric.label}</p>
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                );
            })}
        </div>
    );
}
