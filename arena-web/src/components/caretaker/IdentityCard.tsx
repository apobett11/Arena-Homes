"use client";

import React from "react";
import { User, MapPin, Home, RefreshCw, ShieldCheck } from "lucide-react";
import type { CaretakerDashboardData, CaretakerProperty } from "@/lib/caretaker/types";
import { cn, ck, statusChipClass } from "./caretaker-ui";

interface IdentityCardProps {
  caretaker?: CaretakerDashboardData | null;
  property?: CaretakerProperty | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const IdentityCard = ({
  caretaker,
  property,
  onRefresh,
  isRefreshing,
}: IdentityCardProps) => {
  if (!caretaker) {
    return (
      <div className={ck.card}>
        <p className={ck.body}>Loading caretaker data...</p>
      </div>
    );
  }

  return (
    <div className={cn(ck.card, "grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_54%,#eefdf6_100%)]")}>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-950 to-blue-900 flex items-center justify-center shrink-0 border border-white/20 shadow-[0_16px_32px_rgba(15,23,42,0.22)]">
          <User className="text-white w-10 h-10" />
        </div>
        <div>
          <p className="caretaker-label-caps text-primary">Caretaker</p>
          <h3 className={ck.headline}>{caretaker.caretaker_full_name || "Caretaker"}</h3>
          <span className={statusChipClass("manage")}>CARETAKER</span>
          <p className={cn(ck.body, "flex items-center gap-2 mt-2")}>
            <Home className="w-4 h-4 text-primary" />
            {property?.name || caretaker.property_name || "Unassigned Property"}
          </p>
          <p className={cn(ck.body, "flex items-center gap-2")}>
            <MapPin className="w-4 h-4" />
            {property?.location || caretaker.property_location || "No location set"}
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4">
        <div className="caretaker-card p-4 bg-[linear-gradient(135deg,#eff6ff,#f8fafc)] border-blue-200/60 shadow-sm">
          <p className="caretaker-label-caps text-primary mb-1">Managed property</p>
          <h4 className="font-semibold text-arena-on-surface">{property?.name || caretaker.property_name}</h4>
          <p className={ck.body}>
            {caretaker.total_rooms} units - {property?.location || caretaker.property_location || "-"}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="caretaker-chip bg-blue-50 text-blue-700 border-blue-200">
              {caretaker.occupied_rooms} occupied
            </span>
            <span className="caretaker-chip bg-emerald-50 text-emerald-700 border-emerald-200">
              {caretaker.vacant_rooms} vacant
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {onRefresh && (
            <button type="button" onClick={onRefresh} disabled={isRefreshing} className={ck.btnGhost}>
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              Refresh data
            </button>
          )}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-200 shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            Verified access
          </div>
        </div>
      </div>
    </div>
  );
};
