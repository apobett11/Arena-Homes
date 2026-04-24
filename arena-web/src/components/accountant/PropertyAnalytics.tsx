"use client";

import { Home, DoorOpen, DoorClosed, TrendingUp } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import IncomeExpenseChart from "./IncomeExpenseChart";
import CashFlowChart from "./CashFlowChart";
import ExpenseCategoryChart from "./ExpenseCategoryChart";

interface PropertyAnalyticsProps {
    data?: any;
    loading?: boolean;
}

export default function PropertyAnalytics({ data, loading }: PropertyAnalyticsProps) {
    const statsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (statsRef.current && !loading) {
            gsap.from(statsRef.current.children, {
                opacity: 0,
                scale: 0.9,
                duration: 0.6,
                stagger: 0.1,
                ease: "back.out(1.2)",
            });
        }
    }, [loading]);

    const stats = [
        { label: "Total Properties", value: data?.propertyCount || 0, icon: Home, color: "#0066FF" },
        { label: "Total Income", value: `KES ${(data?.totalIncome || 0).toLocaleString()}`, icon: DoorClosed, color: "#00D084" },
        { label: "Total Expenses", value: `KES ${(data?.totalExpenses || 0).toLocaleString()}`, icon: DoorOpen, color: "#F59E0B" },
        { label: "Net Profit", value: `KES ${(data?.netProfit || 0).toLocaleString()}`, icon: TrendingUp, color: "#0066FF" },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Property & Financial Analytics</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Property & Financial Analytics</h2>

            {/* Stats Cards */}
            <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50 p-4 md:p-6 hover:scale-105 transition-all duration-300 group cursor-pointer"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: `${stat.color}20` }}
                                >
                                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                                </div>
                            </div>
                            <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                                {stat.value}
                            </div>
                            <div className="text-xs md:text-sm text-slate-400">{stat.label}</div>

                            {/* Hover glow */}
                            <div
                                className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"
                                style={{ backgroundColor: stat.color }}
                            ></div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income vs Expenses */}
                <div className="rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50 p-6 hover:shadow-2xl hover:shadow-[#0066FF]/10 transition-all duration-300">
                    <h3 className="text-lg font-semibold text-white mb-4">Income vs Expenses</h3>
                    <IncomeExpenseChart />
                </div>

                {/* Cash Flow */}
                <div className="rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50 p-6 hover:shadow-2xl hover:shadow-[#0066FF]/10 transition-all duration-300">
                    <h3 className="text-lg font-semibold text-white mb-4">Cash Flow Trend</h3>
                    <CashFlowChart />
                </div>

                {/* Expense Categories */}
                <div className="rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50 p-6 lg:col-span-2 hover:shadow-2xl hover:shadow-[#0066FF]/10 transition-all duration-300">
                    <h3 className="text-lg font-semibold text-white mb-4">Expense Breakdown</h3>
                    <ExpenseCategoryChart />
                </div>
            </div>
        </div>
    );
}
