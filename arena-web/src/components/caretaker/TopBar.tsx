"use client";

import React, { useState, useEffect } from "react";
import { Bell, Moon, Sun, Search, User, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

export const TopBar = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <header className="h-20 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 sticky top-0 z-30 px-6 flex items-center justify-between shadow-sm">
            <div className="flex-1 max-w-xl hidden md:block top-bar-item">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black dark:text-slate-400 group-focus-within:text-electric transition-colors" />
                    <input
                        type="text"
                        placeholder="System search..."
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all font-bold"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 ml-auto">
                <button className="top-bar-item p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-all relative shadow-sm group">
                    <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-950 shadow-sm" />
                </button>

                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="top-bar-item p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-sm group"
                >
                    {theme === "dark" ? <Sun className="w-5 h-5 group-hover:rotate-12 transition-transform" /> : <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />}
                </button>

                <button className="top-bar-item p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-sm group relative">
                    <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                        <Link href="#settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-white text-xs font-bold uppercase tracking-widest transition-colors">
                            <Settings className="w-4 h-4 text-slate-400" />
                            Global Settings
                        </Link>
                    </div>
                </button>

                <div className="top-bar-item h-10 w-px bg-slate-200 dark:bg-white/10 mx-2 hidden sm:block" />

                <button className="top-bar-item flex items-center gap-4 pl-1.5 pr-6 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-sm group">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-primary/20 flex items-center justify-center border border-blue-200 dark:border-primary/30 group-hover:scale-105 transition-transform shadow-sm">
                        <User className="text-primary dark:text-primary w-5 h-5" />
                    </div>
                    <div className="hidden sm:block text-left">
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">Caretaker Admin</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.15em] opacity-100">Verified Access</p>
                    </div>
                </button>
            </div>
        </header>
    );
};
