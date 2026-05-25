"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Home, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

import { IdentityCard } from "@/components/caretaker/IdentityCard";
import { CaretakerQuickAccess } from "@/components/caretaker/CaretakerQuickAccess";
import { PropertyDetailsCard } from "@/components/caretaker/PropertyDetailsCard";
import { HomepageRulesFaqs } from "@/components/caretaker/HomepageRulesFaqs";
import { CaretakerFooter } from "@/components/caretaker/CaretakerFooter";
import { useCaretakerWorkspace } from "@/hooks/useCaretakerWorkspace";
import { cn, ck } from "@/components/caretaker/caretaker-ui";

const TAB_REDIRECTS: Record<string, string> = {
  units: "/caretaker/units",
  tenants: "/caretaker/tenants",
  issues: "/caretaker/issues",
  repairs: "/caretaker/repairs",
  applications: "/caretaker/applications",
  announcements: "/caretaker/announcements",
  rules: "/caretaker/dashboard",
  leases: "/caretaker/tenants",
  photos: "/caretaker/photos",
  facilities: "/caretaker/dashboard",
  settings: "/caretaker/profile",
};

function CaretakerHomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  const workspace = useCaretakerWorkspace();

  useEffect(() => {
    if (tab && TAB_REDIRECTS[tab]) {
      router.replace(TAB_REDIRECTS[tab]);
    }
  }, [tab, router]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (tab && TAB_REDIRECTS[tab]) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#0d3b66]/20 border-t-[#0d3b66]" />
      </div>
    );
  }

  if (workspace.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="caretaker-loading-shell flex flex-col items-center gap-4 px-10 py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-[#0d3b66]/20 border-t-[#0d3b66]" />
          <p className="text-sm font-semibold text-[#5c6b7a]">Loading your property dashboard…</p>
        </div>
      </div>
    );
  }

  if (workspace.error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <div className="caretaker-overview-panel max-w-md border-l-4 border-l-red-500 text-center">
          <p className="font-semibold text-red-800">{workspace.error}</p>
          <button type="button" onClick={() => workspace.refresh()} className={cn(ck.btnPrimary, "mt-5")}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const photosComplete =
    workspace.photoStatus.total_count >= 10 &&
    workspace.photoStatus.has_cover &&
    workspace.photoStatus.has_gate &&
    workspace.photoStatus.gallery_count >= 8;

  return (
    <div className={cn(ck.page, "pb-2")}>
      <section className={ck.hero}>
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="caretaker-label-caps text-white/65">Property operations</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white md:text-[1.75rem]">
              {greeting()}, {workspace.dashboardData?.caretaker_full_name?.split(" ")[0] || "Caretaker"}
            </h1>
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-100/90">
              <Home className="h-4 w-4 shrink-0 text-sky-200" />
              <p>
                {workspace.property?.name || workspace.dashboardData?.property_name || "Assigned property"}
                <span className="mx-2 opacity-50">·</span>
                {workspace.property?.location || workspace.dashboardData?.property_location || "Location not set"}
              </p>
            </div>
          </div>
          <Link
            href="/caretaker/photos"
            className={cn(
              "relative z-10 inline-flex min-h-[44px] items-center justify-center gap-2 self-start rounded-xl px-5 py-2.5 text-sm font-bold transition duration-200 active:scale-[0.98] md:self-auto",
              photosComplete
                ? "bg-emerald-500 text-white shadow-[0_10px_24px_rgba(16,185,129,0.35)] ring-1 ring-white/25 hover:bg-emerald-600"
                : "bg-white text-[#0d3b66] shadow-[0_10px_24px_rgba(0,0,0,0.15)] ring-1 ring-white/40 hover:bg-blue-50"
            )}
          >
            <ImageIcon className="h-4 w-4" />
            {photosComplete ? "Photos complete" : "Upload property photos"}
          </Link>
        </div>
      </section>

      <IdentityCard
        caretaker={workspace.dashboardData}
        property={workspace.property}
        onRefresh={workspace.refresh}
        isRefreshing={workspace.refreshing}
      />

      <CaretakerQuickAccess
        counts={{
          pendingApplications: workspace.pendingApplications,
          pendingIssues: workspace.pendingIssues,
          pendingRepairs: workspace.pendingRepairs,
          unreadMessages: workspace.unreadMessages,
          tenantsCount: workspace.dashboardData?.tenants_count ?? workspace.tenants.length,
          totalUnits: workspace.dashboardData?.total_rooms ?? workspace.units.length,
        }}
      />

      {workspace.property && (
        <PropertyDetailsCard
          property={workspace.property}
          totalUnits={workspace.dashboardData?.total_rooms ?? workspace.units.length}
          occupiedUnits={workspace.dashboardData?.occupied_rooms ?? 0}
        />
      )}

      {workspace.propertyId && (
        <HomepageRulesFaqs
          rules={workspace.rules}
          faqs={workspace.faqs}
          propertyId={workspace.propertyId}
          onDataChange={workspace.refresh}
        />
      )}

      <CaretakerFooter />
    </div>
  );
}

export default function CaretakerDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-[#0d3b66]/20 border-t-[#0d3b66]" />
        </div>
      }
    >
      <CaretakerHomeContent />
    </Suspense>
  );
}
