"use client";

import { Megaphone, UserPlus, StopCircle, FileText, CheckCircle, Plus } from "lucide-react";

const actions = [
    { label: "New Broadcast", icon: Megaphone, color: "text-[#0066FF]", bg: "bg-[#0066FF]/10", border: "border-[#0066FF]/20", enabled: true },
    { label: "Add Employee", icon: UserPlus, color: "text-[#00D084]", bg: "bg-[#00D084]/10", border: "border-[#00D084]/20", enabled: true },
    { label: "Flag / Suspend", icon: StopCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", enabled: false },
    { label: "Process Payroll", icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", enabled: true },
    { label: "Resolve Issue", icon: CheckCircle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", enabled: true },
    { label: "Add Plot", icon: Plus, color: "text-slate-300", bg: "bg-slate-700/50", border: "border-slate-600/50", enabled: false },
];

export default function ActionGrid() {
    return (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 h-full">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#0066FF] rounded-full" />
                Command Center
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {actions.map((action, idx) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={idx}
                            disabled={!action.enabled}
                            className={`relative flex flex-col items-center justify-center py-4 px-2 rounded-xl border ${action.bg} ${action.border} hover:scale-[1.03] active:scale-95 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <Icon className={`w-6 h-6 mb-2 ${action.color} group-hover:drop-shadow-md`} />
                            <span className="text-xs font-semibold text-slate-300 text-center">{action.label}</span>
                            {!action.enabled && (
                                <span className="mt-1 rounded-full border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-400">
                                    Coming soon
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
