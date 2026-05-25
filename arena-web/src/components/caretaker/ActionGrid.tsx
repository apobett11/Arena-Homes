"use client";

import React from "react";
import {
  UserPlus,
  Hammer,
  Receipt,
  CheckCircle,
  Megaphone,
  Key,
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
  showHeading?: boolean;
}

const actions: {
  id: TabType;
  label: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  { id: "units", label: "Units", icon: Key, desc: "Rooms, reserve, repairs, photos" },
  { id: "tenants", label: "Tenants", icon: UserPlus, desc: "Leases, issues, applications" },
  { id: "applications", label: "Applications", icon: ClipboardList, desc: "Review applicants" },
  { id: "issues", label: "Issues", icon: Hammer, desc: "Property-wide issues" },
  { id: "repairs", label: "All repairs", icon: CheckCircle, desc: "Property repair queue" },
  { id: "leases", label: "All leases", icon: Receipt, desc: "Property lease registry" },
  { id: "photos", label: "Photos", icon: Clipboard, desc: "Property media uploads" },
  { id: "announcements", label: "Announce", icon: Megaphone, desc: "Broadcasts and notices" },
  { id: "facilities", label: "Content", icon: Clipboard, desc: "Facilities and inventory" },
];

export const ActionGrid = ({
  onTabChange,
  activeTab,
  pendingApplicationsCount = 0,
  showHeading = true,
}: ActionGridProps) => {
  const hasPendingApplications = pendingApplicationsCount > 0;

  return (
    <section className="space-y-3">
      {showHeading && <h3 className={ck.headline}>Quick Actions</h3>}
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
