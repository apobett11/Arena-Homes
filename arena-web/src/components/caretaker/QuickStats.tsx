"use client";

import React from "react";
import { Home, DoorOpen, Users, Wrench, ClipboardCheck, ClipboardList } from "lucide-react";

interface QuickStatsProps {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  tenantsCount: number;
  pendingIssues: number;
  resolvedIssues: number;
  pendingRepairs: number;
  solvedRepairs: number;
  pendingApplications: number;
}

export const QuickStats = ({
  totalRooms,
  occupiedRooms,
  vacantRooms,
  tenantsCount,
  pendingIssues,
  resolvedIssues,
  pendingRepairs,
  solvedRepairs,
  pendingApplications,
}: QuickStatsProps) => {
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const stats = [
    {
      label: "Total Rooms",
      value: totalRooms,
      icon: Home,
      color: "bg-blue-500",
      lightColor: "bg-blue-50 dark:bg-blue-500/10",
      textColor: "text-blue-700 dark:text-blue-400",
      subtext: `${occupiedRooms} occupied`,
    },
    {
      label: "Vacant Units",
      value: vacantRooms,
      icon: DoorOpen,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50 dark:bg-emerald-500/10",
      textColor: "text-emerald-700 dark:text-emerald-400",
      subtext: "Available for rent",
    },
    {
      label: "Tenants",
      value: tenantsCount,
      icon: Users,
      color: "bg-purple-500",
      lightColor: "bg-purple-50 dark:bg-purple-500/10",
      textColor: "text-purple-700 dark:text-purple-400",
      subtext: "Active tenants",
    },
    {
      label: "Pending Issues",
      value: pendingIssues,
      icon: Wrench,
      color: "bg-rose-500",
      lightColor: "bg-rose-50 dark:bg-rose-500/10",
      textColor: "text-rose-700 dark:text-rose-400",
      subtext: `${resolvedIssues} resolved`,
      alert: pendingIssues > 0,
    },
    {
      label: "Repairs",
      value: pendingRepairs,
      icon: ClipboardCheck,
      color: "bg-amber-500",
      lightColor: "bg-amber-50 dark:bg-amber-500/10",
      textColor: "text-amber-700 dark:text-amber-400",
      subtext: `${solvedRepairs} completed`,
    },
    {
      label: "Applications",
      value: pendingApplications,
      icon: ClipboardList,
      color: "bg-cyan-500",
      lightColor: "bg-cyan-50 dark:bg-cyan-500/10",
      textColor: "text-cyan-700 dark:text-cyan-400",
      subtext: "Pending review",
      alert: pendingApplications > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`p-4 rounded-xl border ${
              stat.alert
                ? "border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/5"
                : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.lightColor}`}>
                <Icon className={`w-5 h-5 ${stat.textColor}`} />
              </div>
              {stat.alert && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </div>
            <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{stat.subtext}</p>
          </div>
        );
      })}
    </div>
  );
};
