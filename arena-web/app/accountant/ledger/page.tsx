"use client";

import { useEffect, useState } from "react";
import LedgerPreview from "@/components/accountant/LedgerPreview";
import { LedgerApi, LedgerTransaction } from "@/lib/api/domains/ledger";

export default function LedgerPage() {
    const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);

    useEffect(() => {
        LedgerApi.getTransactions().then(setTransactions).catch(console.error);
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white mb-4">General Ledger</h1>
            <p className="text-slate-400 mb-8">View and manage all financial transactions across properties.</p>

            <LedgerPreview />
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 md:p-6">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Latest Transactions</h2>
                <div className="space-y-2">
                    {transactions.slice(0, 20).map((t) => (
                        <div key={t.id} className="rounded border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300">
                            {t.description || "Ledger transaction"} - {new Date(t.postedAt).toLocaleString()}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
