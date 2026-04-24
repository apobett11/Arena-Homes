"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { TrendingUp, PieChart as PieIcon, ArrowUpRight } from "lucide-react";

export const AnalyticsModule = () => {
    const trendRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (trendRef.current) {
            const path = trendRef.current.querySelector(".trend-line");
            if (path) {
                const length = (path as SVGPathElement).getTotalLength();
                gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
                gsap.to(path, {
                    strokeDashoffset: 0,
                    duration: 2,
                    ease: "power2.inOut",
                    scrollTrigger: {
                        trigger: trendRef.current,
                        start: "top 80%",
                    }
                });
            }
        }
    }, []);

    return (
        <section className="mb-12" id="analytics">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Property Analytics</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Occupancy Trend */}
                <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-white/15 relative overflow-hidden bg-white dark:bg-slate-900/40 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">Occupancy Trend</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 leading-none tracking-tighter">92.4%</h3>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> +2.1%
                        </div>
                    </div>

                    <div className="h-32 w-full mt-4">
                        <svg ref={trendRef} className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                            <path
                                className="trend-line"
                                d="M0,80 Q50,70 100,75 T200,40 T300,50 T400,20"
                                fill="none"
                                stroke="#0066FF"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                            {/* Gradient Area */}
                            <path
                                d="M0,80 Q50,70 100,75 T200,40 T300,50 T400,20 L400,100 L0,100 Z"
                                fill="url(#grad1)"
                                opacity="0.2"
                            />
                            <defs>
                                <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#0066FF', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: '#0066FF', stopOpacity: 0 }} />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>

                {/* Rent Collection */}
                <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-white/15 flex gap-6 items-center bg-white dark:bg-slate-900/40">
                    <div className="relative w-28 h-28 shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="4" />
                            <circle
                                cx="18" cy="18" r="16" fill="none"
                                className="stroke-electric"
                                strokeWidth="4"
                                strokeDasharray="100 100"
                                strokeDashoffset="25"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">75%</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">Rent Collection</p>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Status: Healthy</h3>
                        <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold">Paid ($24,500)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                                <span className="text-[10px] text-slate-500 dark:text-slate-500 font-bold">Pending ($8,200)</span>
                            </div>
                        </div>
                        <button className="mt-4 flex items-center gap-1 text-primary text-[10px] font-bold uppercase tracking-widest group">
                            Full Report <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};
