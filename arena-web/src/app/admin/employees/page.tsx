"use client";

import { useEffect, useState, useRef } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import AdminModal from "@/components/admin/AdminModal";
import {
    getAllEmployees,
    suspendEmployee,
    restoreEmployee,
    revokeEmployeeAccess,
    sendWarningToEmployee,
    requestPasswordReset,
} from "@/lib/admin/dashboard";
import type { AdminEmployee } from "@/lib/admin/types";
import {
    MoreHorizontal,
    AlertTriangle,
    Shield,
    ShieldAlert,
    ShieldCheck,
    MessageSquareWarning,
    Key,
    Eye,
    Home,
    X,
} from "lucide-react";

type SortField = "name" | "role" | "status" | "last_online" | "complaints";
type ModalType = "suspend" | "restore" | "revoke" | "warning" | "password" | "details" | null;

export default function AdminEmployeesPage() {
    const [employees, setEmployees] = useState<AdminEmployee[]>([]);
    const [sortBy, setSortBy] = useState<SortField>("name");
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [modalType, setModalType] = useState<ModalType>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<AdminEmployee | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Warning form state
    const [warningTitle, setWarningTitle] = useState("");
    const [warningMessage, setWarningMessage] = useState("");
    const [warningSeverity, setWarningSeverity] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");

    const dropdownRef = useRef<HTMLDivElement>(null);

    async function loadEmployees() {
        setLoading(true);
        try {
            const data = await getAllEmployees();
            setEmployees(data);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadEmployees();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const sortedEmployees = [...employees].sort((a, b) => {
        switch (sortBy) {
            case "name":
                return (a.full_name || "").localeCompare(b.full_name || "");
            case "role":
                return (a.role_id || "").localeCompare(b.role_id || "");
            case "status":
                return (a.status || "").localeCompare(b.status || "");
            case "last_online":
                return new Date(b.last_online || 0).getTime() - new Date(a.last_online || 0).getTime();
            case "complaints":
                return (b.complaints_count || 0) - (a.complaints_count || 0);
            default:
                return 0;
        }
    });

    const statusBadge = (status: string) => {
        if (status === "ACTIVE")
            return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
        if (status === "SUSPENDED")
            return "border-rose-500/30 bg-rose-500/10 text-rose-300";
        return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    };

    const openModal = (type: ModalType, employee: AdminEmployee) => {
        setSelectedEmployee(employee);
        setModalType(type);
        setActiveDropdown(null);
        setMessage(null);
    };

    const closeModal = () => {
        setModalType(null);
        setSelectedEmployee(null);
        setMessage(null);
        setWarningTitle("");
        setWarningMessage("");
        setWarningSeverity("MEDIUM");
    };

    const handleSuspend = async () => {
        if (!selectedEmployee) return;
        setModalLoading(true);
        const result = await suspendEmployee(selectedEmployee.id);
        setModalLoading(false);

        if (result.success) {
            setMessage({ type: "success", text: `${selectedEmployee.full_name} has been suspended.` });
            await loadEmployees();
            setTimeout(closeModal, 1500);
        } else {
            setMessage({ type: "error", text: result.error || "Failed to suspend employee" });
        }
    };

    const handleRestore = async () => {
        if (!selectedEmployee) return;
        setModalLoading(true);
        const result = await restoreEmployee(selectedEmployee.id);
        setModalLoading(false);

        if (result.success) {
            setMessage({ type: "success", text: `${selectedEmployee.full_name} has been restored.` });
            await loadEmployees();
            setTimeout(closeModal, 1500);
        } else {
            setMessage({ type: "error", text: result.error || "Failed to restore employee" });
        }
    };

    const handleRevoke = async () => {
        if (!selectedEmployee) return;
        setModalLoading(true);
        const result = await revokeEmployeeAccess(selectedEmployee.id);
        setModalLoading(false);

        if (result.success) {
            setMessage({ type: "success", text: `${selectedEmployee.full_name}'s access has been revoked.` });
            await loadEmployees();
            setTimeout(closeModal, 1500);
        } else {
            setMessage({ type: "error", text: result.error || "Failed to revoke access" });
        }
    };

    const handleSendWarning = async () => {
        if (!selectedEmployee || !warningTitle.trim() || !warningMessage.trim()) return;
        setModalLoading(true);
        const result = await sendWarningToEmployee({
            employee_id: selectedEmployee.id,
            user_id: selectedEmployee.user_id,
            title: warningTitle,
            message: warningMessage,
            severity: warningSeverity,
        });
        setModalLoading(false);

        if (result.success) {
            setMessage({ type: "success", text: `Warning sent to ${selectedEmployee.full_name}.` });
            setTimeout(closeModal, 1500);
        } else {
            setMessage({ type: "error", text: result.error || "Failed to send warning" });
        }
    };

    const handlePasswordReset = async () => {
        if (!selectedEmployee) return;
        setModalLoading(true);
        const result = await requestPasswordReset(selectedEmployee.user_id, selectedEmployee.full_name || "Employee");
        setModalLoading(false);

        if (result.success) {
            setMessage({ type: "success", text: result.message });
            setTimeout(closeModal, 2000);
        } else {
            setMessage({ type: "error", text: result.error || "Failed to request password reset" });
        }
    };

    return (
        <div className="min-h-screen pb-24 lg:pb-8">
            <AdminTopBar />
            <div className="p-4 md:p-6 lg:p-8">
                <h1 className="text-3xl font-bold text-white mb-4">Employee Management</h1>
                <p className="text-slate-400">Full staff directory with activity, status management, and communication tools.</p>

                {message && !modalType && (
                    <div className={`mt-4 p-3 rounded-lg ${message.type === "success" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "bg-rose-500/10 border border-rose-500/30 text-rose-300"}`}>
                        {message.text}
                    </div>
                )}

                <div className="mt-6 flex flex-wrap gap-2">
                    {[
                        ["name", "Name"],
                        ["role", "Role"],
                        ["status", "Status"],
                        ["last_online", "Last online"],
                        ["complaints", "Complaints"],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            onClick={() => setSortBy(value as SortField)}
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
                    <table className="min-w-[1000px] w-full text-sm">
                        <thead className="bg-slate-900/90 text-slate-300">
                            <tr>
                                <th className="px-4 py-3 text-left">Full name</th>
                                <th className="px-4 py-3 text-left">Role</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Assigned Property</th>
                                <th className="px-4 py-3 text-left">Last online</th>
                                <th className="px-4 py-3 text-left">Complaints</th>
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
                            ) : sortedEmployees.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-slate-400" colSpan={7}>
                                        No employees available yet.
                                    </td>
                                </tr>
                            ) : (
                                sortedEmployees.map((employee) => (
                                    <tr key={employee.id} className="border-t border-slate-800 hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-white">{employee.full_name || "Unnamed"}</div>
                                            <div className="text-xs text-slate-400">{employee.email || "No email"}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">{employee.role_id}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusBadge(employee.status)}`}>
                                                {employee.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">
                                            {employee.assigned_property_name || "Unassigned"}
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">
                                            {employee.last_online ? new Date(employee.last_online).toLocaleString() : "Not tracked"}
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">{employee.complaints_count ?? 0}</td>
                                        <td className="px-4 py-3">
                                            <div className="relative" ref={activeDropdown === employee.id ? dropdownRef : null}>
                                                <button
                                                    onClick={() => setActiveDropdown(activeDropdown === employee.id ? null : employee.id)}
                                                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                                                >
                                                    Manage
                                                    <MoreHorizontal className="w-3 h-3" />
                                                </button>

                                                {activeDropdown === employee.id && (
                                                    <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-slate-700 bg-slate-800 shadow-xl z-50 overflow-hidden">
                                                        <div className="py-1">
                                                            <button
                                                                onClick={() => openModal("details", employee)}
                                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                View details
                                                            </button>

                                                            {employee.role_id === "CARETAKER" && employee.assigned_property_id && (
                                                                <button
                                                                    onClick={() => {}} // Navigate to property
                                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                                                >
                                                                    <Home className="w-4 h-4" />
                                                                    View assigned property
                                                                </button>
                                                            )}

                                                            <div className="border-t border-slate-700 my-1" />

                                                            {employee.status === "ACTIVE" ? (
                                                                <button
                                                                    onClick={() => openModal("suspend", employee)}
                                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition-colors"
                                                                >
                                                                    <ShieldAlert className="w-4 h-4" />
                                                                    Suspend
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => openModal("restore", employee)}
                                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200 transition-colors"
                                                                >
                                                                    <ShieldCheck className="w-4 h-4" />
                                                                    Restore/Activate
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => openModal("revoke", employee)}
                                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-amber-300 hover:bg-amber-500/10 hover:text-amber-200 transition-colors"
                                                            >
                                                                <Shield className="w-4 h-4" />
                                                                Revoke dashboard access
                                                            </button>

                                                            <div className="border-t border-slate-700 my-1" />

                                                            <button
                                                                onClick={() => openModal("warning", employee)}
                                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                                            >
                                                                <MessageSquareWarning className="w-4 h-4" />
                                                                Send warning
                                                            </button>

                                                            <button
                                                                onClick={() => openModal("password", employee)}
                                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                                            >
                                                                <Key className="w-4 h-4" />
                                                                Request password reset
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirmation Modals */}
            <AdminModal open={modalType === "suspend"} onClose={closeModal} title="Suspend Employee">
                {selectedEmployee && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-rose-400">
                            <AlertTriangle className="w-6 h-6" />
                            <p className="font-semibold">Confirm Suspension</p>
                        </div>
                        <p className="text-slate-300">
                            Are you sure you want to suspend <strong>{selectedEmployee.full_name}</strong>?
                        </p>
                        <p className="text-sm text-slate-400">
                            This will block their dashboard access and show a suspended status to tenants.
                        </p>
                        {message && (
                            <div className={`p-3 rounded-lg ${message.type === "success" ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>
                                {message.text}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button onClick={closeModal} className="flex-1 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                                Cancel
                            </button>
                            <button
                                onClick={handleSuspend}
                                disabled={modalLoading}
                                className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-500 disabled:opacity-50"
                            >
                                {modalLoading ? "Suspending..." : "Suspend"}
                            </button>
                        </div>
                    </div>
                )}
            </AdminModal>

            <AdminModal open={modalType === "restore"} onClose={closeModal} title="Restore Employee">
                {selectedEmployee && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-emerald-400">
                            <ShieldCheck className="w-6 h-6" />
                            <p className="font-semibold">Confirm Restore</p>
                        </div>
                        <p className="text-slate-300">
                            Are you sure you want to restore <strong>{selectedEmployee.full_name}</strong> to ACTIVE status?
                        </p>
                        <p className="text-sm text-slate-400">
                            This will re-enable their dashboard access.
                        </p>
                        {message && (
                            <div className={`p-3 rounded-lg ${message.type === "success" ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>
                                {message.text}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button onClick={closeModal} className="flex-1 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                                Cancel
                            </button>
                            <button
                                onClick={handleRestore}
                                disabled={modalLoading}
                                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500 disabled:opacity-50"
                            >
                                {modalLoading ? "Restoring..." : "Restore"}
                            </button>
                        </div>
                    </div>
                )}
            </AdminModal>

            <AdminModal open={modalType === "revoke"} onClose={closeModal} title="Revoke Dashboard Access">
                {selectedEmployee && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-amber-400">
                            <Shield className="w-6 h-6" />
                            <p className="font-semibold">Confirm Access Revocation</p>
                        </div>
                        <p className="text-slate-300">
                            Are you sure you want to revoke dashboard access for <strong>{selectedEmployee.full_name}</strong>?
                        </p>
                        <p className="text-sm text-slate-400">
                            They will be marked as INACTIVE. History and property assignments remain intact.
                        </p>
                        {message && (
                            <div className={`p-3 rounded-lg ${message.type === "success" ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>
                                {message.text}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button onClick={closeModal} className="flex-1 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                                Cancel
                            </button>
                            <button
                                onClick={handleRevoke}
                                disabled={modalLoading}
                                className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-500 disabled:opacity-50"
                            >
                                {modalLoading ? "Revoking..." : "Revoke Access"}
                            </button>
                        </div>
                    </div>
                )}
            </AdminModal>

            <AdminModal open={modalType === "warning"} onClose={closeModal} title="Send Warning" fullScreen>
                {selectedEmployee && (
                    <div className="space-y-4">
                        <p className="text-slate-300">
                            Sending warning to <strong>{selectedEmployee.full_name}</strong>
                        </p>

                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Warning Title</label>
                            <input
                                value={warningTitle}
                                onChange={(e) => setWarningTitle(e.target.value)}
                                placeholder="e.g., Policy Violation Notice"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Severity</label>
                            <select
                                value={warningSeverity}
                                onChange={(e) => setWarningSeverity(e.target.value as any)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Warning Message</label>
                            <textarea
                                value={warningMessage}
                                onChange={(e) => setWarningMessage(e.target.value)}
                                rows={4}
                                placeholder="Describe the issue and required corrective action..."
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                            />
                        </div>

                        {message && (
                            <div className={`p-3 rounded-lg ${message.type === "success" ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button onClick={closeModal} className="flex-1 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                                Cancel
                            </button>
                            <button
                                onClick={handleSendWarning}
                                disabled={modalLoading || !warningTitle.trim() || !warningMessage.trim()}
                                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
                            >
                                {modalLoading ? "Sending..." : "Send Warning"}
                            </button>
                        </div>
                    </div>
                )}
            </AdminModal>

            <AdminModal open={modalType === "password"} onClose={closeModal} title="Request Password Reset">
                {selectedEmployee && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-blue-400">
                            <Key className="w-6 h-6" />
                            <p className="font-semibold">Password Reset Request</p>
                        </div>
                        <p className="text-slate-300">
                            Request password reset for <strong>{selectedEmployee.full_name}</strong>?
                        </p>
                        <div className="bg-slate-800/50 p-3 rounded-lg text-sm text-slate-400">
                            <p>A notification will be sent to the employee asking them to use the "Forgot Password" feature.</p>
                            <p className="mt-2">No password will be changed directly for security reasons.</p>
                        </div>
                        {message && (
                            <div className={`p-3 rounded-lg ${message.type === "success" ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>
                                {message.text}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button onClick={closeModal} className="flex-1 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                                Cancel
                            </button>
                            <button
                                onClick={handlePasswordReset}
                                disabled={modalLoading}
                                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
                            >
                                {modalLoading ? "Requesting..." : "Send Request"}
                            </button>
                        </div>
                    </div>
                )}
            </AdminModal>

            <AdminModal open={modalType === "details"} onClose={closeModal} title="Employee Details" fullScreen>
                {selectedEmployee && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                <p className="text-xs text-slate-400">Full Name</p>
                                <p className="text-sm text-white">{selectedEmployee.full_name || "N/A"}</p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                <p className="text-xs text-slate-400">Email</p>
                                <p className="text-sm text-white">{selectedEmployee.email || "N/A"}</p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                <p className="text-xs text-slate-400">Role</p>
                                <p className="text-sm text-white">{selectedEmployee.role_id}</p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                <p className="text-xs text-slate-400">Status</p>
                                <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadge(selectedEmployee.status)}`}>
                                    {selectedEmployee.status}
                                </span>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                <p className="text-xs text-slate-400">Phone</p>
                                <p className="text-sm text-white">{selectedEmployee.phone_number || "N/A"}</p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                <p className="text-xs text-slate-400">WhatsApp</p>
                                <p className="text-sm text-white">{selectedEmployee.whatsapp_number || "N/A"}</p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-lg col-span-2">
                                <p className="text-xs text-slate-400">Assigned Property</p>
                                <p className="text-sm text-white">{selectedEmployee.assigned_property_name || "Unassigned"}</p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                <p className="text-xs text-slate-400">Last Online</p>
                                <p className="text-sm text-white">{selectedEmployee.last_online ? new Date(selectedEmployee.last_online).toLocaleString() : "Not tracked"}</p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                <p className="text-xs text-slate-400">Complaints</p>
                                <p className="text-sm text-white">{selectedEmployee.complaints_count || 0}</p>
                            </div>
                        </div>
                        <button onClick={closeModal} className="w-full rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                            Close
                        </button>
                    </div>
                )}
            </AdminModal>
        </div>
    );
}
