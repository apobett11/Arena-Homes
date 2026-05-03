"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Bell, Search, Settings, ShieldCheck, Plus, Building2, Users, FileText } from "lucide-react";
import NotificationsModal from "@/components/admin/NotificationsModal";

const quickActions = [
    { label: "Add Property", icon: Building2, href: "/admin/properties/add" },
    { label: "Add Employee", icon: Users, href: "/admin/employees/add" },
    { label: "New Lease", icon: FileText, href: "/admin/leases/new" },
];

export default function AdminTopBar() {
    const router = useRouter();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showQuickMenu, setShowQuickMenu] = useState(false);
    const quickMenuRef = useRef<HTMLDivElement>(null);

    useClickOutside(quickMenuRef, () => setShowQuickMenu(false));

    return (
        <>
            <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/50 h-16 px-4 md:px-8 flex items-center justify-between">
                {/* Left: Mobile Title or Breadcrumbs */}
                <div className="flex items-center gap-4">
                    <div className="lg:hidden">
                        <span className="font-bold text-lg bg-gradient-to-r from-[#0066FF] to-[#00D084] bg-clip-text text-transparent">Arena</span>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
                        <ShieldCheck className="w-4 h-4 text-[#0066FF]" />
                        <span className="text-slate-600">/</span>
                        <span className="text-slate-200 font-medium">Command Center</span>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 md:gap-5">
                    {/* Search - Desktop */}
                    <div className="hidden md:block relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search system..."
                            className="w-64 bg-slate-950/50 border border-slate-800 rounded-full py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/20 transition-all"
                        />
                    </div>

                    <div className="h-6 w-px bg-slate-800 hidden md:block"></div>

                    {/* Quick Actions */}
                    <div className="relative" ref={quickMenuRef}>
                        <button
                            onClick={() => setShowQuickMenu(!showQuickMenu)}
                            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-[#0066FF]/10 hover:bg-[#0066FF]/20 text-[#0066FF] transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium">Quick Add</span>
                        </button>

                        {showQuickMenu && (
                            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-700 bg-slate-800 shadow-xl z-50 overflow-hidden">
                                <div className="py-2">
                                    <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Quick Actions
                                    </div>
                                    {quickActions.map((action) => {
                                        const Icon = action.icon;
                                        return (
                                            <button
                                                key={action.href}
                                                onClick={() => {
                                                    router.push(action.href);
                                                    setShowQuickMenu(false);
                                                }}
                                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                            >
                                                <Icon className="w-4 h-4" />
                                                {action.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-6 w-px bg-slate-800 hidden md:block"></div>

                    {/* Notifications */}
                    <button
                        onClick={() => setShowNotifications(true)}
                        className="relative w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors active:scale-95 flex items-center justify-center"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-slate-900"></span>
                    </button>

                    {/* Settings Toggle */}
                    <button
                        onClick={() => router.push("/admin/settings")}
                        className="w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors active:scale-95 flex items-center justify-center"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </header>
            <NotificationsModal open={showNotifications} onClose={() => setShowNotifications(false)} />
        </>
    );
}

// Click outside handler hook
function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler();
        };
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
}
