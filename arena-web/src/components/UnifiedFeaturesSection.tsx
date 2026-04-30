"use client";

import { motion } from "framer-motion";
import { HowItWorks } from "./HowItWorks";
import { TrustSection } from "./TrustSection";
import { Testimonials } from "./Testimonials";

export const UnifiedFeaturesSection = () => {
    return (
        <section className="py-2 md:py-3 bg-slate-950">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Glassmorphic Card with White Tint */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 md:p-4"
                >
                    {/* Section 1: How It Works */}
                    <div className="mb-3 pb-3 border-b border-white/10">
                        <div className="text-center mb-2">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                Simple Process
                            </span>
                            <h2 className="text-base md:text-lg font-bold text-white mt-0.5">
                                How It <span className="text-blue-300">Works</span>
                            </h2>
                        </div>
                        <HowItWorksCompact />
                    </div>

                    {/* Section 2: Why Choose Us */}
                    <div className="mb-3 pb-3 border-b border-white/10">
                        <div className="text-center mb-2">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                Why Choose Us
                            </span>
                            <h2 className="text-base md:text-lg font-bold text-white mt-0.5">
                                Why <span className="text-blue-300">Arena Homes</span>
                            </h2>
                        </div>
                        <TrustSectionCompact />
                    </div>

                    {/* Section 3: Testimonials + Stats */}
                    <div>
                        <div className="text-center mb-2">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                Student Stories
                            </span>
                            <h2 className="text-base md:text-lg font-bold text-white mt-0.5">
                                Loved by <span className="text-blue-300">Students</span>
                            </h2>
                        </div>
                        <TestimonialsCompact />
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

// Compact HowItWorks for unified section
import { Search, ArrowRightLeft, FileText, KeyRound } from "lucide-react";

const HowItWorksCompact = () => {
    const steps = [
        { icon: Search, title: "Search", desc: "Browse verified listings with smart filters." },
        { icon: ArrowRightLeft, title: "Compare", desc: "Review photos, pricing, and details." },
        { icon: FileText, title: "Apply", desc: "Submit with one click. 24hr response." },
        { icon: KeyRound, title: "Move In", desc: "Schedule viewing and get your keys." },
    ];

    return (
        <div className="flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {steps.map((step, index) => (
                <motion.div 
                    key={index} 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex-shrink-0 w-[120px] sm:w-[140px] bg-slate-800/50 rounded-xl p-2.5 text-center border border-slate-700/50"
                >
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 mb-1.5 shadow-md">
                        <step.icon size={16} className="text-white" />
                    </div>
                    <h3 className="text-white text-xs font-semibold mb-0.5">{index + 1}. {step.title}</h3>
                    <p className="text-slate-400 text-[10px] leading-tight line-clamp-2">{step.desc}</p>
                </motion.div>
            ))}
        </div>
    );
};

// Compact TrustSection for unified section
import { ShieldCheck, GraduationCap, Scale, Headphones } from "lucide-react";

const TrustSectionCompact = () => {
    const features = [
        { icon: ShieldCheck, label: "Verified", desc: "Inspected for safety" },
        { icon: GraduationCap, label: "Student First", desc: "Budget-friendly options" },
        { icon: Scale, label: "Transparent", desc: "No hidden fees" },
        { icon: Headphones, label: "Fast Response", desc: "24hr support" },
    ];

    return (
        <div className="flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {features.map((feature, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex-shrink-0 w-[120px] sm:w-[140px] bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50"
                >
                    <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md mb-1.5">
                        <feature.icon size={14} />
                    </div>
                    <h4 className="text-white text-xs font-semibold mb-0.5">{feature.label}</h4>
                    <p className="text-slate-400 text-[10px] leading-tight">{feature.desc}</p>
                </motion.div>
            ))}
        </div>
    );
};

// Compact Testimonials for unified section
import { Star } from "lucide-react";

const TestimonialsCompact = () => {
    const reviews = [
        { name: "Sarah K.", role: "Nursing Student", text: "Found my perfect room in 2 days!", avatar: "SK", rating: 5 },
        { name: "James M.", role: "Engineering", text: "Best platform for student housing.", avatar: "JM", rating: 5 },
        { name: "Grace N.", role: "Education", text: "Transparent pricing, no surprises.", avatar: "GN", rating: 5 },
    ];

    return (
        <div>
            <div className="flex justify-center gap-2 overflow-x-auto pb-3 scrollbar-hide mb-3">
                {reviews.map((review, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="flex-shrink-0 w-[160px] sm:w-[180px] bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50"
                    >
                        <div className="flex gap-0.5 mb-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={8} className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600"} />
                            ))}
                        </div>
                        <p className="text-slate-300 text-[10px] leading-tight mb-1.5 line-clamp-2">"{review.text}"</p>
                        <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-700/50">
                            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-[8px]">
                                {review.avatar}
                            </div>
                            <div>
                                <h4 className="font-medium text-[10px] text-white">{review.name}</h4>
                                <p className="text-[8px] text-slate-400">{review.role}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-3">
                {[
                    { value: "4.9/5", label: "Rating" },
                    { value: "500+", label: "Students" },
                    { value: "98%", label: "Recommend" }
                ].map((stat, index) => (
                    <div key={index} className="text-center px-2">
                        <span className="block text-sm font-bold text-blue-400">{stat.value}</span>
                        <span className="text-[10px] text-slate-500">{stat.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
