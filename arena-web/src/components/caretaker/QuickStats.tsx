"use client";

import React from "react";
import { Home, DoorOpen, Users, Wrench, ClipboardCheck, ClipboardList } from "lucide-react";

interface QuickStatsProps {
  // New interface props
  totalRooms?: number;
  occupiedRooms?: number;
  vacantRooms?: number;
  tenantsCount?: number;
  pendingIssues?: number;
  resolvedIssues?: number;
  pendingRepairs?: number;
  solvedRepairs?: number;
  pendingApplications?: number;
  // Legacy interface props for backward compatibility
  stats?: {
    totalOpenIssues: number;
    pendingMaintenance: number;
    vacantUnits: number;
    totalUnits: number;
  };
  loading?: boolean;
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
  stats,
  loading,
}: QuickStatsProps) => {
  // Handle legacy props if provided
  const displayTotalRooms = stats?.totalUnits ?? totalRooms;
  const displayVacantRooms = stats?.vacantUnits ?? vacantRooms;
  const displayOccupiedRooms = displayTotalRooms - displayVacantRooms;
  const displayPendingIssues = stats?.totalOpenIssues ?? pendingIssues;
  const displayPendingRepairs = stats?.pendingMaintenance ?? pendingRepairs;
  const displayResolvedIssues = resolvedIssues;
  const displaySolvedRepairs = solvedRepairs;
  const displayTenants = tenantsCount;
  const displayApplications = pendingApplications;
  const occupancyRate = displayTotalRooms > 0 ? Math.round((displayOccupiedRooms / displayTotalRooms) * 100) : 0;

  const statItems = [
    {
      label: "Total Rooms",
      value: displayTotalRooms,
      icon: Home,
      color: "bg-blue-500",
      lightColor: "bg-blue-50 dark:bg-blue-500/10",
      textColor: "text-blue-700 dark:text-blue-400",
      subtext: `${displayOccupiedRooms} occupied`,
    },
    {
      label: "Vacant Units",
      value: displayVacantRooms,
      icon: DoorOpen,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50 dark:bg-emerald-500/10",
      textColor: "text-emerald-700 dark:text-emerald-400",
      subtext: "Available for rent",
    },
    {
      label: "Tenants",
      value: displayTenants,
      icon: Users,
      color: "bg-purple-500",
      lightColor: "bg-purple-50 dark:bg-purple-500/10",
      textColor: "text-purple-700 dark:text-purple-400",
      subtext: "Active tenants",
    },
    {
      label: "Pending Issues",
      value: displayPendingIssues,
      icon: Wrench,
      color: "bg-rose-500",
      lightColor: "bg-rose-50 dark:bg-rose-500/10",
      textColor: "text-rose-700 dark:text-rose-400",
      subtext: `${displayResolvedIssues} resolved`,
      alert: displayPendingIssues > 0,
    },
    {
      label: "Repairs",
      value: displayPendingRepairs,
      icon: ClipboardCheck,
      color: "bg-amber-500",
      lightColor: "bg-amber-50 dark:bg-amber-500/10",
      textColor: "text-amber-700 dark:text-amber-400",
      subtext: `${displaySolvedRepairs} completed`,
    },
    {
      label: "Applications",
      value: displayApplications,
      icon: ClipboardList,
      color: "bg-cyan-500",
      lightColor: "bg-cyan-50 dark:bg-cyan-500/10",
      textColor: "text-cyan-700 dark:text-cyan-400",
      subtext: "Pending review",
      alert: displayApplications > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((stat) => {
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
