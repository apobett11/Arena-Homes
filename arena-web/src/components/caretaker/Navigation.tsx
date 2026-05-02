"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    DoorOpen,
    Users,
    MessageSquare,
    Settings,
    ChevronRight,
    ShieldCheck
} from "lucide-react";
import { gsap } from "gsap";

const navItems = [
    { name: "Home", icon: Home, href: "/caretaker/dashboard" },
    { name: "Rooms", icon: DoorOpen, href: "#rooms" },
    { name: "Tenants", icon: Users, href: "#tenants" },
    { name: "Messages", icon: MessageSquare, href: "#messages" },
];

export const Sidebar = () => {
    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (sidebarRef.current) {
            gsap.fromTo(
                sidebarRef.current,
                { x: -100, opacity: 0 },
                { x: 0, opacity: 1, duration: 1, ease: "power4.out" }
            );
        }
    }, []);

    return (
        <aside
            ref={sidebarRef}
            className="hidden lg:flex flex-col w-64 min-h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-white/10 p-6 z-40"
        >
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <ShieldCheck className="text-white w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-slate-900 dark:text-white font-bold text-xl tracking-tight uppercase">Arena</h2>
                    <p className="text-primary text-[10px] uppercase font-bold tracking-widest mt-[-4px]">Command Center</p>
                </div>
            </div>

            <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="group flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-white border border-transparent hover:border-slate-200"
                    >
                        <div className="flex items-center gap-4">
                            <item.icon className="w-6 h-6 group-hover:text-primary dark:group-hover:text-primary transition-colors" />
                            <span className="font-bold text-sm uppercase tracking-wide">{item.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                    </Link>
                ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-200 dark:border-white/10">
                <Link
                    href="#settings"
                    className="flex items-center gap-3 p-3 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                >
                    <Settings className="w-5 h-5" />
                    <span className="font-bold">Settings</span>
                </Link>
            </div>
        </aside>
    );
};

export const BottomNav = () => {
    return (
        <div className="lg:hidden fixed bottom-10 left-6 right-6 z-50 p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-3xl shadow-xl">
            <div className="flex justify-between items-center max-w-md mx-auto">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                    >
                        <item.icon className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{item.name}</span>
                    </Link>
                ))}
                <Link
                    href="#settings"
                    className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                >
                    <Settings className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Settings</span>
                </Link>
            </div>
        </div>
    );
};
