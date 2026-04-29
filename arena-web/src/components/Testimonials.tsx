"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export const Testimonials = () => {
    const [tenantCount, setTenantCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTenantCount() {
            try {
                const supabase = getSupabaseClient();
                // Use RPC function that bypasses RLS for public stats
                const { data, error } = await supabase
                    .rpc('get_active_tenant_count');
                
                if (error) throw error;
                setTenantCount(data || 0);
            } catch (error) {
                console.error("Failed to fetch tenant count", error);
                // Fallback to 0 on error
                setTenantCount(0);
            } finally {
                setLoading(false);
            }
        }
        fetchTenantCount();
    }, []);
    const reviews = [
        {
            name: "James Mwangi",
            role: "Computer Science Student",
            text: "Found my perfect room near Main Gate in just 2 days! The caretaker was responsive and the place was exactly as shown in the photos. Very professional service.",
            avatar: "JM",
            rating: 5
        },
        {
            name: "Faith Akinyi",
            role: "Education Student",
            text: "As a first-year student, I was worried about finding affordable housing. Arena Homes made it so easy! I got a cozy bedsitter in Njokerio within my budget.",
            avatar: "FA",
            rating: 5
        },
        {
            name: "Peter Omondi",
            role: "Engineering Student",
            text: "The verification process gives me confidence. I've renewed my lease twice at Blue Valley because the platform made everything so smooth. Highly recommend!",
            avatar: "PO",
            rating: 5
        }
    ];

    return (
        <section className="py-20 md:py-28 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Student Stories
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white">
                        Loved by <span className="text-gradient">Students</span>
                    </h2>
                    <p className="mt-4 text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
                        Hear from students who found their perfect home through Arena Homes
                    </p>
                </motion.div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
                    {reviews.map((review, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.15, duration: 0.5 }}
                            viewport={{ once: true }}
                            className="card-luxury p-6 md:p-8 group"
                        >
                            {/* Stars */}
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        size={16} 
                                        className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700"} 
                                    />
                                ))}
                            </div>

                            {/* Quote */}
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-6">
                                "{review.text}"
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                <div className="h-12 w-12 rounded-full bg-gradient-premium flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20">
                                    {review.avatar}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{review.name}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{review.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Trust Stats */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-12 md:mt-16 flex flex-wrap justify-center gap-8 md:gap-16 px-8 py-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft max-w-2xl mx-auto"
                >
                    {[
                        { value: "4.9/5", label: "Average Rating" },
                        { value: loading ? "..." : `${tenantCount.toLocaleString()}+`, label: "Happy Students" },
                        { value: "98%", label: "Would Recommend" }
                    ].map((stat, index) => (
                        <div key={index} className="text-center">
                            <span className="block text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};
