"use client";

import { useEffect, useState } from "react";
import FinancialReports from "@/components/accountant/FinancialReports";
import { FinanceApi, FinancialSnapshot } from "@/lib/api/domains/finance";

export default function ReportsPage() {
    const [snapshots, setSnapshots] = useState<FinancialSnapshot[]>([]);

    useEffect(() => {
        FinanceApi.getSnapshots().then(setSnapshots).catch(console.error);
    }, []);

    async function generateCurrentSnapshot() {
        const now = new Date();
        await FinanceApi.generateSnapshot(now.getMonth() + 1, now.getFullYear());
        const next = await FinanceApi.getSnapshots();
        setSnapshots(next);
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white mb-4">Financial Reports</h1>
            <p className="text-slate-400 mb-8">Generate, download, and file monthly financial statements.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FinancialReports />

                <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-6">
                    <div className="space-y-3">
                        <button onClick={generateCurrentSnapshot} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                            Generate Current Month Snapshot
                        </button>
                        <div className="space-y-2">
                            {snapshots.slice(-6).map((s) => (
                                <div key={s.id} className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300">
                                    {s.month}/{s.year} - Income {s.totalIncome} - Net {s.netProfit}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
