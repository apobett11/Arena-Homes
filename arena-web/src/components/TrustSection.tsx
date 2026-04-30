"use client";

import { ShieldCheck, GraduationCap, Scale, Headphones } from "lucide-react";
import { motion } from "framer-motion";

export const TrustSection = () => {
    const features = [
        { 
            icon: ShieldCheck, 
            label: "Verified", 
            desc: "Every property is inspected and verified for safety and quality."
        },
        { 
            icon: GraduationCap, 
            label: "Student First", 
            desc: "Built for Egerton students with budget-friendly options."
        },
        { 
            icon: Scale, 
            label: "Transparent", 
            desc: "Clear pricing with no hidden fees. View rules upfront."
        },
        { 
            icon: Headphones, 
            label: "Fast Response", 
            desc: "Caretakers respond within 24 hours. Quick support."
        },
    ];

    return (
        <section className="py-8 md:py-10 bg-gradient-to-b from-blue-50/90 to-white/95">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-6"
                >
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        Why Choose Us
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
                        Why <span className="text-blue-600">Arena Homes</span>
                    </h2>
                </motion.div>

                {/* Swipeable Carousel - Reasonable Card Widths */}
                <div className="carousel-container -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                            viewport={{ once: true }}
                            className="carousel-item w-[140px] sm:w-[160px] flex-shrink-0"
                        >
                            <motion.div 
                                whileHover={{ scale: 1.02 }}
                                className="card-dark p-3 h-full radius-card"
                            >
                                <motion.div 
                                    whileHover={{ scale: 1.1, rotate: -5 }}
                                    className="mb-2 h-9 w-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30"
                                >
                                    <feature.icon size={18} />
                                </motion.div>
                                <h4 className="card-title text-xs mb-0.5">{feature.label}</h4>
                                <p className="card-text text-[10px] leading-tight line-clamp-3">{feature.desc}</p>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
