"use client";

import { Bell, User, Calendar } from "lucide-react";
import { useState } from "react";

export default function TopBar() {
    const [currentMonth, setCurrentMonth] = useState(
        new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })
    );

    return (
        <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50">
            <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 h-16">
                {/* Left - Month Selector */}
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#0066FF]" />
                    <select
                        value={currentMonth}
                        onChange={(e) => setCurrentMonth(e.target.value)}
                        className="bg-slate-800/50 text-white px-4 py-2 rounded-lg border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-[#0066FF] transition-all"
                    >
                        <option>{currentMonth}</option>
                        <option>December 2025</option>
                        <option>November 2025</option>
                        <option>October 2025</option>
                    </select>
                </div>

                {/* Right - Notifications & Profile */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <button className="relative p-2 rounded-lg hover:bg-slate-800/50 transition-all group">
                        <Bell className="w-5 h-5 text-slate-400 group-hover:text-[#0066FF] transition-colors" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    </button>

                    {/* Profile */}
                    <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/50 transition-all group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0066FF] to-[#00D084] flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
