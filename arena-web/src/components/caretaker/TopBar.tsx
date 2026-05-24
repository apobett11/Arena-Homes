"use client";

import React from "react";
import { Bell, Search, User, LogOut, Grid } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthApi } from "@/lib/api/auth";

export const TopBar = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await AuthApi.logout();
    localStorage.removeItem("user_role");
    sessionStorage.removeItem("user_role");
    router.replace("/");
  };

  return (
    <header className="sticky top-0 w-full h-16 bg-arena-surface border-b border-arena-outline-variant shadow-sm flex justify-between items-center px-4 md:px-6 z-40 lg:pl-[264px]">
      <div className="flex items-center gap-3 w-full max-w-xl">
        <Link href="/caretaker/dashboard" className="lg:hidden font-bold text-primary text-sm shrink-0">
          Arena Homes
        </Link>
        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-arena-on-surface-variant" />
          <input
            type="text"
            placeholder="Search units, tenants, or records..."
            className="w-full bg-arena-surface-container-low border border-arena-outline-variant rounded-xl pl-10 pr-4 py-2 text-sm text-arena-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <Link
          href="/caretaker/dashboard?tab=announcements"
          className="p-2 rounded-xl text-arena-on-surface-variant hover:text-primary hover:bg-arena-surface-container-low transition-colors"
          aria-label="Notifications and announcements"
        >
          <Bell className="w-5 h-5" />
        </Link>

        <Link
          href="/caretaker/dashboard?tab=facilities"
          className="p-2 rounded-xl text-arena-on-surface-variant hover:text-primary hover:bg-arena-surface-container-low transition-colors hidden sm:block"
          aria-label="Property tools"
        >
          <Grid className="w-5 h-5" />
        </Link>

        <div className="h-6 w-px bg-arena-outline-variant/60 hidden md:block" />

        <Link href="/caretaker/dashboard?tab=settings" className="flex items-center gap-2 rounded-xl hover:bg-arena-surface-container-low px-1.5 py-1 transition-colors">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-arena-on-surface leading-none">Caretaker</p>
            <p className="caretaker-label-caps text-arena-on-surface-variant mt-0.5">Lead Caretaker</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-container border-2 border-primary-container flex items-center justify-center overflow-hidden">
            <User className="w-5 h-5 text-on-primary-container" />
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
    </header>
  );
};
