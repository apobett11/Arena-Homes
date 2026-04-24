"use client";

import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { IssueApi, Issue } from "@/lib/api/domains/issues";

interface IssueFeedProps {
    count?: number;
    loading?: boolean;
}

export default function IssueFeed({ count, loading }: IssueFeedProps) {
    const [recentIssues, setRecentIssues] = useState<any[]>([]);

    useEffect(() => {
        if (!loading) {
            IssueApi.getAll().then(allIssues => {
                const open = allIssues
                    .filter(i => i.priority === 'HIGH' || i.priority === 'URGENT') // Focus on critical/high first
                    .slice(0, 3);

                // If not enough critical, fill with others
                if (open.length < 3) {
                    const others = allIssues.filter(i => i.priority !== 'HIGH' && i.priority !== 'URGENT').slice(0, 3 - open.length);
                    open.push(...others);
                }

                setRecentIssues(open.map(i => {
                    let color = 'text-green-500';
                    let bg = 'bg-green-500/10';
                    if (i.priority === 'URGENT' || i.priority === 'CRITICAL') { color = 'text-red-500'; bg = 'bg-red-500/10'; }
                    else if (i.priority === 'HIGH') { color = 'text-orange-500'; bg = 'bg-orange-500/10'; }
                    else if (i.priority === 'MEDIUM') { color = 'text-yellow-500'; bg = 'bg-yellow-500/10'; }

                    return {
                        id: `#${i.id.substring(0, 8)}`,
                        title: i.title,
                        priority: i.priority,
                        time: new Date(i.createdAt).toLocaleDateString(), // Simplification
                        color,
                        bg
                    };
                }));
            }).catch(console.error);
        }
    }, [loading]);

    return (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-6 bg-red-500 rounded-full" />
                    Critical Issues
                </h3>
                {count !== undefined && count > 0 && (
                    <span className="px-2 py-1 rounded bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold animate-pulse">
                        {count} Active
                    </span>
                )}
            </div>

            <div className="space-y-4">
                {recentIssues.length === 0 && !loading && <div className="text-slate-500 text-sm">No critical issues.</div>}

                {recentIssues.map((issue, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-600 transition-colors group cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-mono text-slate-500">{issue.id}</span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${issue.bg} ${issue.color}`}>
                                {issue.priority}
                            </span>
                        </div>
                        <h4 className="text-sm font-semibold text-white mb-2 group-hover:text-[#0066FF] transition-colors">{issue.title}</h4>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {issue.time}
                            </div>
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-[#0066FF]" />
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full mt-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-300 hover:text-white transition-all">
                View All Incident Reports
            </button>
        </div>
    );
}
