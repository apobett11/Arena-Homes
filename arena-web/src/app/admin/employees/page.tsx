"use client";

import { useEffect, useState } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { UsersApi, User } from "@/lib/api/domains/users";

export default function AdminEmployeesPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [email, setEmail] = useState("");
    const [roleId, setRoleId] = useState("CARETAKER");

    async function load() {
        const data = await UsersApi.getAll();
        setUsers(data);
    }

    useEffect(() => {
        load().catch(console.error);
    }, []);

    async function addEmployee(e: React.FormEvent) {
        e.preventDefault();
        await UsersApi.createEmployee({ email, roleId, password: "Temp#1234" });
        setEmail("");
        await load();
    }

    return (
        <div className="min-h-screen pb-24 lg:pb-8">
            <AdminTopBar />
            <div className="p-4 md:p-6 lg:p-8">
                <h1 className="text-3xl font-bold text-white mb-4">Employee Management</h1>
                <p className="text-slate-400">Directory and controls for all staff members.</p>
                <form onSubmit={addEmployee} className="mt-6 flex flex-wrap gap-2">
                    <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="employee@email.com" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                    <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                        <option value="CARETAKER">Caretaker</option>
                        <option value="ACCOUNTANT">Accountant</option>
                        <option value="IT_SUPPORT">IT Support</option>
                    </select>
                    <button className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Add Employee</button>
                </form>
                <div className="mt-6 grid gap-2 rounded-2xl border border-slate-700 bg-slate-900/50 p-4 md:p-6">
                    {users.map((u) => (
                        <div key={u.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
                            {u.email} - {u.roleId} - {u.isActive ? "Active" : "Inactive"}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
