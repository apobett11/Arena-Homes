"use client";

import { useState } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";

export default function AdminSettingsPage() {
    const [autoApprovals, setAutoApprovals] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    return (
        <div className="min-h-screen pb-24 lg:pb-8">
            <AdminTopBar />
            <div className="p-4 md:p-6 lg:p-8">
                <h1 className="text-3xl font-bold text-white mb-4">System Settings</h1>
                <p className="text-slate-400">Configure global platform rules and appearance.</p>
                <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/50 p-6 space-y-4">
                    <label className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white">
                        Auto-approve low-risk tenant applications
                        <input type="checkbox" checked={autoApprovals} onChange={(e) => setAutoApprovals(e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white">
                        Maintenance mode
                        <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} />
                    </label>
                </div>
            </div>
        </div>
    );
}
