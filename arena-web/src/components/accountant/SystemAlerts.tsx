"use client";

import { AlertTriangle, CheckCircle, FileText, Info, XCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function SystemAlerts() {
    const listRef = useRef<HTMLDivElement>(null);

    const alerts = [
        {
            id: 1,
            title: "Payment Discrepancy",
            description: "Unit 4B payment of $1200 does not match lease agreement ($1250).",
            type: "critical",
            time: "2 hours ago"
        },
        {
            id: 2,
            title: "Budget Cap Warning",
            description: "Maintenance allocation is at 92% utilization.",
            type: "warning",
            time: "5 hours ago"
        },
        {
            id: 3,
            title: "Gap Detected",
            description: "Missing receipt for Transaction #TRX-9921 (Plumbing).",
            type: "critical",
            time: "1 day ago"
        },
    ];

    useEffect(() => {
        if (listRef.current) {
            gsap.from(listRef.current.children, {
                x: -20,
                opacity: 0,
                duration: 0.5,
                stagger: 0.1,
                ease: "power2.out",
                delay: 0.5
            });
        }
    }, []);

    return (
        <div className="rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50 p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    System Alerts
                </h3>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Auto-Scan Active
                </span>
            </div>

            <div ref={listRef} className="space-y-4">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className={`group p-4 rounded-lg border transition-all duration-300 hover:scale-[1.02] cursor-pointer ${alert.type === 'critical'
                                ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                                : 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
                            }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 w-2 h-2 rounded-full ${alert.type === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                                    }`} />
                                <div>
                                    <h4 className="text-sm font-medium text-white mb-1">{alert.title}</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">{alert.description}</p>
                                </div>
                            </div>
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">{alert.time}</span>
                        </div>
                        <div className="mt-3 pl-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors">
                                Resolve
                            </button>
                            <button className="text-xs px-2 py-1 rounded hover:bg-slate-800 text-slate-300 transition-colors">
                                Details
                            </button>
                        </div>
                    </div>
                ))}

                {alerts.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                        System checks clear. No discrepancies found.
                    </div>
                )}
            </div>
        </div>
    );
}
