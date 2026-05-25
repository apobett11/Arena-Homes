"use client";

import React from "react";
import {
  Building2,
  Users,
  DoorOpen,
  Home,
  AlertTriangle,
  Wrench,
  ClipboardList,
  Bell,
  TrendingUp,
} from "lucide-react";
import { cn, ck } from "./caretaker-ui";

interface QuickStatsProps {
  totalRooms?: number;
  occupiedRooms?: number;
  vacantRooms?: number;
  tenantsCount?: number;
  pendingIssues?: number;
  resolvedIssues?: number;
  pendingRepairs?: number;
  solvedRepairs?: number;
  pendingApplications?: number;
  incomingAnnouncements?: number;
}

type StatVariant = "navy" | "neutral" | "muted" | "alert";

interface StatItem {
  label: string;
  value: number;
  subtext: string;
  icon: React.ElementType;
  variant: StatVariant;
  alert?: boolean;
}

function statCardClass(variant: StatVariant, alert?: boolean) {
  if (alert) return ck.statAlert;
  if (variant === "navy") return ck.statNavy;
  if (variant === "muted") return ck.statMuted;
  return ck.statNeutral;
}

export const QuickStats = ({
  totalRooms = 0,
  occupiedRooms = 0,
  vacantRooms = 0,
  tenantsCount = 0,
  pendingIssues = 0,
  resolvedIssues = 0,
  pendingRepairs = 0,
  solvedRepairs = 0,
  pendingApplications = 0,
  incomingAnnouncements = 0,
}: QuickStatsProps) => {
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const statItems: StatItem[] = [
    {
      label: "Total units",
      value: totalRooms,
      subtext: `${occupancyRate}% occupancy`,
      icon: Building2,
      variant: "navy",
    },
    {
      label: "Occupied",
      value: occupiedRooms,
      subtext: `${vacantRooms} vacant`,
      icon: Home,
      variant: "neutral",
    },
    {
      label: "Vacant",
      value: vacantRooms,
      subtext: "Available now",
      icon: DoorOpen,
      variant: "muted",
    },
    {
      label: "Tenants",
      value: tenantsCount,
      subtext: "Active residents",
      icon: Users,
      variant: "navy",
    },
    {
      label: "Pending issues",
      value: pendingIssues,
      subtext: `${resolvedIssues} resolved`,
      icon: AlertTriangle,
      variant: pendingIssues > 0 ? "alert" : "neutral",
      alert: pendingIssues > 0,
    },
    {
      label: "Pending repairs",
      value: pendingRepairs,
      subtext: `${solvedRepairs} completed`,
      icon: Wrench,
      variant: "muted",
    },
    {
      label: "Applications",
      value: pendingApplications,
      subtext: "Awaiting review",
      icon: ClipboardList,
      variant: pendingApplications > 0 ? "alert" : "neutral",
      alert: pendingApplications > 0,
    },
    {
      label: "Announcements",
      value: incomingAnnouncements,
      subtext: "Unread notices",
      icon: Bell,
      variant: "neutral",
      alert: incomingAnnouncements > 0,
    },
  ];

  return (
    <section aria-label="Property metrics" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className={ck.sectionTitle}>Portfolio snapshot</p>
          <h3 className={cn(ck.headline, "text-lg md:text-xl")}>Key metrics</h3>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#0d3b66] ring-1 ring-[#0d3b66]/15 shadow-sm">
          <TrendingUp className="h-3.5 w-3.5" />
          Live property data
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        {statItems.map((stat) => {
          const Icon = stat.icon;
          const isNavy = stat.variant === "navy";

          return (
            <div
              key={stat.label}
              className={cn(
                statCardClass(stat.variant, stat.alert),
                stat.alert && !isNavy && "ring-2 ring-red-500/12"
              )}
            >
              <div className="flex items-start justify-between gap-2">
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
              </div>
              <p className={cn("caretaker-label-caps mt-4", isNavy ? "text-white/70" : "text-[#8b9aab]")}>
                {stat.label}
              </p>
              <p
                className={cn(
                  "mt-1 text-[1.75rem] font-extrabold leading-none tracking-tight tabular-nums",
                  isNavy ? "text-white" : "text-[#0d3b66]"
                )}
              >
                {stat.value}
              </p>
              <p className={cn("mt-2 text-xs font-semibold", isNavy ? "text-blue-100/85" : "text-[#5c6b7a]")}>
                {stat.subtext}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
