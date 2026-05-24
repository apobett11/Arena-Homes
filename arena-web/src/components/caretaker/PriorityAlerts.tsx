"use client";

import React from "react";
import { AlertTriangle, UserPlus, Radio } from "lucide-react";
import { cn, alertClass } from "./caretaker-ui";

interface PriorityAlertsProps {
  pendingApplications: number;
  pendingIssues: number;
  incomingAnnouncements: number;
  onViewApplications?: () => void;
  onViewIssues?: () => void;
  onViewAnnouncements?: () => void;
}

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
      title: `${pendingApplications} Applications waiting`,
      subtitle: "Require background checks",
      onClick: onViewApplications,
    },
    pendingIssues > 0 && {
      id: "issues",
      tone: "danger" as const,
      icon: AlertTriangle,
      title: `${pendingIssues} Issues PENDING`,
      subtitle: "Requires caretaker attention",
      onClick: onViewIssues,
    },
    incomingAnnouncements > 0 && {
      id: "announcements",
      tone: "info" as const,
      icon: Radio,
      title: "New announcement",
      subtitle: "From administration",
      onClick: onViewAnnouncements,
    },
  ].filter(Boolean) as Array<{
    id: string;
    tone: "warning" | "danger" | "info";
    icon: React.ElementType;
    title: string;
    subtitle: string;
    onClick?: () => void;
  }>;

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm ring-1 ring-emerald-500/10">
        <span className="w-3 h-3 bg-emerald-500 rounded-full status-pulse" />
        <span className="caretaker-label-caps text-emerald-700">Status: All Clear</span>
      </div>
    );
  }

  return (
    <section className="flex flex-col md:flex-row gap-5">
      {alerts.map((alert) => {
        const Icon = alert.icon;
        return (
          <button
            key={alert.id}
            type="button"
            onClick={alert.onClick}
            className={cn(
              alertClass(alert.tone),
              "flex-1 min-w-[200px] text-left transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            )}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/72 shadow-sm ring-1 ring-black/5">
              <Icon className="w-6 h-6 shrink-0" />
            </span>
            <div>
              <p className="font-bold text-sm leading-snug">{alert.title}</p>
              <p className="caretaker-label-caps opacity-75 mt-0.5">{alert.subtitle}</p>
            </div>
          </button>
        );
      })}
    </section>
  );
};
