"use client";

import React, { useState } from "react";
import { Bell, Search, User, LogOut, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthApi } from "@/lib/api/auth";
import { ActionGrid } from "./ActionGrid";

export const TopBar = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const activeTab = (searchParams.get("tab") || "overview") as Parameters<typeof ActionGrid>[0]["activeTab"];

  const handleLogout = async () => {
    await AuthApi.logout();
    localStorage.removeItem("user_role");
    sessionStorage.removeItem("user_role");
    router.replace("/");
  };

  const handleTabChange = (tab: Parameters<typeof ActionGrid>[0]["activeTab"]) => {
    setQuickActionsOpen(false);
    router.push(tab === "overview" ? "/caretaker/dashboard" : `/caretaker/dashboard?tab=${tab}`);
  };

  return (
    <header className="sticky top-0 w-full h-16 bg-[#071a33] text-white shadow-[0_8px_24px_rgba(7,26,51,0.2)] flex justify-between items-center px-4 md:px-6 z-40">
      <div className="flex items-center gap-3 w-full max-w-xl">
        <Link href="/caretaker/dashboard" className="lg:hidden font-bold text-white text-sm shrink-0">
          Arena Homes
        </Link>
        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-100/70" />
          <input
            type="text"
            placeholder="Search units, tenants, or records..."
            className="w-full bg-white/10 border border-white/18 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-blue-100/60 focus:outline-none focus:ring-2 focus:ring-white/70"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <Link
          href="/caretaker/dashboard?tab=announcements"
          className="p-2 rounded-xl text-blue-50/85 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Notifications and announcements"
        >
          <Bell className="w-5 h-5" />
        </Link>

        <button
          type="button"
          onClick={() => setQuickActionsOpen(true)}
          className="p-2 rounded-xl text-blue-50/85 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
          aria-label="Quick actions"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-white/20 hidden md:block" />

        <Link href="/caretaker/dashboard?tab=settings" className="flex items-center gap-2 rounded-xl hover:bg-white/10 px-1.5 py-1 transition-colors">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white leading-none">Caretaker</p>
            <p className="caretaker-label-caps text-blue-100/70 mt-0.5">Lead Caretaker</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/14 border-2 border-white/18 flex items-center justify-center overflow-hidden">
            <User className="w-5 h-5 text-white" />
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-error hover:bg-error-container/30 transition-colors text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {quickActionsOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#071a33]/55 p-4 backdrop-blur-sm">
          <div className="caretaker-card w-full max-w-4xl p-5 md:p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="caretaker-label-caps text-primary">Caretaker shortcuts</p>
                <h3 className="caretaker-headline-sm font-semibold text-arena-on-surface">Quick Actions</h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickActionsOpen(false)}
                className="rounded-full bg-arena-surface-container-high p-2 text-arena-on-surface hover:bg-error-container/40 hover:text-error"
                aria-label="Close quick actions"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ActionGrid activeTab={activeTab} onTabChange={handleTabChange} showHeading={false} />
          </div>
        </div>
      )}
    </header>
  );
};
