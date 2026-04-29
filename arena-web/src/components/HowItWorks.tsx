"use client";

import { Search, CalendarCheck, Key } from "lucide-react";
import { motion } from "framer-motion";

export const HowItWorks = () => {
    const steps = [
        { 
            icon: Search,
            title: "Search", 
            desc: "Browse verified listings near Egerton University with smart filters for price, location, and amenities." 
        },
        { 
            icon: CalendarCheck,
            title: "Visit", 
            desc: "Schedule in-person tours at your convenience. Meet caretakers and see the rooms before deciding." 
        },
        { 
            icon: Key,
            title: "Move In", 
            desc: "Sign your lease digitally and get your keys. Start enjoying your new student home within 24 hours!" 
        }
    ];

    return (
        <section className="py-8 md:py-12 bg-white dark:bg-slate-950">
            <div className="container mx-auto px-4 md:px-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-6 md:mb-8"
                >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1 block">Simple Process</span>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                        How It Works
                    </h2>
                </motion.div>

                {/* Mobile: Horizontal scroll / row layout; Desktop: Grid */}
                <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-4 px-4 md:mx-auto md:px-0">
                    {steps.map((step, index) => (
                        <motion.div 
                            key={index} 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="relative flex md:flex-col items-center md:text-center gap-3 md:gap-0 min-w-[260px] md:min-w-0 bg-slate-50 dark:bg-slate-900 md:bg-transparent rounded-xl p-3 md:p-0"
                        >
                            {/* Connector Line - Desktop only */}
                            {index < 2 && (
                                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                            )}
                            
                            {/* Mobile: Horizontal connector */}
                            {index < 2 && (
                                <div className="md:hidden absolute left-[70px] top-1/2 -translate-y-1/2 w-[calc(100%-80px)] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                            )}
                            
                            <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-premium text-white shadow-md shadow-primary/20 md:mb-3 shrink-0">
                                <step.icon size={22} />
                            </div>
                            
                            <div className="flex-1 md:text-center">
                                <div className="flex items-center md:justify-center gap-2 mb-1 md:mb-2">
                                    <span className="inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10px] md:text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                                        {step.title}
                                    </h3>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm leading-relaxed line-clamp-2 md:line-clamp-none">
                                    {step.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
