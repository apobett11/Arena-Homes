"use client";

import React from "react";
import {
  UserPlus,
  Hammer,
  Receipt,
  CheckCircle,
  Megaphone,
  Key,
  History,
  Clipboard,
  ClipboardList,
} from "lucide-react";
import { cn, ck } from "./caretaker-ui";

type TabType =
  | "overview"
  | "units"
  | "tenants"
  | "issues"
  | "leases"
  | "announcements"
  | "rules"
  | "photos"
  | "repairs"
  | "applications"
  | "facilities"
  | "settings";

interface ActionGridProps {
  onTabChange: (tab: TabType) => void;
  activeTab: TabType;
  pendingApplicationsCount?: number;
}

const actions: {
  id: TabType;
  label: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  { id: "tenants", label: "Add Tenant", icon: UserPlus, desc: "Register new tenant" },
  { id: "applications", label: "Applications", icon: ClipboardList, desc: "Review applicants" },
  { id: "issues", label: "Log Issue", icon: Hammer, desc: "Report maintenance" },
  { id: "leases", label: "Invoicing", icon: Receipt, desc: "Manage billing" },
  { id: "repairs", label: "Inspection", icon: CheckCircle, desc: "Schedule inspection" },
  { id: "announcements", label: "Announce", icon: Megaphone, desc: "Send notification" },
  { id: "units", label: "Unit Entry", icon: Key, desc: "Access management" },
  { id: "tenants", label: "Move-outs", icon: History, desc: "Process departure" },
  { id: "facilities", label: "Reports", icon: Clipboard, desc: "Generate reports" },
];

export const ActionGrid = ({ onTabChange, activeTab, pendingApplicationsCount = 0 }: ActionGridProps) => {
  const hasPendingApplications = pendingApplicationsCount > 0;

  return (
    <section className="space-y-3">
      <h3 className={ck.headline}>Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => onTabChange(action.id)}
              className={cn(
                ck.quickActionBtn,
                activeTab === action.id && "bg-primary-container text-on-primary-container"
              )}
            >
              <Icon className={cn("w-6 h-6 text-primary group-hover:text-on-primary-container", activeTab === action.id && "text-on-primary-container")} />
              <span className="caretaker-label-caps text-center leading-tight">{action.label}</span>
              {action.id === "applications" && hasPendingApplications && (
                <span className="caretaker-chip bg-amber-100 text-amber-800">{pendingApplicationsCount}</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
