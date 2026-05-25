"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  DoorOpen,
  Hammer,
  MessageSquare,
  Users,
  Wrench,
} from "lucide-react";
import { cn, ck } from "./caretaker-ui";

export interface CaretakerQuickAccessCounts {
  pendingApplications: number;
  pendingIssues: number;
  pendingRepairs: number;
  unreadMessages: number;
  tenantsCount: number;
  totalUnits: number;
}

interface QuickAccessItem {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  count: number;
  variant: "navy" | "neutral" | "muted";
}

interface CaretakerQuickAccessProps {
  counts: CaretakerQuickAccessCounts;
}

function cardClass(hasAlert: boolean, variant: QuickAccessItem["variant"]) {
  if (hasAlert) return cn(ck.statAlert, "caretaker-stat-card--notify ring-2 ring-red-500/35");
  if (variant === "navy") return ck.statNavy;
  if (variant === "muted") return ck.statMuted;
  return ck.statNeutral;
}

export const CaretakerQuickAccess = ({ counts }: CaretakerQuickAccessProps) => {
  const items: QuickAccessItem[] = [
    {
      label: "Applications",
      description: "Review waiting applicants",
      href: "/caretaker/applications",
      icon: ClipboardList,
      count: counts.pendingApplications,
      variant: "neutral",
    },
    {
      label: "Messages",
      description: "Inbox and tenant broadcasts",
      href: "/caretaker/messages",
      icon: MessageSquare,
      count: counts.unreadMessages,
      variant: "neutral",
    },
    {
      label: "Repairs",
      description: "Open repair queue",
      href: "/caretaker/repairs",
      icon: Hammer,
      count: counts.pendingRepairs,
      variant: "muted",
    },
    {
      label: "Issues",
      description: "Property issue tracker",
      href: "/caretaker/issues",
      icon: Wrench,
      count: counts.pendingIssues,
      variant: "neutral",
    },
    {
      label: "Tenants",
      description: "Resident registry",
      href: "/caretaker/tenants",
      icon: Users,
      count: counts.tenantsCount,
      variant: "navy",
    },
    {
      label: "Units",
      description: "Rooms and availability",
      href: "/caretaker/units",
      icon: DoorOpen,
      count: counts.totalUnits,
      variant: "navy",
    },
  ];

  return (
    <section aria-label="Quick access" className="space-y-4">
      <div>
        <p className={ck.sectionTitle}>Operations</p>
        <h3 className={cn(ck.headline, "text-lg md:text-xl")}>Quick access</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
        {items.map((item) => {
          const Icon = item.icon;
          const hasAlert = item.count > 0 && ["Applications", "Messages", "Repairs", "Issues"].includes(item.label);
          const isNavy = item.variant === "navy" && !hasAlert;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "caretaker-stat-card block transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#0d3b66]/30",
                cardClass(hasAlert, item.variant)
              )}
            >
              {hasAlert && (
                <span className="absolute right-3 top-3 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white shadow-[0_0_12px_rgba(220,38,38,0.55)]">
                  {item.count > 99 ? "99+" : item.count}
                </span>
              )}
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
                  isNavy
                    ? "bg-white/14 text-white ring-1 ring-white/20"
                    : "bg-[#e8f0fa] text-[#0d3b66] ring-1 ring-[#0d3b66]/10"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <p className={cn("caretaker-label-caps mt-4", isNavy ? "text-white/70" : "text-[#8b9aab]")}>
                {item.label}
              </p>
              <p className={cn("mt-1 text-base font-extrabold tracking-tight", isNavy ? "text-white" : "text-[#0d3b66]")}>
                {hasAlert ? `${item.count} pending` : item.count}
              </p>
              <p className={cn("mt-2 text-xs font-semibold", isNavy ? "text-blue-100/85" : "text-[#5c6b7a]")}>
                {item.description}
              </p>
              {hasAlert && (
                <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  Action required
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
};
