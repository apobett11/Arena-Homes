"use client";

import { motion } from "framer-motion";
import { HowItWorks } from "./HowItWorks";
import { TrustSection } from "./TrustSection";
import { Testimonials } from "./Testimonials";

export const UnifiedFeaturesSection = () => {
    return (
        <section className="py-12 md:py-16 bg-slate-950">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Glassmorphic Card with White Tint */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/20"
                >
                    {/* Section 1: How It Works */}
                    <div className="mb-8 pb-8 border-b border-white/10">
                        <div className="text-center mb-6">
                            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-300">
                                <span className="w-2 h-2 rounded-full bg-blue-400" />
                                Simple Process
                            </span>
                            <h2 className="text-xl md:text-2xl font-bold text-white mt-2">
                                How It <span className="text-blue-300">Works</span>
                            </h2>
                        </div>
                        <HowItWorksCompact />
                    </div>

                    {/* Section 2: Why Choose Us */}
                    <div className="mb-8 pb-8 border-b border-white/10">
                        <div className="text-center mb-6">
                            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-300">
                                <span className="w-2 h-2 rounded-full bg-blue-400" />
                                Why Choose Us
                            </span>
                            <h2 className="text-xl md:text-2xl font-bold text-white mt-2">
                                Why <span className="text-blue-300">Arena Homes</span>
                            </h2>
                        </div>
                        <TrustSectionCompact />
                    </div>

                    {/* Section 3: Testimonials + Stats */}
                    <div>
                        <div className="text-center mb-6">
                            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-300">
                                <span className="w-2 h-2 rounded-full bg-blue-400" />
                                Student Stories
                            </span>
                            <h2 className="text-xl md:text-2xl font-bold text-white mt-2">
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
        <div className="flex justify-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {steps.map((step, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex-shrink-0 w-[140px] sm:w-[160px] bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50 hover:bg-slate-800/70 transition-colors"
                >
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 mb-3 shadow-md">
                        <step.icon size={20} className="text-white" />
                    </div>
                    <h3 className="text-white text-sm font-semibold mb-1">{index + 1}. {step.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{step.desc}</p>
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
        <div className="flex justify-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {features.map((feature, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex-shrink-0 w-[140px] sm:w-[160px] bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:bg-slate-800/70 transition-colors"
                >
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md mb-3">
                        <feature.icon size={20} />
                    </div>
                    <h4 className="text-white text-sm font-semibold mb-1">{feature.label}</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">{feature.desc}</p>
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
            <div className="flex justify-center gap-4 overflow-x-auto pb-4 scrollbar-hide mb-6">
                {reviews.map((review, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="flex-shrink-0 w-[180px] sm:w-[200px] bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:bg-slate-800/70 transition-colors"
                    >
                        <div className="flex gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={12} className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600"} />
                            ))}
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed mb-3 line-clamp-2">"{review.text}"</p>
                        <div className="flex items-center gap-2 pt-3 border-t border-slate-700/50">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs">
                                {review.avatar}
                            </div>
                            <div>
                                <h4 className="font-medium text-sm text-white">{review.name}</h4>
                                <p className="text-xs text-slate-400">{review.role}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-6">
                {[
                    { value: "4.9/5", label: "Rating" },
                    { value: "500+", label: "Students" },
                    { value: "98%", label: "Recommend" }
                ].map((stat, index) => (
                    <div key={index} className="text-center px-4">
                        <span className="block text-lg font-bold text-blue-400">{stat.value}</span>
                        <span className="text-xs text-slate-500">{stat.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
