"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { safeSelect } from "@/lib/supabase/safe";
import { useRouter } from "next/navigation";

interface EmployeeStatusProps {
    count?: number;
    loading?: boolean;
}

export default function EmployeeStatus({ count, loading }: EmployeeStatusProps) {
    const router = useRouter();
    const [staff, setStaff] = useState<any[]>([]);

    useEffect(() => {
        if (!loading) {
            Promise.all([
                safeSelect<any>("employees", (q) =>
                    q.select("id,user_id,role_id,status,full_name,email").order("created_at", { ascending: false }).limit(5)
                ),
                safeSelect<any>("profiles", (q) => q.select("user_id,full_name,email")),
            ]).then(([employees, profiles]) => {
                const profileByUser = new Map(profiles.map((p) => [p.user_id, p]));
                setStaff(employees.map((employee) => {
                    const profile = profileByUser.get(employee.user_id);
                    const status = employee.status || "INACTIVE";
                    const dot =
                        status === "ACTIVE"
                            ? "bg-emerald-500"
                            : status === "SUSPENDED"
                            ? "bg-rose-500"
                            : "bg-amber-500";
                    return {
                        name: employee.full_name || profile?.full_name || employee.email || profile?.email || "Unknown",
                        role: employee.role_id,
                        status,
                        dot,
                    };
                }));
            }).catch(console.error);
        }
    }, [loading]);

    return (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-6 bg-[#00D084] rounded-full" />
                    Key Staff {count !== undefined && <span className="text-slate-500 text-sm">({count})</span>}
                </h3>
                <button onClick={() => router.push("/admin/employees")} className="text-xs text-[#0066FF] font-medium hover:text-[#00D084] transition-colors">View Directory</button>
            </div>

            <div className="space-y-4">
                {staff.length === 0 && !loading && <div className="text-slate-500 text-sm">No staff found.</div>}

                {staff.map((emp, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700">
                                {emp.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-white group-hover:text-[#0066FF] transition-colors truncate max-w-[120px]">{emp.name}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wide">{emp.role}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${emp.dot} ring-2 ring-slate-900`} />
                            <button className="text-slate-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
