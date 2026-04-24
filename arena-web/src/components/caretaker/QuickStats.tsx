"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface QuickStatsProps {
    stats?: {
        totalOpenIssues: number;
        pendingMaintenance: number;
        vacantUnits: number;
        totalUnits: number;
    };
    loading?: boolean;
}

export const QuickStats = ({ stats, loading }: QuickStatsProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const occupancyRate = stats && stats.totalUnits > 0
        ? Math.round(((stats.totalUnits - stats.vacantUnits) / stats.totalUnits) * 100)
        : 0;

    const data = [
        { label: "Occupancy Rate", value: occupancyRate, suffix: "%", color: "text-blue-500", barColor: "bg-blue-500" },
        { label: "Vacant Units", value: stats?.vacantUnits ?? 0, color: "text-amber-500", barColor: "bg-amber-500" }, // Use vacant instead of pending rent
        { label: "Maintenance", value: stats?.pendingMaintenance ?? 0, color: "text-rose-500", barColor: "bg-rose-500" },
    ];

    useEffect(() => {
        if (containerRef.current && !loading) {
            const counters = containerRef.current.querySelectorAll(".stat-value");

            counters.forEach((counter) => {
                const targetValue = parseInt(counter.getAttribute("data-value") || "0");
                const obj = { val: 0 };

                gsap.to(obj, {
                    val: targetValue,
                    duration: 1.5,
                    ease: "power2.out",
                    onUpdate: () => {
                        counter.textContent = Math.floor(obj.val).toString();
                    }
                });
            });
        }
    }, [loading, stats]);

    return (
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {data.map((stat, i) => (
                <div
                    key={i}
                    className="glass rounded-3xl p-8 border border-slate-100 dark:border-white/15 flex flex-col justify-between min-h-[160px] bg-white dark:bg-slate-900/40 shadow-lg"
                >
                    <span className="text-slate-600 dark:text-slate-300 font-bold text-[11px] uppercase tracking-widest bg-slate-50 dark:bg-white/5 py-1 px-3 rounded-full self-start border border-slate-200 dark:border-transparent">
                        {stat.label}
                    </span>
                    <div className="flex items-baseline gap-2 mt-4">
                        <span
                            className={`text-6xl font-bold tracking-tighter ${stat.color} stat-value`}
                            data-value={stat.value}
                        >
                            {loading ? "-" : 0}
                        </span>
                        {stat.suffix && <span className="text-3xl font-bold text-slate-900 dark:text-white">{stat.suffix}</span>}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        {!loading && (
                            <div className="h-2 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-transparent">
                                <div
                                    className={`h-full ${stat.barColor} opacity-90 dark:opacity-50`}
                                    style={{ width: `${stat.label === 'Occupancy Rate' ? stat.value : Math.min((stat.value / 10) * 100, 100)}%` }}
                                />
                            </div>
                        )}
                        {loading && <div className="h-2 flex-1 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-full" />}
                    </div>
                </div>
            ))}
        </div>
    );
};
