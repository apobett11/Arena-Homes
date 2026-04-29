"use client";

import { ShieldCheck, GraduationCap, Scale, Headphones } from "lucide-react";
import { motion } from "framer-motion";

export const TrustSection = () => {
    const features = [
        { 
            icon: ShieldCheck, 
            label: "Verified Before Listing", 
            desc: "Every property is personally inspected and verified by our team for safety, quality, and accuracy before going live."
        },
        { 
            icon: GraduationCap, 
            label: "Built for Students", 
            desc: "Designed specifically for Egerton University students with budget-friendly options, flexible leases, and campus proximity."
        },
        { 
            icon: Scale, 
            label: "Transparent Rent & Rules", 
            desc: "Clear pricing with no hidden fees. View house rules, deposit requirements, and amenities upfront before applying."
        },
        { 
            icon: Headphones, 
            label: "Fast Caretaker Response", 
            desc: "Direct contact with verified caretakers who respond within 24 hours. Get answers, schedule viewings, and secure your room fast."
        },
    ];

    return (
        <section className="py-20 md:py-28 bg-gradient-to-b from-slate-50 to-[#F8FAFC] dark:from-slate-950 dark:to-slate-900 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Why Choose Us
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white">
                        Why <span className="text-gradient">Arena Homes</span>
                    </h2>
                    <p className="mt-4 text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
                        The trusted platform for Egerton University student housing
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            viewport={{ once: true }}
                            className="card-luxury p-6 md:p-8 group hover:border-primary/20 transition-all"
                        >
                            <div className="mb-5 h-14 w-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary group-hover:scale-110 transition-transform duration-300">
                                <feature.icon size={26} />
                            </div>
                            <h4 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">{feature.label}</h4>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
