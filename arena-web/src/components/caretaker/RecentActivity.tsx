"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { AlertCircle, CheckCircle2, Info, Clock, ArrowRight } from "lucide-react";

const activities = [
    {
        id: 1,
        type: "warning",
        title: "Rent Overdue",
        desc: "Room A3 (John Doe) is 3 days late on rent.",
        time: "2 hours ago",
        icon: AlertCircle,
        color: "text-amber-400",
        bg: "bg-amber-400/10"
    },
    {
        id: 2,
        type: "maintenance",
        title: "Issue Resolved",
        desc: "Water leakage in B1 has been fixed by the technician.",
        time: "5 hours ago",
        icon: CheckCircle2,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10"
    },
    {
        id: 3,
        type: "notification",
        title: "Broadcast Sent",
        desc: "New plot rules have been sent to all 42 tenants.",
        time: "Yesterday",
        icon: Info,
        color: "text-blue-400",
        bg: "bg-blue-400/10"
    },
    {
        id: 4,
        type: "tenant",
        title: "New Move-in",
        desc: "Alice Smith moved into Room A2.",
        time: "2 days ago",
        icon: CheckCircle2,
        color: "text-purple-400",
        bg: "bg-purple-400/10"
    },
];

export const RecentActivity = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            const cards = containerRef.current.querySelectorAll(".activity-card");
            gsap.fromTo(
                cards,
                { opacity: 0, x: 50 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top 90%",
                    }
                }
            );
        }
    }, []);

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Recent Activity
                    <span className="w-2 h-2 rounded-full bg-electric animate-pulse" />
                </h2>
                <button className="text-electric text-sm font-bold flex items-center gap-1 hover:underline">
                    View All <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            <div
                ref={containerRef}
                className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide px-2 -mx-2 snap-x"
            >
                {activities.map((activity) => (
                    <div
                        key={activity.id}
                        className="activity-card min-w-[300px] md:min-w-[350px] snap-start glass rounded-3xl p-5 border border-slate-200 dark:border-white/15 flex flex-col justify-between hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors bg-white dark:bg-slate-900/40"
                    >
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-2xl ${activity.bg} flex items-center justify-center shrink-0 border border-slate-300 dark:border-white/5`}>
                                <activity.icon className={`w-6 h-6 ${activity.color} group-hover:scale-110 transition-transform`} />
                            </div>
                            <div>
                                <h3 className="text-slate-900 dark:text-white font-bold">{activity.title}</h3>
                                <p className="text-slate-600 dark:text-slate-300 text-sm mt-1 leading-snug font-medium">{activity.desc}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            <Clock className="w-3 h-3" />
                            {activity.time}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
