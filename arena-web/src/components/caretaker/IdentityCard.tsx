"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { User, MapPin, Bell, ExternalLink, Home, BarChart3 } from "lucide-react";

interface CaretakerInfo {
    name: string;
    plotName: string;
    location: string;
    notifications: number;
    stats: {
        totalRooms: number;
        takenRooms: number;
        vacantRooms: number;
        paidCount: number;
        unpaidCount: number;
        openIssues: number;
    };
}

const mockData: CaretakerInfo = {
    name: "Sarah Jenkins",
    plotName: "Skyline Heights Apartments",
    location: "Upper West Side, Plot 42",
    notifications: 5,
    stats: {
        totalRooms: 48,
        takenRooms: 42,
        vacantRooms: 6,
        paidCount: 38,
        unpaidCount: 4,
        openIssues: 3,
    },
};

export const IdentityCard = () => {
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (cardRef.current) {
            gsap.fromTo(
                cardRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
            );
        }
    }, []);

    return (
        <div
            ref={cardRef}
            className="glass rounded-3xl p-6 mb-8 border border-slate-200 dark:border-white/15 shadow-xl transition-all duration-300 hover:translate-y-[-4px] bg-white dark:bg-slate-900/80"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-electric/20 flex items-center justify-center border border-electric/30">
                        <User className="text-electric w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Welcome, {mockData.name}
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-[10px] text-white rounded-full font-bold">
                                {mockData.notifications}
                            </span>
                        </h1>
                        <p className="text-slate-600 dark:text-blue-200/90 font-bold flex items-center gap-2 mt-1">
                            <Home className="w-4 h-4" /> {mockData.plotName}
                        </p>
                        <p className="text-slate-500 dark:text-slate-300 text-sm font-semibold flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> {mockData.location}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-sm font-bold transition-colors border border-slate-200 dark:border-white/5 flex items-center gap-2">
                        Open Profile
                    </button>
                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-sm font-bold transition-colors border border-slate-200 dark:border-white/5 flex items-center gap-2">
                        My Place
                    </button>
                    <button className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-colors border border-slate-200 dark:border-white/5 flex items-center gap-2">
                        Caretakers Group
                    </button>
                    <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold transition-colors border border-white/10 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> View Statistics
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-white/5">
                <StatMini label="Total Rooms" value={mockData.stats.totalRooms} />
                <StatMini label="Taken" value={mockData.stats.takenRooms} color="text-green-400" />
                <StatMini label="Vacant" value={mockData.stats.vacantRooms} color="text-blue-400" />
                <StatMini label="Paid" value={mockData.stats.paidCount} color="text-emerald-400" />
                <StatMini label="Unpaid" value={mockData.stats.unpaidCount} color="text-amber-400" />
                <StatMini label="Open Issues" value={mockData.stats.openIssues} color="text-rose-400" />
            </div>
        </div>
    );
};

const StatMini = ({ label, value, color = "text-slate-900 dark:text-white" }: { label: string; value: number; color?: string }) => {
    return (
        <div className="flex flex-col">
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">
                {label}
            </span>
            <span className={`text-xl font-bold ${color}`}>{value}</span>
        </div>
    );
};
