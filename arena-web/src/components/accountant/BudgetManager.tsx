"use client";

import { PieChart, Plus, ArrowRight, Target } from "lucide-react";

export default function BudgetManager() {
    const allocations = [
        { category: "Maintenance", allocated: 5000, spent: 4600, color: "#EF4444" },
        { category: "Utilities", allocated: 3000, spent: 2100, color: "#F59E0B" },
        { category: "Staff", allocated: 8000, spent: 7800, color: "#00D084" },
    ];

    return (
        <div className="rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50 p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-500" />
                    Budgets & Allocations
                </h3>
                <button className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 transition-colors">
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-5 flex-1">
                {allocations.map((item, idx) => {
                    const percent = Math.min((item.spent / item.allocated) * 100, 100);
                    return (
                        <div key={idx} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-300 font-medium">{item.category}</span>
                                <span className="text-slate-500">
                                    ${item.spent.toLocaleString()} <span className="text-slate-600">/ ${item.allocated.toLocaleString()}</span>
                                </span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-1000"
                                    style={{
                                        width: `${percent}%`,
                                        backgroundColor: item.color
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="pt-6 mt-auto">
                <button className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-medium text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20">
                    Manage Allocations
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
