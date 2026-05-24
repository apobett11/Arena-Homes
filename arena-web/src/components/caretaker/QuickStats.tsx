"use client";

import React from "react";
import { cn, borderAccentClass } from "./caretaker-ui";

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

  const statItems = [
    { label: "TOTAL UNITS", value: totalRooms, subtext: `${occupancyRate}% Occupancy`, accent: "border-blue-600", wash: "from-blue-50 via-white to-slate-50", valueColor: "text-blue-700" },
    { label: "OCCUPIED", value: occupiedRooms, subtext: `${vacantRooms} Vacant`, accent: "border-emerald-500", wash: "from-emerald-50 via-white to-slate-50", valueColor: "text-emerald-700" },
    { label: "VACANT", value: vacantRooms, subtext: "Available", accent: "border-amber-400", wash: "from-amber-50 via-white to-slate-50", valueColor: "text-amber-700" },
    { label: "TENANTS", value: tenantsCount, subtext: "Active", accent: "border-indigo-500", wash: "from-indigo-50 via-white to-slate-50", valueColor: "text-indigo-700" },
    {
      label: "PENDING ISSUES",
      value: pendingIssues,
      subtext: `${resolvedIssues} Resolved`,
      accent: "border-red-500",
      wash: "from-red-50 via-white to-slate-50",
      valueColor: "text-red-700",
      alert: pendingIssues > 0,
    },
    { label: "PENDING REPAIRS", value: pendingRepairs, subtext: `${solvedRepairs} Done`, accent: "border-orange-400", wash: "from-orange-50 via-white to-slate-50", valueColor: "text-orange-700" },
    {
      label: "PENDING APPS",
      value: pendingApplications,
      subtext: "Pending Review",
      accent: "border-blue-400",
      wash: "from-sky-50 via-white to-slate-50",
      valueColor: "text-sky-700",
      alert: pendingApplications > 0,
    },
    {
      label: "ANNOUNCEMENTS",
      value: incomingAnnouncements,
      subtext: "Unread",
      accent: "border-purple-500",
      wash: "from-purple-50 via-white to-slate-50",
      valueColor: "text-purple-700",
      alert: incomingAnnouncements > 0,
    },
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-5">
      {statItems.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            borderAccentClass(stat.accent),
            `bg-gradient-to-br ${stat.wash}`,
            stat.alert && "ring-2 ring-red-500/15"
          )}
        >
          <p className="caretaker-label-caps text-slate-500">{stat.label}</p>
          <p className={cn("caretaker-display-lg mt-1", stat.valueColor)}>{stat.value}</p>
          <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wide font-bold">
            {stat.subtext}
          </p>
        </div>
      ))}
    </section>
  );
};
