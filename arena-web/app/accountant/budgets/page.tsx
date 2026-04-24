"use client";

import { useEffect, useState } from "react";
import BudgetManager from "@/components/accountant/BudgetManager";
import { BudgetApi, Budget } from "@/lib/api/domains/budgets";

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [name, setName] = useState("");
    const [totalAmount, setTotalAmount] = useState("");

    async function load() {
        const data = await BudgetApi.getAll();
        setBudgets(data);
    }

    useEffect(() => {
        load().catch(console.error);
    }, []);

    async function createBudget(e: React.FormEvent) {
        e.preventDefault();
        const start = new Date();
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        await BudgetApi.create({
            name,
            totalAmount,
            periodStart: start.toISOString(),
            periodEnd: end.toISOString(),
        });
        setName("");
        setTotalAmount("");
        await load();
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white mb-4">Budgeting & Allocations</h1>
            <p className="text-slate-400 mb-8">Create budgets, set caps, and track variance.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BudgetManager />

                <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-6 space-y-3">
                    <form onSubmit={createBudget} className="flex flex-wrap gap-2">
                        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Budget name" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required placeholder="Total amount" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <button className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Create</button>
                    </form>
                    <div className="space-y-2">
                        {budgets.map((b) => (
                            <div key={b.id} className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300">
                                {b.name} - {b.totalAmount} - {b.status}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
