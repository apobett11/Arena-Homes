"use client";

import { useEffect, useState } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { getSupabaseClient } from "@/lib/supabase/client";
import { safeSelect } from "@/lib/supabase/safe";

type EmployeeRow = {
    id: string;
    user_id: string;
    role_id: string;
    status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
    full_name?: string | null;
    email?: string | null;
    last_online?: string | null;
    completion_percent?: number | null;
    complaints_count?: number;
};

export default function AdminEmployeesPage() {
    const [rows, setRows] = useState<EmployeeRow[]>([]);
    const [sortBy, setSortBy] = useState<"name" | "role" | "status" | "last_online" | "completion" | "complaints">("name");
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        try {
            const [employees, profiles, issues, activity, metrics] = await Promise.all([
                safeSelect<any>("employees", (q) =>
                    q.select("id,user_id,role_id,status,full_name,email").order("created_at", { ascending: false })
                ),
                safeSelect<any>("profiles", (q) =>
                    q.select("user_id,full_name,email")
                ),
                safeSelect<any>("issues", (q) => q.select("assigned_to_id,status")),
                safeSelect<any>("employee_activity", (q) => q.select("user_id,last_online").order("last_online", { ascending: false })),
                safeSelect<any>("employee_metrics", (q) => q.select("employee_id,completion_percent")),
            ]);

            const profileByUser = new Map(profiles.map((profile) => [profile.user_id, profile]));
            const activityByUser = new Map(activity.map((item) => [item.user_id, item.last_online]));
            const metricsByEmployee = new Map(metrics.map((item) => [item.employee_id, item.completion_percent]));
            const complaintsCountByUser = new Map<string, number>();

            for (const issue of issues) {
                if (!issue.assigned_to_id) continue;
                complaintsCountByUser.set(issue.assigned_to_id, (complaintsCountByUser.get(issue.assigned_to_id) ?? 0) + 1);
            }

            const mergedRows: EmployeeRow[] = employees.map((employee) => {
                const profile = profileByUser.get(employee.user_id);
                return {
                    ...employee,
                    full_name: employee.full_name || profile?.full_name || "Unnamed employee",
                    email: employee.email || profile?.email || "No email",
                    last_online: activityByUser.get(employee.user_id) ?? null,
                    completion_percent: metricsByEmployee.get(employee.id) ?? null,
                    complaints_count: complaintsCountByUser.get(employee.user_id) ?? 0,
                };
            });

            setRows(mergedRows);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    const sortedRows = [...rows].sort((a, b) => {
        switch (sortBy) {
            case "name":
                return (a.full_name || "").localeCompare(b.full_name || "");
            case "role":
                return (a.role_id || "").localeCompare(b.role_id || "");
            case "status":
                return (a.status || "").localeCompare(b.status || "");
            case "last_online":
                return new Date(b.last_online || 0).getTime() - new Date(a.last_online || 0).getTime();
            case "completion":
                return (b.completion_percent || 0) - (a.completion_percent || 0);
            case "complaints":
                return (b.complaints_count || 0) - (a.complaints_count || 0);
            default:
                return 0;
        }
    });

    const statusClassName = (status: string) => {
        if (status === "ACTIVE") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
        if (status === "SUSPENDED") return "border-rose-500/30 bg-rose-500/10 text-rose-300";
        return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    };

    return (
        <div className="min-h-screen pb-24 lg:pb-8">
            <AdminTopBar />
            <div className="p-4 md:p-6 lg:p-8">
                <h1 className="text-3xl font-bold text-white mb-4">Employee Management</h1>
                <p className="text-slate-400">Full staff directory with activity, completion metrics, and complaint load.</p>

                <div className="mt-6 flex flex-wrap gap-2">
                    {[
                        ["name", "Name"],
                        ["role", "Role"],
                        ["status", "Status"],
                        ["last_online", "Last online"],
                        ["completion", "Job completion"],
                        ["complaints", "Complaints"],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            onClick={() => setSortBy(value as any)}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                sortBy === value
                                    ? "border-blue-500/40 bg-blue-500/15 text-blue-200"
                                    : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                            }`}
                        >
                            Sort: {label}
                        </button>
                    ))}
                </div>

                <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/50">
                    <table className="min-w-[900px] w-full text-sm">
                        <thead className="bg-slate-900/90 text-slate-300">
                            <tr>
                                <th className="px-4 py-3 text-left">Full name</th>
                                <th className="px-4 py-3 text-left">Role</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Last online</th>
                                <th className="px-4 py-3 text-left">Job completion %</th>
                                <th className="px-4 py-3 text-left">Complaints count</th>
                                <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td className="px-4 py-6 text-slate-400" colSpan={7}>
                                        Loading employees...
                                    </td>
                                </tr>
                            ) : sortedRows.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-slate-400" colSpan={7}>
                                        No employees available yet.
                                    </td>
                                </tr>
                            ) : (
                                sortedRows.map((employee) => (
                                    <tr key={employee.id} className="border-t border-slate-800">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-white">{employee.full_name}</div>
                                            <div className="text-xs text-slate-400">{employee.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">{employee.role_id}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusClassName(employee.status)}`}>
                                                {employee.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">
                                            {employee.last_online ? new Date(employee.last_online).toLocaleString() : "Not tracked"}
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">
                                            {typeof employee.completion_percent === "number" ? `${employee.completion_percent}%` : "No job metrics yet"}
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">{employee.complaints_count ?? 0}</td>
                                        <td className="px-4 py-3">
                                            <button className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200">
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
