"use client";

import { Bell, Search, Settings, ShieldCheck } from "lucide-react";

export default function AdminTopBar() {
    return (
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

                {/* Notifications */}
                <button className="relative w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-slate-900"></span>
                </button>

                {/* Settings Toggle */}
                <button className="w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center justify-center">
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
