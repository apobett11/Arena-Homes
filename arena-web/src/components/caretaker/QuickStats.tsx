"use client";

import React from "react";
import { cn, borderAccentClass, ck } from "./caretaker-ui";

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
    { label: "TOTAL UNITS", value: totalRooms, subtext: `${occupancyRate}% Occupancy`, accent: "border-primary" },
    { label: "OCCUPIED", value: occupiedRooms, subtext: `${vacantRooms} Vacant`, accent: "border-emerald-500" },
    { label: "VACANT", value: vacantRooms, subtext: "Available", accent: "border-amber-400" },
    { label: "TENANTS", value: tenantsCount, subtext: "Active", accent: "border-secondary" },
    {
      label: "PENDING ISSUES",
      value: pendingIssues,
      subtext: `${resolvedIssues} Resolved`,
      accent: "border-error",
      alert: pendingIssues > 0,
    },
    { label: "PENDING REPAIRS", value: pendingRepairs, subtext: `${solvedRepairs} Done`, accent: "border-orange-400" },
    {
      label: "PENDING APPS",
      value: pendingApplications,
      subtext: "Pending Review",
      accent: "border-blue-400",
      alert: pendingApplications > 0,
    },
    {
      label: "ANNOUNCEMENTS",
      value: incomingAnnouncements,
      subtext: "Unread",
      accent: "border-tertiary",
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
            "hover:-translate-y-0.5 transition-transform",
            stat.alert && "ring-1 ring-error/20"
          )}
        >
          <p className="caretaker-label-caps text-arena-on-surface-variant">{stat.label}</p>
          <p className="caretaker-display-lg text-arena-on-surface mt-1">{stat.value}</p>
          <p className="text-[10px] text-arena-on-surface-variant mt-1 uppercase tracking-wide font-semibold">
            {stat.subtext}
          </p>
        </div>
      ))}
    </section>
  );
};
