"use client";

import React from "react";
import Link from "next/link";
import {
    DoorOpen,
    Users,
    Wrench,
    FileText,
    Bell,
    Settings,
    Shield,
    HelpCircle,
    ClipboardList,
    ImageIcon,
} from "lucide-react";

type TabType = "overview" | "units" | "tenants" | "issues" | "leases" | "announcements" | "rules" | "photos";

interface ActionGridProps {
    onTabChange: (tab: TabType) => void;
    activeTab: TabType;
    pendingApplicationsCount?: number;
}

const actions = [
    { id: "units", label: "Manage Units", icon: DoorOpen, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-500/10", desc: "Rooms & availability" },
    { id: "tenants", label: "View Tenants", icon: Users, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-500/10", desc: "Tenant directory" },
    { id: "issues", label: "Handle Issues", icon: Wrench, color: "text-rose-600 dark:text-rose-400", bgColor: "bg-rose-50 dark:bg-rose-500/10", desc: "Maintenance requests" },
    { id: "leases", label: "View Leases", icon: FileText, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-50 dark:bg-purple-500/10", desc: "Lease agreements" },
    { id: "photos", label: "Photos", icon: ImageIcon, color: "text-pink-600 dark:text-pink-400", bgColor: "bg-pink-50 dark:bg-pink-500/10", desc: "Property images" },
    { id: "announcements", label: "Announcements", icon: Bell, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-500/10", desc: "Send notices" },
    { id: "rules", label: "Rules & FAQ", icon: Shield, color: "text-cyan-600 dark:text-cyan-400", bgColor: "bg-cyan-50 dark:bg-cyan-500/10", desc: "Property policies" },
];

export const ActionGrid = ({ onTabChange, activeTab, pendingApplicationsCount = 0 }: ActionGridProps) => {
    const hasPendingApplications = pendingApplicationsCount > 0;
    
    return (
        <div className="flex flex-wrap gap-2">
            {/* Applications Button - Special standalone link with orange indicator */}
            <Link
                href="/caretaker/applications"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    hasPendingApplications
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 animate-pulse"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
            >
                <div className={`p-1 rounded ${hasPendingApplications ? "bg-orange-200 dark:bg-orange-500/30" : "bg-orange-50 dark:bg-orange-500/10"}`}>
                    <ClipboardList className={`w-3.5 h-3.5 ${hasPendingApplications ? "text-orange-700 dark:text-orange-400" : "text-orange-600 dark:text-orange-400"}`} />
                </div>
                <span>Applications</span>
                {hasPendingApplications && (
                    <span className="bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {pendingApplicationsCount}
                    </span>
                )}
            </Link>
            
            {actions.map((action) => {
                const Icon = action.icon;
                const isActive = activeTab === action.id;
                
                return (
                    <button
                        key={action.id}
                        onClick={() => onTabChange(action.id as TabType)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            isActive
                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                    >
                        <div className={`p-1 rounded ${isActive ? "bg-white/20" : action.bgColor}`}>
                            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white dark:text-slate-900" : action.color}`} />
                        </div>
                        <span>{action.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
