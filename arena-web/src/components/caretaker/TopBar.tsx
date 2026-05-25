"use client";

import React, { useEffect, useState } from "react";
import { Bell, LogOut, Menu, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthApi } from "@/lib/api/auth";
import {
  getCaretakerDashboardData,
  getCaretakerDashboardDataFallback,
  getCaretakerProfile,
} from "@/lib/caretaker/dashboard";
import { getUnreadCommunicationCount } from "@/lib/communication/api";
import { ActionGrid } from "./ActionGrid";

export const TopBar = () => {
  const router = useRouter();
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [displayName, setDisplayName] = useState("Caretaker");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingApps, setPendingApps] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [dashboard, profile, unread] = await Promise.all([
        getCaretakerDashboardData().then((d) => d ?? getCaretakerDashboardDataFallback()),
        getCaretakerProfile(),
        getUnreadCommunicationCount(),
      ]);
      if (cancelled) return;
      setDisplayName(
        profile?.full_name?.split(" ")[0] ||
          dashboard?.caretaker_full_name?.split(" ")[0] ||
          "Caretaker"
      );
      setAvatarUrl(profile?.avatar_url ?? null);
      setPendingApps(dashboard?.pending_applications_count ?? 0);
      setUnreadMessages(unread);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    await AuthApi.logout();
    localStorage.removeItem("user_role");
    sessionStorage.removeItem("user_role");
    router.replace("/");
  };

  return (
    <header className="sticky top-0 left-0 right-0 m-0 w-full h-16 shrink-0 border-0 bg-[#071a33] text-white shadow-[0_8px_24px_rgba(7,26,51,0.2)] flex justify-between items-center px-4 md:px-6 z-40">
      <div className="flex items-center gap-3">
        <Link href="/caretaker/dashboard" className="font-bold text-white text-sm shrink-0 lg:text-base">
          Arena Homes
        </Link>
        <span className="hidden md:inline caretaker-label-caps text-blue-100/60">Caretaker</span>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
        <Link
          href="/caretaker/messages"
          className="relative p-2 rounded-xl text-blue-50/85 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Messages"
        >
          <Bell className="w-5 h-5" />
          {unreadMessages > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setQuickActionsOpen(true)}
          className="p-2 rounded-xl text-blue-50/85 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
          aria-label="Open quick actions menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-white/20 hidden sm:block" />

        <Link
          href="/caretaker/profile"
          className="flex items-center gap-2 rounded-xl hover:bg-white/10 px-1.5 py-1 transition-colors"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white leading-none">{displayName}</p>
            <p className="caretaker-label-caps text-blue-100/70 mt-0.5">Profile</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/14 border-2 border-white/18 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-red-300 hover:bg-red-950/40 transition-colors text-sm font-semibold"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {quickActionsOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#071a33]/55 p-4 backdrop-blur-sm">
          <div className="caretaker-card w-full max-w-4xl p-5 md:p-6 shadow-2xl border-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="caretaker-label-caps text-primary">Shortcuts</p>
                <h3 className="caretaker-headline-sm font-semibold text-arena-on-surface">Quick Actions</h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickActionsOpen(false)}
                className="rounded-full bg-arena-surface-container-high p-2 text-arena-on-surface hover:bg-error-container/40 hover:text-error"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ActionGrid
              pendingApplicationsCount={pendingApps}
              showHeading={false}
              onNavigate={() => setQuickActionsOpen(false)}
            />
          </div>
        </div>
      )}
    </header>
  );
};
