"use client";

import React, { useState } from "react";
import { DoorOpen, Users, Info, ArrowRight, Home } from "lucide-react";

interface RoomsInventoryProps {
    vacantCount?: number;
    totalCount?: number;
}

const roomCategories = [
    { type: "Single Room", total: 12, taken: 10, vacant: 2, icon: Home },
    { type: "Bedsitter", total: 20, taken: 18, vacant: 2, icon: DoorOpen },
    { type: "One Bedroom", total: 10, taken: 9, vacant: 1, icon: Home },
    { type: "Two Bedroom", total: 6, taken: 5, vacant: 1, icon: Users },
];

export const RoomsInventory = ({ vacantCount, totalCount }: RoomsInventoryProps) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    return (
        <section className="mb-12" id="rooms">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Inventory Overview
                    {(totalCount !== undefined) && (
                        <span className="text-sm font-normal text-slate-500">
                            ({totalCount - (vacantCount || 0)}/{totalCount} Occupied)
                        </span>
                    )}
                </h2>
                <button className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all hover:bg-black shadow-sm uppercase tracking-widest">
                    Manage Inventory
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {roomCategories.map((cat) => (
                    <div
                        key={cat.type}
                        onClick={() => setSelectedCategory(cat.type)}
                        className="glass p-5 rounded-3xl border border-slate-200 dark:border-white/15 cursor-pointer hover:border-electric/40 transition-all group bg-white dark:bg-slate-900/40"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <cat.icon className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-slate-900 dark:text-white font-bold">{cat.type}</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500 dark:text-slate-300 font-bold uppercase tracking-widest">Occupancy</span>
                                <span className="text-slate-900 dark:text-white font-bold">{Math.round((cat.taken / cat.total) * 100)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-transparent">
                                <div
                                    className="h-full bg-primary"
                                    style={{ width: `${(cat.taken / cat.total) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs pt-1">
                                <span className="text-slate-500 dark:text-slate-500 font-bold">{cat.taken} Taken</span>
                                <span className="text-emerald-700 dark:text-emerald-400 font-bold tracking-widest">{cat.vacant} Vacant</span>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 glass rounded-3xl p-6 border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/40">
                <div className="flex flex-col md:flex-row gap-6 md:items-center">
                    <div className="w-16 h-16 rounded-2xl bg-electric/10 flex items-center justify-center shrink-0 border border-electric/20">
                        <Home className="text-electric w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-slate-900 dark:text-white font-bold text-lg">Plot Facilities & Amenities</h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mt-1 font-medium">Details updated: 12 Jan 2026. Syncs automatically with tenant dashboards.</p>
                        <div className="flex flex-wrap gap-2 mt-4">
                            {["Borehole Water", "24/7 Security", "Gated Parking", "Fiber Internet", "Trash Collection"].map(tag => (
                                <span key={tag} className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <button className="px-6 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold transition-all uppercase tracking-tight">
                        Edit Details
                    </button>
                </div>
            </div>
        </section>
    );
};
