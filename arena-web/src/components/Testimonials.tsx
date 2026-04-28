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
                const { count, error } = await supabase
                    .from('tenants')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'active');
                
                if (error) throw error;
                setTenantCount(count || 0);
            } catch (error) {
                console.error("Failed to fetch tenant count", error);
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
        <section className="py-8 md:py-12 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <div className="container mx-auto px-4 md:px-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-6 md:mb-8"
                >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1 block">Student Stories</span>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                        Loved by <span className="text-gradient">Students</span>
                    </h2>
                </motion.div>

                {/* Mobile: Horizontal scroll; Desktop: Grid */}
                <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-5 max-w-6xl mx-auto overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-4 px-4 md:mx-auto md:px-0">
                    {reviews.map((review, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            viewport={{ once: true }}
                            className="card-premium p-4 md:p-5 min-w-[280px] md:min-w-0"
                        >
                            {/* Stars */}
                            <div className="flex gap-0.5 mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        size={12} 
                                        className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700"} 
                                    />
                                ))}
                            </div>

                            {/* Quote */}
                            <p className="text-slate-700 dark:text-slate-300 text-xs md:text-sm leading-relaxed mb-3 line-clamp-3">
                                "{review.text}"
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                                <div className="h-8 w-8 rounded-full bg-gradient-premium flex items-center justify-center text-white font-bold text-xs">
                                    {review.avatar}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{review.name}</h4>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{review.role}</p>
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
                    className="mt-6 md:mt-8 flex flex-wrap justify-center gap-6 md:gap-12"
                >
                    {[
                        { value: "4.9/5", label: "Rating" },
                        { value: loading ? "..." : `${tenantCount.toLocaleString()}+`, label: "Happy Students" },
                        { value: "98%", label: "Recommend" }
                    ].map((stat, index) => (
                        <div key={index} className="text-center">
                            <span className="block text-lg md:text-xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};
