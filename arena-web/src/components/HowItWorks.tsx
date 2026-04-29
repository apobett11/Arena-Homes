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
        <section className="py-8 md:py-10 bg-[#FAF9F6]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-6"
                >
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#1E3A8A]">
                        <span className="w-2 h-2 rounded-full bg-[#1E3A8A]" />
                        Simple Process
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-[#1F2937] mt-1">
                        How It <span className="text-gradient">Works</span>
                    </h2>
                </motion.div>

                {/* 4-Step Grid - Compact */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {steps.map((step, index) => (
                        <motion.div 
                            key={index} 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                            className="card-premium p-4 text-center group hover:border-[#D4AF88]/40 transition-all"
                        >
                            {/* Icon */}
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#F8F5F0] to-white border border-[#E5E7EB] mb-2 group-hover:scale-105 transition-transform group-hover:border-[#D4AF88]/30">
                                <step.icon size={20} className="text-[#1E3A8A]" />
                            </div>
                            
                            {/* Content */}
                            <h3 className="text-sm font-bold text-[#1F2937] mb-1">
                                {index + 1}. {step.title}
                            </h3>
                            <p className="text-[#6B7280] text-xs leading-relaxed line-clamp-2">
                                {step.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
