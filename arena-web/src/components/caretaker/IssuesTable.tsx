"use client";

import React from "react";
import { AlertTriangle, Clock, CheckCircle, Forward, Wrench, MoreVertical } from "lucide-react";

const issues = [
    { id: 1, room: "A3", desc: "Leaking faucet in bathroom", tenant: "John Doe", status: "pending", date: "20 Jan" },
    { id: 2, room: "B1", desc: "Door handle broken", tenant: "Anonymous", status: "in-progress", date: "19 Jan" },
    { id: 3, room: "C5", desc: "Internet connection unstable", tenant: "Alice Smith", status: "resolved", date: "18 Jan" },
];

export const IssuesTable = () => {
    return (
        <section className="mb-12" id="maintenance">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Maintenance & Issues
                </h2>
                <div className="flex gap-2">
                    <button className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold transition-all hover:bg-rose-700 shadow-sm">
                        New Ticket
                    </button>
                    <button className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all hover:bg-black shadow-sm">
                        Export Log
                    </button>
                </div>
            </div>

            <div className="glass rounded-3xl overflow-hidden border border-slate-200 dark:border-white/15 shadow-xl bg-white dark:bg-slate-900/40">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-300 dark:border-white/15">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Room</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Issue Description</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Tenant</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Date</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                            {issues.map((issue) => (
                                <tr key={issue.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="bg-slate-100 dark:bg-slate-800 text-black dark:text-white font-bold px-2 py-1 rounded text-xs border border-slate-200 dark:border-white/10">
                                            {issue.room}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{issue.desc}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-600 dark:text-slate-300 font-bold">{issue.tenant}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={issue.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-slate-500 dark:text-slate-500 font-bold">{issue.date}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 rounded-lg hover:bg-emerald-500/20 text-emerald-400 opacity-0 group-hover:opacity-100 transition-all" title="Resolve">
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 rounded-lg hover:bg-electric/20 text-electric opacity-0 group-hover:opacity-100 transition-all" title="Forward to Admin">
                                                <Forward className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 rounded-lg hover:bg-white/10 text-slate-400">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="glass p-5 rounded-3xl border border-slate-200 dark:border-white/15 flex items-center justify-between bg-white dark:bg-slate-900/40">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-400/10 flex items-center justify-center border border-amber-400/20">
                            <Wrench className="text-amber-700 dark:text-amber-400 w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest">Technician On Call</p>
                            <p className="text-slate-900 dark:text-white font-bold">Maintenance Team Delta</p>
                        </div>
                    </div>
                    <button className="text-primary text-xs font-bold hover:underline uppercase tracking-tight">Contact</button>
                </div>
                <div className="glass p-5 rounded-3xl border border-slate-200 dark:border-white/15 flex items-center justify-between bg-white dark:bg-slate-900/40">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-400/10 flex items-center justify-center border border-blue-400/20">
                            <Clock className="text-blue-700 dark:text-blue-400 w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest">Avg. Resolution Time</p>
                            <p className="text-slate-900 dark:text-white font-bold">14 Hours</p>
                        </div>
                    </div>
                    <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest">-12% this week</p>
                </div>
            </div>
        </section>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case "pending":
            return (
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                    <AlertTriangle className="w-3 h-3" /> Pending
                </span>
            );
        case "in-progress":
            return (
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20">
                    <Wrench className="w-3 h-3" /> Fixing
                </span>
            );
        case "resolved":
            return (
                <span className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                    <CheckCircle className="w-3 h-3" /> Fixed
                </span>
            );
        default:
            return null;
    }
};
