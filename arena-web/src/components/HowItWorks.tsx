"use client";

import { Search, ArrowRightLeft, FileText, KeyRound } from "lucide-react";
import { motion } from "framer-motion";

export const HowItWorks = () => {
    const steps = [
        { 
            icon: Search,
            title: "Search", 
            desc: "Browse verified listings near Egerton University with smart filters." 
        },
        { 
            icon: ArrowRightLeft,
            title: "Compare", 
            desc: "Review photos, pricing, amenities, and caretaker details." 
        },
        { 
            icon: FileText,
            title: "Apply", 
            desc: "Submit your application with one click. Response within 24 hours." 
        },
        { 
            icon: KeyRound,
            title: "Move In", 
            desc: "Schedule a viewing, sign digitally, and get your keys." 
        }
    ];

    return (
        <section id="how-it-works" className="py-8 md:py-10 bg-gradient-to-b from-white/95 to-blue-50/90">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-6"
                >
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        Simple Process
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
                        How It <span className="text-blue-600">Works</span>
                    </h2>
                </motion.div>

                {/* Swipeable Carousel - Reasonable Card Widths */}
                <div className="carousel-container -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    {steps.map((step, index) => (
                        <motion.div 
                            key={index} 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                            className="carousel-item w-[140px] sm:w-[160px] flex-shrink-0"
                        >
                            <div className="card-dark p-3 text-center h-full radius-card">
                                {/* Icon */}
                                <motion.div 
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 mb-2 shadow-lg shadow-blue-500/30"
                                >
                                    <step.icon size={20} className="text-white" />
                                </motion.div>
                                
                                {/* Content */}
                                <h3 className="card-title text-xs mb-0.5">
                                    {index + 1}. {step.title}
                                </h3>
                                <p className="card-text text-[10px] leading-tight line-clamp-3">
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
