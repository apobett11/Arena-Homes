"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { User, MapPin, Home, BarChart3, RefreshCw, ShieldCheck } from "lucide-react";
import type { CaretakerDashboardData, CaretakerProperty } from "@/lib/caretaker/types";

interface IdentityCardProps {
  caretaker: CaretakerDashboardData;
  property: CaretakerProperty | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const IdentityCard = ({ caretaker, property, onRefresh, isRefreshing }: IdentityCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <div
      ref={cardRef}
      className="w-full rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-lg bg-white dark:bg-slate-900"
    >
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        {/* Identity Section */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <User className="text-primary w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {caretaker.caretaker_full_name || "Caretaker"}
              </h1>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                CARETAKER
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2 mt-1">
              <Home className="w-4 h-4" />
              {property?.name || caretaker.property_name || "Unassigned Property"}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {property?.location || caretaker.property_location || "No location set"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-sm font-medium transition-colors border border-slate-200 dark:border-white/10 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          )}
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium border border-primary/20">
            <ShieldCheck className="w-4 h-4" />
            Verified Access
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-white/10">
        <StatMini 
          label="Total Rooms" 
          value={caretaker.total_rooms} 
          subtext={`${caretaker.occupied_rooms} occupied`}
        />
        <StatMini 
          label="Vacant Rooms" 
          value={caretaker.vacant_rooms} 
          color="text-emerald-600 dark:text-emerald-400"
        />
        <StatMini 
          label="Tenants" 
          value={caretaker.tenants_count} 
        />
        <StatMini 
          label="Pending Issues" 
          value={caretaker.pending_issues_count} 
          color={caretaker.pending_issues_count > 0 ? "text-rose-600 dark:text-rose-400" : undefined}
        />
      </div>
    </div>
  );
};

const StatMini = ({ 
  label, 
  value, 
  color = "text-slate-900 dark:text-white",
  subtext
}: { 
  label: string; 
  value: number; 
  color?: string;
  subtext?: string;
}) => {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
        {label}
      </span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      {subtext && (
        <span className="text-xs text-slate-400 dark:text-slate-500">{subtext}</span>
      )}
    </div>
  );
};
