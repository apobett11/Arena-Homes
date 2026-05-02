"use client";

import {
  Users,
  Building,
  AlertTriangle,
  Activity,
  UserCheck,
  Clock4,
  ArrowUpRight,
} from "lucide-react";

interface GlobalAnalyticsProps {
  stats: {
    totalProperties: number;
    totalUnits: number;
    totalTenants: number;
    activeTenants: number;
    pendingTenants: number;
    inactiveTenants: number;
    occupancyRate: number;
    totalStaff: number;
    activeEmployees: number;
    suspendedEmployees: number;
    escalatedComplaints: number;
    unresolvedComplaints: number;
    resolvedComplaints: number;
    waitingApprovals: number;
    vacantUnits: number;
    occupiedUnits: number;
  };
  loading?: boolean;
  onOpenTenants: () => void;
  onOpenProperties: () => void;
  onOpenEmployees: () => void;
  onOpenApprovals: () => void;
  onOpenComplaints: () => void;
}

export default function GlobalAnalytics({
  stats,
  loading,
  onOpenTenants,
  onOpenProperties,
  onOpenEmployees,
  onOpenApprovals,
  onOpenComplaints,
}: GlobalAnalyticsProps) {
  const metrics = [
    {
      label: "Tenants count",
      value: stats.totalTenants,
      change: `${stats.activeTenants} active • ${stats.pendingTenants} pending`,
      icon: Users,
      color: "#2563eb",
      bg: "from-blue-50 to-white",
      onClick: onOpenTenants,
    },
    {
      label: "Properties / plots",
      value: stats.totalProperties,
      change: `${stats.occupiedUnits} occupied • ${stats.vacantUnits} vacant`,
      icon: Building,
      color: "#059669",
      bg: "from-emerald-50 to-white",
      onClick: onOpenProperties,
    },
    {
      label: "Employees",
      value: stats.totalStaff,
      change: `${stats.activeEmployees} active • ${stats.suspendedEmployees} suspended`,
      icon: UserCheck,
      color: "#7c3aed",
      bg: "from-violet-50 to-white",
      onClick: onOpenEmployees,
    },
    {
      label: "Occupancy rate",
      value: `${stats.occupancyRate}%`,
      change: `${stats.occupiedUnits}/${stats.totalUnits} units occupied`,
      icon: Activity,
      color: "#16a34a",
      bg: "from-green-50 to-white",
      onClick: onOpenProperties,
    },
    {
      label: "Tenants waiting approval",
      value: stats.waitingApprovals,
      change: "Review waiting applications",
      icon: Clock4,
      color: "#d97706",
      bg: "from-amber-50 to-white",
      onClick: onOpenApprovals,
    },
    {
      label: "Complaints / escalations",
      value: stats.escalatedComplaints,
      change: `${stats.unresolvedComplaints} unresolved • ${stats.resolvedComplaints} resolved`,
      icon: AlertTriangle,
      color: "#dc2626",
      bg: "from-red-50 to-white",
      onClick: onOpenComplaints,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 opacity-100 visible">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-36 rounded-2xl border border-slate-700 bg-slate-900 shadow-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 opacity-100 visible">
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <button
            key={metric.label}
            type="button"
            onClick={metric.onClick}
            className={`group relative block min-h-[155px] w-full overflow-hidden rounded-2xl border-2 border-white/80 bg-gradient-to-br ${metric.bg} p-5 text-left text-slate-950 shadow-[0_18px_45px_rgba(15,23,42,0.35)] ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.45)] active:scale-[0.98] opacity-100 visible`}
          >
            <div
              className="absolute inset-x-0 top-0 h-1.5"
              style={{ backgroundColor: metric.color }}
            />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm"
                style={{ color: metric.color }}
              >
                <Icon className="h-6 w-6" />
              </div>

              <div className="rounded-full border border-slate-200 bg-white/90 p-2 text-slate-500 transition group-hover:text-slate-900">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>

            <div className="relative z-10 mt-5">
              <div className="text-4xl font-black tracking-tight text-slate-950">
                {metric.value}
              </div>

              <div className="mt-2 text-sm font-extrabold uppercase tracking-wide text-slate-800">
                {metric.label}
              </div>

              <div className="mt-2 text-sm font-semibold text-slate-600">
                {metric.change}
              </div>
            </div>

            <div
              className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full opacity-10"
              style={{ backgroundColor: metric.color }}
            />
          </button>
        );
      })}
    </div>
  );
}
