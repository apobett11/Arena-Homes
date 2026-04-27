"use client";

import React from "react";
import { Home, DoorOpen, Users, Wrench, ClipboardCheck, Bell } from "lucide-react";

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
    {
      label: "Total Units",
      value: totalRooms,
      subtext: `${occupancyRate}% occupied`,
      icon: Home,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-500/10",
    },
    {
      label: "Occupied",
      value: occupiedRooms,
      subtext: `${vacantRooms} vacant`,
      icon: Users,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      label: "Vacant",
      value: vacantRooms,
      subtext: "Available",
      icon: DoorOpen,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
      label: "Tenants",
      value: tenantsCount,
      subtext: "Active",
      icon: Users,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-500/10",
    },
    {
      label: "Pending Issues",
      value: pendingIssues,
      subtext: `${resolvedIssues} resolved`,
      icon: Wrench,
      color: pendingIssues > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400",
      bgColor: pendingIssues > 0 ? "bg-rose-50 dark:bg-rose-500/10" : "bg-slate-50 dark:bg-slate-500/10",
      alert: pendingIssues > 0,
    },
    {
      label: "Repairs",
      value: pendingRepairs,
      subtext: `${solvedRepairs} done`,
      icon: ClipboardCheck,
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-50 dark:bg-cyan-500/10",
    },
    {
      label: "Applications",
      value: pendingApplications,
      subtext: "Pending",
      icon: DoorOpen,
      color: pendingApplications > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-400",
      bgColor: "bg-amber-50 dark:bg-amber-500/10",
      alert: pendingApplications > 0,
    },
    {
      label: "Announcements",
      value: incomingAnnouncements,
      subtext: "Unread",
      icon: Bell,
      color: incomingAnnouncements > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-500/10",
      alert: incomingAnnouncements > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {statItems.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`p-3 rounded-lg border ${
              stat.alert
                ? "border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/5"
                : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-md ${stat.bgColor}`}>
                <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
              </div>
              {stat.alert && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </div>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{stat.label}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-500">{stat.subtext}</p>
          </div>
        );
      })}
    </div>
  );
};
