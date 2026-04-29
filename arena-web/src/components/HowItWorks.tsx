"use client";

import { Search, ArrowRightLeft, FileText, KeyRound } from "lucide-react";
import { motion } from "framer-motion";

export const HowItWorks = () => {
    const steps = [
        { 
            icon: Search,
            title: "Search", 
            desc: "Browse verified listings near Egerton University with smart filters for price, location, and amenities." 
        },
        { 
            icon: ArrowRightLeft,
            title: "Compare", 
            desc: "Review photos, pricing, amenities, and caretaker details. Shortlist your favorites." 
        },
        { 
            icon: FileText,
            title: "Apply", 
            desc: "Submit your application with one click. The caretaker reviews and responds within 24 hours." 
        },
        { 
            icon: KeyRound,
            title: "Visit & Move In", 
            desc: "Schedule a viewing, sign digitally, and get your keys. Start enjoying your new student home!" 
        }
    ];

    return (
        <section className="py-20 md:py-28 bg-white dark:bg-slate-950 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Simple Process
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white">
                        How It <span className="text-gradient">Works</span>
                    </h2>
                    <p className="mt-4 text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
                        Four simple steps to find and secure your perfect student home
                    </p>
                </motion.div>

                {/* 4-Step Timeline - Responsive */}
                <div className="relative">
                    {/* Desktop Connector Line */}
                    <div className="hidden lg:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-slate-200 via-primary/20 to-slate-200 dark:from-slate-800 dark:via-primary/30 dark:to-slate-800" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
                        {steps.map((step, index) => (
                            <motion.div 
                                key={index} 
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.15, duration: 0.5 }}
                                className="relative"
                            >
                                <div className="card-luxury p-6 md:p-8 text-center h-full group hover:border-primary/20 transition-all">
                                    {/* Step Number Badge */}
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-premium text-white text-sm font-bold shadow-lg shadow-primary/30">
                                            {index + 1}
                                        </span>
                                    </div>
                                    
                                    {/* Icon */}
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 mb-5 mt-4 group-hover:scale-110 transition-transform duration-300">
                                        <step.icon size={28} className="text-primary" />
                                    </div>
                                    
                                    {/* Content */}
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                                        {step.title}
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                        {step.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
