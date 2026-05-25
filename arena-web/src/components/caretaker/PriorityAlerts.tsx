"use client";

import React from "react";
import { AlertTriangle, UserPlus, Radio, CheckCircle2 } from "lucide-react";
import { cn, ck } from "./caretaker-ui";

interface PriorityAlertsProps {
  pendingApplications: number;
  pendingIssues: number;
  incomingAnnouncements: number;
  onViewApplications?: () => void;
  onViewIssues?: () => void;
  onViewAnnouncements?: () => void;
}

const alertStyles = {
  warning: {
    card: "bg-gradient-to-br from-amber-50 to-white border-amber-200/80",
    icon: "bg-amber-100 text-amber-700 ring-amber-200/60",
    title: "text-amber-950",
  },
  danger: {
    card: "bg-gradient-to-br from-red-50 to-white border-red-200/80",
    icon: "bg-red-100 text-red-700 ring-red-200/60",
    title: "text-red-950",
  },
  info: {
    card: "bg-gradient-to-br from-[#eef4fc] to-white border-[#0d3b66]/15",
    icon: "bg-[#dbeafe] text-[#0d3b66] ring-[#0d3b66]/15",
    title: "text-[#0f1c2e]",
  },
} as const;

export const PriorityAlerts = ({
  pendingApplications,
  pendingIssues,
  incomingAnnouncements,
  onViewApplications,
  onViewIssues,
  onViewAnnouncements,
}: PriorityAlertsProps) => {
  const alerts = [
    pendingApplications > 0 && {
      id: "apps",
      tone: "warning" as const,
      icon: UserPlus,
      title: `${pendingApplications} application${pendingApplications === 1 ? "" : "s"} waiting`,
      subtitle: "Review and respond",
      onClick: onViewApplications,
    },
    pendingIssues > 0 && {
      id: "issues",
      tone: "danger" as const,
      icon: AlertTriangle,
      title: `${pendingIssues} pending issue${pendingIssues === 1 ? "" : "s"}`,
      subtitle: "Requires attention",
      onClick: onViewIssues,
    },
    incomingAnnouncements > 0 && {
      id: "announcements",
      tone: "info" as const,
      icon: Radio,
      title: `${incomingAnnouncements} new announcement${incomingAnnouncements === 1 ? "" : "s"}`,
      subtitle: "From administration",
      onClick: onViewAnnouncements,
    },
  ].filter(Boolean) as Array<{
    id: string;
    tone: keyof typeof alertStyles;
    icon: React.ElementType;
    title: string;
    subtitle: string;
    onClick?: () => void;
  }>;

  if (alerts.length === 0) {
    return (
      <div className="caretaker-priority-clear flex items-center gap-3 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        </span>
        <div>
          <p className="font-bold text-emerald-900 text-sm">All clear</p>
          <p className="text-xs text-emerald-700/90 mt-0.5">No urgent items need your attention right now.</p>
        </div>
      </div>
    );
  }

  return (
    <section aria-label="Priority alerts" className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {alerts.map((alert) => {
        const Icon = alert.icon;
        const style = alertStyles[alert.tone];
        return (
          <button
            key={alert.id}
            type="button"
            onClick={alert.onClick}
            className={cn(
              "flex items-center gap-4 rounded-2xl border p-4 text-left shadow-[0_8px_22px_rgba(10,37,64,0.06)] transition-all duration-200",
              "hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(10,37,64,0.1)] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#0d3b66]/25",
              style.card
            )}
          >
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1", style.icon)}>
              <Icon className="h-6 w-6" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className={cn("font-bold text-sm leading-snug", style.title)}>{alert.title}</p>
              <p className="text-xs font-semibold text-[#5c6b7a] mt-0.5">{alert.subtitle}</p>
            </div>
          </button>
        );
      })}
    </section>
  );
};
