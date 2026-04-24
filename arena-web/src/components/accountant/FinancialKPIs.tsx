"use client";

import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Wallet, CreditCard } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface KPI {
    id: string;
    label: string;
    value: number;
    prefix?: string;
    suffix?: string;
    trend: "up" | "down" | "neutral";
    trendValue: string;
    icon: any;
    color: string;
    bgColor: string;
}

interface FinancialKPIsProps {
    data?: {
        totalIncome: number;
        totalExpenses: number;
        netProfit: number;
        propertyCount: number;
    } | null;
    loading?: boolean;
}

export default function FinancialKPIs({ data, loading }: FinancialKPIsProps) {
    const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
    const cardsRef = useRef<HTMLDivElement>(null);

    const kpis: KPI[] = [
        {
            id: "net-profit",
            label: "Net Profit",
            value: data?.netProfit || 0,
            prefix: "KES ",
            trend: "up",
            trendValue: "Monthly",
            icon: DollarSign,
            color: "#00D084",
            bgColor: "from-emerald-500/20 to-emerald-600/20",
        },
        {
            id: "total-income",
            label: "Total Income",
            value: data?.totalIncome || 0,
            prefix: "KES ",
            trend: "up",
            trendValue: "Monthly",
            icon: Wallet,
            color: "#0066FF",
            bgColor: "from-blue-500/20 to-blue-600/20",
        },
        {
            id: "total-expenses",
            label: "Total Expenses",
            value: data?.totalExpenses || 0,
            prefix: "KES ",
            trend: "down",
            trendValue: "Monthly",
            icon: CreditCard,
            color: "#EF4444",
            bgColor: "from-red-500/20 to-red-600/20",
        },
        {
            id: "properties",
            label: "Properties Managed",
            value: data?.propertyCount || 0,
            trend: "neutral",
            trendValue: "Active",
            icon: AlertTriangle,
            color: "#F59E0B",
            bgColor: "from-amber-500/20 to-amber-600/20",
        },
    ];

    useEffect(() => {
        if (loading) return;

        // Animate cards entrance
        if (cardsRef.current) {
            gsap.from(cardsRef.current.children, {
                opacity: 0,
                y: 30,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out",
            });
        }

        // Count-up animation for values
        kpis.forEach((kpi) => {
            gsap.to({ value: 0 }, {
                value: kpi.value,
                duration: 2,
                ease: "power2.out",
                onUpdate: function () {
                    setAnimatedValues((prev) => ({
                        ...prev,
                        [kpi.id]: Math.floor(this.targets()[0].value),
                    }));
                },
            });
        });
    }, [loading, data]);

    const formatValue = (kpi: KPI) => {
        const value = animatedValues[kpi.id] || 0;
        return `${kpi.prefix || ""}${value.toLocaleString()}${kpi.suffix || ""}`;
    };

    if (loading) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-white mb-6">Financial KPIs</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-40 bg-slate-800/50 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Financial KPIs</h2>
            <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {kpis.map((kpi) => {
                    const Icon = kpi.icon;
                    const TrendIcon = kpi.trend === "up" ? TrendingUp : TrendingDown;

                    return (
                        <div
                            key={kpi.id}
                            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50 p-6 hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                        >
                            {/* Background gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                            <div className="relative z-10">
                                {/* Icon */}
                                <div className="flex items-center justify-between mb-4">
                                    <div
                                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: `${kpi.color}20` }}
                                    >
                                        <Icon className="w-6 h-6" style={{ color: kpi.color }} />
                                    </div>
                                    {kpi.trend !== "neutral" && (
                                        <div className={`flex items-center gap-1 text-xs font-medium ${kpi.trend === "up" ? "text-[#00D084]" : "text-red-400"}`}>
                                            <TrendIcon className="w-4 h-4" />
                                            <span>{kpi.trendValue}</span>
                                        </div>
                                    )}
                                    {kpi.trend === "neutral" && (
                                        <div className="text-xs font-medium text-slate-400">
                                            {kpi.trendValue}
                                        </div>
                                    )}
                                </div>

                                {/* Value */}
                                <div className="text-3xl font-bold text-white mb-2">
                                    {formatValue(kpi)}
                                </div>

                                {/* Label */}
                                <div className="text-sm text-slate-400">{kpi.label}</div>
                            </div>

                            {/* Hover glow */}
                            <div
                                className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                                style={{ backgroundColor: kpi.color }}
                            ></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
