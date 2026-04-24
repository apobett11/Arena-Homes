"use client";

import { FileText, Download, Calendar, ArrowRight, PieChart } from "lucide-react";
import { useRef, useEffect } from "react";
import gsap from "gsap";

export default function FinancialReports() {
    const sectionRef = useRef<HTMLDivElement>(null);

    const reports = [
        { name: "Balance Sheet", date: "Jan 2025", type: "PDF" },
        { name: "Income Statement", date: "Jan 2025", type: "PDF" },
        { name: "Tax Prep Bundle", date: "2024 Final", type: "ZIP" },
    ];

    useEffect(() => {
        if (sectionRef.current) {
            gsap.from(sectionRef.current.children, {
                y: 20,
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
                    <FileText className="w-5 h-5 text-[#0066FF]" />
                    Financial Reports
                </h3>
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Next Gen: Feb 5
                </span>
            </div>

            <div ref={sectionRef} className="space-y-6">
                {/* Generator Status */}
                <div className="p-4 rounded-lg bg-[#0066FF]/10 border border-[#0066FF]/20">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-[#0066FF]">Monthly Generator</h4>
                        <span className="text-xs text-[#0066FF] font-bold">Active</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                        Scheduled to generate specific financial documents on the 5th of every month.
                    </p>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0066FF] w-[75%]" />
                    </div>
                </div>

                {/* Recent Reports */}
                <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recent Documents</h4>
                    <div className="space-y-2">
                        {reports.map((report, idx) => (
                            <div key={idx} className="group flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 border border-transparent hover:border-slate-700 transition-all cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-[#0066FF] group-hover:text-white transition-colors">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white group-hover:text-[#0066FF] transition-colors">{report.name}</div>
                                        <div className="text-[10px] text-slate-500">{report.date} • {report.type}</div>
                                    </div>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-700 rounded-full transition-all">
                                    <Download className="w-4 h-4 text-slate-300" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-2">
                    <button className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium text-white transition-all flex items-center justify-center gap-2 group">
                        View All Documents
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
