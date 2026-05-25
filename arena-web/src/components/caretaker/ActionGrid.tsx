"use client";

import React from "react";
import Link from "next/link";
import {
  UserPlus,
  Hammer,
  Receipt,
  Megaphone,
  Key,
  ClipboardList,
  Image as ImageIcon,
} from "lucide-react";
import { cn, ck } from "./caretaker-ui";

interface ActionGridProps {
  pendingApplicationsCount?: number;
  showHeading?: boolean;
  onNavigate?: () => void;
}

const actions: {
  href: string;
  label: string;
  icon: React.ElementType;
  desc: string;
  notifyKey?: "applications";
}[] = [
  { href: "/caretaker/units", label: "Units", icon: Key, desc: "Rooms & availability" },
  { href: "/caretaker/tenants", label: "Tenants", icon: UserPlus, desc: "Leases & issues" },
  { href: "/caretaker/applications", label: "Applications", icon: ClipboardList, desc: "Review applicants", notifyKey: "applications" },
  { href: "/caretaker/issues", label: "Issues", icon: Hammer, desc: "Property issues" },
  { href: "/caretaker/repairs", label: "Repairs", icon: Hammer, desc: "Repair queue" },
  { href: "/caretaker/tenants", label: "Leases", icon: Receipt, desc: "Via tenant actions" },
  { href: "/caretaker/photos", label: "Photos", icon: ImageIcon, desc: "Property media" },
  { href: "/caretaker/announcements", label: "Announce", icon: Megaphone, desc: "Broadcasts" },
];

export const ActionGrid = ({
  pendingApplicationsCount = 0,
  showHeading = true,
  onNavigate,
}: ActionGridProps) => {
  return (
    <section className="space-y-3">
      {showHeading && <h3 className={ck.headline}>Quick Actions</h3>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const showBadge =
            action.notifyKey === "applications" && pendingApplicationsCount > 0;

          return (
            <Link
              key={action.label + action.href}
              href={action.href}
              onClick={onNavigate}
              className={cn(
                ck.quickActionBtn,
                "relative",
                showBadge && "ring-2 ring-red-500/30"
              )}
            >
              {showBadge && (
                <span className="absolute right-2 top-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {pendingApplicationsCount}
                </span>
              )}
              <Icon className="h-6 w-6 text-[#0d3b66] transition-colors group-hover:text-white" />
              <span className="caretaker-label-caps text-center leading-tight text-[#5c6b7a] group-hover:text-white">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
