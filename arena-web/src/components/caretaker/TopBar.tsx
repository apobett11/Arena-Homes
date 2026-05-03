"use client";

import React, { useState, useEffect } from "react";
import { Bell, Moon, Sun, Search, User, Settings, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { AuthApi } from "@/lib/api/auth";

export const TopBar = () => {
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        await AuthApi.logout();
        localStorage.removeItem('user_role');
        sessionStorage.removeItem('user_role');
        router.replace('/');
    };

    if (!mounted) return null;

    return (
        <header className="h-16 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between shadow-sm">
            <div className="flex-1 max-w-lg hidden md:block">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
                <button className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all relative shadow-sm">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950" />
                </button>

                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                >
                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                <button className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                    <Settings className="w-4 h-4" />
                </button>

                <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block" />

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all text-sm font-medium"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                </button>

                <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block" />

                <div className="flex items-center gap-2 pl-1">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        <User className="text-primary w-4 h-4" />
                    </div>
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">Caretaker</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Property Manager</p>
                    </div>
                </div>
            </div>
        </header>
    );
};
