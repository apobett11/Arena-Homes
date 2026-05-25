"use client";

import React from "react";
import { Crown, Home, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import type { CaretakerProperty } from "@/lib/caretaker/types";
import { statusChipClass, statusToneFromValue } from "./caretaker-ui";

interface PropertyDetailsCardProps {
  property: CaretakerProperty;
  totalUnits?: number;
  occupiedUnits?: number;
}

export const PropertyDetailsCard = ({
  property,
  totalUnits = 0,
  occupiedUnits = 0,
}: PropertyDetailsCardProps) => {
  const occupancy = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  return (
    <section className="caretaker-property-premium relative overflow-hidden rounded-[20px] border border-[#c9a227]/35 p-6 md:p-8 shadow-[0_24px_56px_rgba(10,37,64,0.14)]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#d4af37]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-[#0d3b66]/12 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c9a227]/45 bg-[#fff9e8] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a6d1d]">
              <Crown className="h-3.5 w-3.5 text-[#c9a227]" />
              Premium estate
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0d3b66]/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0d3b66]">
              <Sparkles className="h-3 w-3" />
              Arena Homes
            </span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-[#0a2540] md:text-[1.65rem]">
            {property.name}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-[#5c6b7a]">
            <MapPin className="h-4 w-4 shrink-0 text-[#c9a227]" />
            {property.location || "Location not set"}
          </p>

          {property.description && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#5c6b7a]">{property.description}</p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DetailPill label="Type" value={property.property_type || "Residential"} />
            <DetailPill label="Units" value={String(totalUnits)} />
            <DetailPill label="Occupancy" value={`${occupancy}%`} />
            <DetailPill
              label="Listing"
              value={property.listing_status || "—"}
            />
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-[220px]">
          <div className="rounded-2xl border border-[#c9a227]/30 bg-gradient-to-br from-[#fffdf6] to-[#f5edd4] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#c9a227] to-[#8a6d1d] text-white shadow-lg">
              <Home className="h-6 w-6" />
            </div>
            <p className="caretaker-label-caps text-[#8a6d1d]">Your stewardship</p>
            <p className="mt-1 text-sm font-semibold leading-snug text-[#0f1c2e]">
              Curated living experience for every resident on this property.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className={statusChipClass(statusToneFromValue(property.verification_status))}>
                {property.verification_status}
              </span>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-emerald-800">
              <ShieldCheck className="h-4 w-4" />
              Verified caretaker access
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#0d3b66]/10 bg-white/80 px-3 py-2.5">
      <p className="caretaker-label-caps text-[#8b9aab]">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-[#0f1c2e]">{value}</p>
    </div>
  );
}
