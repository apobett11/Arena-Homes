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
        <section className="py-8 md:py-10 bg-gradient-to-b from-white to-[#FAF9F6]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-6"
                >
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#1E3A8A]">
                        <span className="w-2 h-2 rounded-full bg-[#1E3A8A]" />
                        Why Choose Us
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-[#1F2937] mt-1">
                        Why <span className="text-gradient">Arena Homes</span>
                    </h2>
                </motion.div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                            viewport={{ once: true }}
                            className="card-premium p-4 group hover:border-[#D4AF88]/40 transition-all"
                        >
                            <div className="mb-2 h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#1E3A8A]/10 to-[#1E3A8A]/5 text-[#1E3A8A] group-hover:scale-105 transition-transform">
                                <feature.icon size={20} />
                            </div>
                            <h4 className="text-sm font-bold mb-1 text-[#1F2937]">{feature.label}</h4>
                            <p className="text-[#6B7280] text-xs leading-relaxed line-clamp-3">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
