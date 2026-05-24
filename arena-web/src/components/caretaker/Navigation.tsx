"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Bell,
  ClipboardList,
  DoorOpen,
  FileText,
  HelpCircle,
  Home,
  MessageSquare,
  Plus,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "./caretaker-ui";

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
  const searchParams = useSearchParams();

  return (
    <aside className="hidden lg:flex flex-col w-[240px] min-h-screen bg-arena-surface border-r border-arena-outline-variant py-6 px-4 z-40 shrink-0">
      <div className="mb-8 px-2">
        <h2 className="caretaker-headline-md text-primary font-bold">Arena Homes</h2>
        <p className="caretaker-label-caps text-arena-on-surface-variant opacity-70 mt-1">Caretaker Console</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto hide-scrollbar pr-1">
        {sidebarItems.map((item) => {
          const active = isNavActive(pathname, searchParams, item.href, null);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors font-medium text-sm",
                active
                  ? "text-primary font-bold bg-arena-surface-container-low border-r-4 border-primary rounded-r-none"
                  : "text-arena-on-surface-variant hover:bg-arena-surface-container-low"
              )}
            >
              <item.icon className={cn("w-5 h-5", active && "text-primary")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/caretaker/dashboard?tab=issues"
        className="mt-5 bg-primary-container text-on-primary-container px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm hover:opacity-90"
      >
        <Plus className="w-5 h-5" />
        New Request
      </Link>
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
