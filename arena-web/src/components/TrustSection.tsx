"use client";

import { MapPin, Shield, Clock, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";

export const TrustSection = () => {
    const stats = [
        { 
            icon: Shield, 
            label: "Verified Listings", 
            desc: "Every property is personally verified by our team for safety and quality."
        },
        { 
            icon: Clock, 
            label: "24h Response", 
            desc: "Get quick replies from caretakers and secure your room within a day."
        },
        { 
            icon: BadgeCheck, 
            label: "Student Focused", 
            desc: "Built specifically for Egerton University students with budget-friendly options."
        },
        { 
            icon: MapPin, 
            label: "Prime Locations", 
            desc: "All listings are within walking distance to campus and essential amenities."
        },
    ];

    return (
        <section className="py-8 md:py-10 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
            <div className="container mx-auto px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-6 md:mb-8"
                >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1 block">Why Choose Us</span>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                        Trusted by Students
                    </h2>
                </motion.div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="card-premium p-3 md:p-4 text-center"
                        >
                            <div className="mb-2 h-10 w-10 md:h-11 md:w-11 mx-auto flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <stat.icon size={20} />
                            </div>
                            <h4 className="text-sm font-bold mb-1 text-slate-900 dark:text-white">{stat.label}</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">{stat.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
