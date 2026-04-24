"use client";

import { useEffect, useState } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { FinanceApi, FinancialSnapshot } from "@/lib/api/domains/finance";

export default function AdminFinancePage() {
    const [snapshots, setSnapshots] = useState<FinancialSnapshot[]>([]);

    useEffect(() => {
        FinanceApi.getSnapshots().then(setSnapshots).catch(console.error);
    }, []);

    return (
        <div className="min-h-screen pb-24 lg:pb-8">
            <AdminTopBar />
            <div className="p-4 md:p-6 lg:p-8">
                <h1 className="text-3xl font-bold text-white mb-4">Financial Overview</h1>
                <p className="text-slate-400">Global revenue tracking and expense auditing.</p>
                <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/50 p-4 md:p-6">
                    <div className="grid gap-3">
                        {snapshots.map((s) => (
                            <div key={s.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
                                {s.month}/{s.year} - Income {s.totalIncome} - Expenses {s.totalExpenses} - Net {s.netProfit}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
