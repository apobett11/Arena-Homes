"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
    PlusCircle,
    Send,
    Users,
    Wrench,
    PieChart,
    Settings,
    ArrowUpRight
} from "lucide-react";

const actions = [
    { id: 1, title: "Add / Edit Room", icon: PlusCircle, color: "bg-blue-500", desc: "Manage inventory" },
    { id: 2, title: "Send Notification", icon: Send, color: "bg-purple-500", desc: "Bulk or individual" },
    { id: 3, title: "View Tenants", icon: Users, color: "bg-emerald-500", desc: "Directory & history" },
    { id: 4, title: "Maintenance", icon: Wrench, color: "bg-rose-500", desc: "Tickets & status" },
    { id: 5, title: "Plot Analytics", icon: PieChart, color: "bg-amber-500", desc: "Occupancy & rent" },
    { id: 6, title: "Settings", icon: Settings, color: "bg-slate-500", desc: "App preferences" },
];

export const ActionGrid = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            const items = containerRef.current.querySelectorAll(".action-card");
            gsap.fromTo(
                items,
                { opacity: 0, scale: 0.9, y: 20 },
                {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: "back.out(1.7)"
                }
            );
        }
    }, []);

    return (
        <div ref={containerRef} className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {actions.map((action) => (
                <button
                    key={action.id}
                    className="action-card group relative overflow-hidden glass rounded-3xl p-6 border border-slate-200 dark:border-white/15 text-left transition-all duration-300 hover:border-electric/50 hover:bg-slate-50 dark:hover:bg-slate-900/60 active:scale-95 bg-white dark:bg-slate-900/40"
                >
                    <div className="absolute top-4 right-4 text-slate-400 dark:text-white/40 group-hover:text-electric transition-colors">
                        <ArrowUpRight className="w-5 h-5" />
                    </div>

                    <div className={`w-12 h-12 rounded-2xl ${action.color}/10 dark:${action.color}/20 flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 border border-slate-300 dark:border-white/5`}>
                        <action.icon className={`${action.title === 'Add / Edit Room' ? 'text-blue-600 dark:text-blue-400' :
                            action.title === 'Send Notification' ? 'text-purple-600 dark:text-purple-400' :
                                action.title === 'View Tenants' ? 'text-emerald-600 dark:text-emerald-400' :
                                    action.title === 'Maintenance' ? 'text-rose-600 dark:text-rose-400' :
                                        action.title === 'Plot Analytics' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-400'} w-6 h-6`} />
                    </div>

                    <h3 className="text-slate-900 dark:text-white font-bold text-lg">{action.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-1 font-medium">{action.desc}</p>

                    <div className="absolute bottom-0 left-0 h-1 w-0 bg-electric group-hover:w-full transition-all duration-500" />
                </button>
            ))}
        </div>
    );
};
