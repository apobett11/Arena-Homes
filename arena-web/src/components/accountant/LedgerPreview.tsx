"use client";

import { CheckCircle, AlertCircle, Clock, Search, ArrowUpRight } from "lucide-react";

export default function LedgerPreview() {
    const transactions = [
        { id: "TRX-101", desc: "Rent Payment - Unit 302", amount: "+$1,200", date: "Today, 10:42 AM", status: "verified" },
        { id: "TRX-102", desc: "Plumbing Repair - Invoice #99", amount: "-$450", date: "Today, 09:15 AM", status: "pending" },
        { id: "TRX-103", desc: "Rent Payment - Unit 105", amount: "+$1,150", date: "Yesterday", status: "verified" },
        { id: "TRX-104", desc: "Utility Bill - Water", amount: "-$320", date: "Yesterday", status: "flagged" },
        { id: "TRX-105", desc: "Rent Payment - Unit 401", amount: "+$1,300", date: "Jan 20", status: "verified" },
    ];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "verified": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case "pending": return <Clock className="w-4 h-4 text-amber-500" />;
            case "flagged": return <AlertCircle className="w-4 h-4 text-red-500" />;
            default: return null;
        }
    };

    return (
        <div className="rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-white">General Ledger</h3>
                    <p className="text-sm text-slate-400">Real-time financial tracking & verification</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            className="bg-slate-950/50 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[#0066FF] w-64"
                        />
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-[#0066FF] hover:bg-blue-600 text-white text-sm font-medium transition-colors">
                        View Full Ledger
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-700/50 text-slate-400">
                            <th className="pb-3 pl-2 font-medium">Transaction ID</th>
                            <th className="pb-3 font-medium">Description</th>
                            <th className="pb-3 font-medium">Date</th>
                            <th className="pb-3 font-medium text-right">Amount</th>
                            <th className="pb-3 pr-2 font-medium text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                        {transactions.map((trx, idx) => (
                            <tr key={idx} className="group hover:bg-slate-800/30 transition-colors">
                                <td className="py-3 pl-2 font-mono text-xs text-slate-500">{trx.id}</td>
                                <td className="py-3 text-white font-medium">{trx.desc}</td>
                                <td className="py-3 text-slate-400">{trx.date}</td>
                                <td className={`py-3 text-right font-bold ${trx.amount.startsWith('+') ? 'text-emerald-400' : 'text-white'}`}>
                                    {trx.amount}
                                </td>
                                <td className="py-3 pr-2 text-right">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs capitalize">
                                        {getStatusIcon(trx.status)}
                                        <span className="text-slate-300">{trx.status}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-center">
                <button className="text-sm text-slate-500 hover:text-[#0066FF] transition-colors flex items-center justify-center gap-1 mx-auto">
                    View 124 more transactions
                    <ArrowUpRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}
