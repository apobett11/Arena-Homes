"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  ClipboardList,
  DoorOpen,
  FileText,
  HelpCircle,
  Home,
  MessageSquare,
  Plus,
  Sparkles,
  Settings,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "./caretaker-ui";
import { ActionGrid } from "./ActionGrid";

const sidebarItems = [
  { name: "Home", icon: Home, href: "/caretaker/dashboard" },
  { name: "Units", icon: DoorOpen, href: "/caretaker/dashboard?tab=units" },
  { name: "Tenants", icon: Users, href: "/caretaker/dashboard?tab=tenants" },
  { name: "Applications", icon: ClipboardList, href: "/caretaker/dashboard?tab=applications" },
  { name: "Issues", icon: Wrench, href: "/caretaker/dashboard?tab=issues" },
  { name: "Messages", icon: MessageSquare, href: "/caretaker/messages" },
  { name: "Content", icon: FileText, href: "/caretaker/dashboard?tab=facilities" },
  { name: "Rules & FAQ", icon: HelpCircle, href: "/caretaker/dashboard?tab=rules" },
  { name: "Announcements", icon: Bell, href: "/caretaker/dashboard?tab=announcements" },
  { name: "Settings", icon: Settings, href: "/caretaker/dashboard?tab=settings" },
];

const bottomNavItems = [
  { name: "Home", icon: Home, href: "/caretaker/dashboard", matchTab: null },
  { name: "Units", icon: DoorOpen, href: "/caretaker/dashboard?tab=units", matchTab: "units" },
  { name: "Tenants", icon: Users, href: "/caretaker/dashboard?tab=tenants", matchTab: "tenants" },
  { name: "Messages", icon: MessageSquare, href: "/caretaker/messages", matchTab: null },
  { name: "Settings", icon: Settings, href: "/caretaker/dashboard?tab=settings", matchTab: "settings" },
];

function isNavActive(pathname: string, searchParams: URLSearchParams, href: string, matchTab: string | null) {
  const [path, query] = href.split("?");
  if (pathname !== path) {
    if (href === "/caretaker/messages" && pathname.startsWith("/caretaker/messages")) return true;
    if (href === "/caretaker/applications" && pathname.startsWith("/caretaker/applications")) return true;
    return false;
  }
  if (!query) {
    const tab = searchParams.get("tab");
    return !tab || tab === "overview";
  }
  const expectedTab = new URLSearchParams(query).get("tab");
  return searchParams.get("tab") === expectedTab || (matchTab && searchParams.get("tab") === matchTab);
}

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const activeTab = (searchParams.get("tab") || "overview") as Parameters<typeof ActionGrid>[0]["activeTab"];

  const handleTabChange = (tab: Parameters<typeof ActionGrid>[0]["activeTab"]) => {
    setQuickActionsOpen(false);
    router.push(tab === "overview" ? "/caretaker/dashboard" : `/caretaker/dashboard?tab=${tab}`);
  };

  return (
    <aside className="hidden lg:flex sticky top-0 flex-col w-[240px] h-screen bg-[#071a33] text-white py-6 px-4 z-40 shrink-0 shadow-[8px_0_30px_rgba(7,26,51,0.16)]">
      <div className="mb-8 px-2">
        <h2 className="caretaker-headline-md text-white font-bold">Arena Homes</h2>
        <p className="caretaker-label-caps text-blue-100/75 mt-1">Caretaker Console</p>
      </div>

      <nav className="flex-1 space-y-1 pr-1">
        {sidebarItems.map((item) => {
          const active = isNavActive(pathname, searchParams, item.href, null);
          const navItem = (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors font-medium text-sm",
                active
                  ? "text-white font-bold bg-white/14 shadow-inner"
                  : "text-blue-50/82 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", active && "text-sky-200")} />
              <span>{item.name}</span>
            </Link>
          );

          if (item.name !== "Home") {
            return navItem;
          }

          return (
            <React.Fragment key={item.name}>
              {navItem}
              <button
                type="button"
                onClick={() => setQuickActionsOpen(true)}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-blue-50/82 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Sparkles className="h-5 w-5" />
                <span>Quick Actions</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      <Link
        href="/caretaker/dashboard?tab=issues"
        className="mt-5 bg-[#2e5bff] text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm hover:bg-[#416aff]"
      >
        <Plus className="w-5 h-5" />
        New Request
      </Link>

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
            <ActionGrid
              activeTab={activeTab}
              onTabChange={handleTabChange}
              showHeading={false}
            />
          </div>
        </div>
      )}
    </aside>
  );
};

export const BottomNav = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-4 py-2 pb-safe bg-arena-surface shadow-[0px_-4px_20px_rgba(0,0,0,0.05)] rounded-t-xl">
      {bottomNavItems.map((item) => {
        const active = isNavActive(pathname, searchParams, item.href, item.matchTab);
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center px-3 py-1.5 rounded-xl min-w-[56px] transition-colors",
              active
                ? "bg-primary-container text-on-primary-container"
                : "text-arena-on-surface-variant"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="caretaker-label-caps text-[10px] mt-0.5">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};
