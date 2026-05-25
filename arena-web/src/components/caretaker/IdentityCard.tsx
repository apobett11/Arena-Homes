"use client";

import React from "react";
import { User, MapPin, Home, RefreshCw, ShieldCheck, Building2 } from "lucide-react";
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
      <div className={ck.identityCard}>
        <p className={ck.body}>Loading caretaker data...</p>
      </div>
    );
  }

  return (
    <div className={cn(ck.identityCard, "grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]")}>
      <div className="flex items-center gap-5">
        <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-gradient-to-br from-[#0a2540] to-[#1a4d7a] shadow-[0_14px_32px_rgba(10,37,64,0.28)] ring-1 ring-white/15 shrink-0">
          <User className="h-10 w-10 text-white" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="caretaker-label-caps text-[#0d3b66]">Caretaker profile</p>
          <h3 className={cn(ck.headline, "text-xl md:text-2xl truncate")}>
            {caretaker.caretaker_full_name || "Caretaker"}
          </h3>
          <span className={cn(statusChipClass("manage"), "mt-2")}>CARETAKER</span>
          <p className={cn(ck.body, "mt-3 flex items-center gap-2")}>
            <Home className="h-4 w-4 shrink-0 text-[#0d3b66]" />
            <span className="truncate">{property?.name || caretaker.property_name || "Unassigned property"}</span>
          </p>
          <p className={cn(ck.body, "flex items-center gap-2")}>
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{property?.location || caretaker.property_location || "No location set"}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4">
        <div className="rounded-2xl border border-[#0d3b66]/12 bg-gradient-to-br from-[#f0f5fb] to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#0d3b66]" />
            <p className="caretaker-label-caps text-[#0d3b66]">Managed property</p>
          </div>
          <h4 className="font-bold text-[#0f1c2e] text-lg">{property?.name || caretaker.property_name}</h4>
          <p className={cn(ck.body, "mt-1")}>
            {caretaker.total_rooms} units · {property?.location || caretaker.property_location || "—"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="caretaker-chip border-[#0d3b66]/20 bg-[#e8f0fa] text-[#0d3b66]">
              {caretaker.occupied_rooms} occupied
            </span>
            <span className="caretaker-chip border-emerald-200 bg-emerald-50 text-emerald-800">
              {caretaker.vacant_rooms} vacant
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {onRefresh && (
            <button type="button" onClick={onRefresh} disabled={isRefreshing} className={ck.btnGhost}>
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh data
            </button>
          )}
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            Verified access
          </div>
        </div>
      </div>
    </div>
  );
};
