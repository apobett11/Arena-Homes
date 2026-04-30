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
        <section className="py-8 md:py-10 bg-gradient-to-b from-white/95 to-blue-50/90">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-6"
                >
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        Student Stories
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
                        Loved by <span className="text-blue-600">Students</span>
                    </h2>
                </motion.div>

                {/* Testimonials Swipeable Carousel - Compact Cards */}
                <div className="carousel-container -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    {reviews.map((review, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                            viewport={{ once: true }}
                            className="carousel-item w-[200px] sm:w-[220px] flex-shrink-0"
                        >
                            <div className="card-dark p-2.5 radius-card h-full">
                                {/* Stars */}
                                <div className="flex gap-0.5 mb-1.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star 
                                            key={i} 
                                            size={10} 
                                            className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600"} 
                                        />
                                    ))}
                                </div>

                                {/* Quote */}
                                <p className="card-text text-xs leading-relaxed mb-2 line-clamp-3">
                                    "{review.text}"
                                </p>

                                {/* Author */}
                                <div className="flex items-center gap-2 pt-1.5 border-t border-slate-700/50">
                                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-[10px]">
                                        {review.avatar}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-xs text-slate-100">{review.name}</h4>
                                        <p className="text-[10px] text-slate-400">{review.role}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Stats Bar - Compact */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-5 flex flex-wrap justify-center gap-4 md:gap-6 px-4 py-2 rounded-xl bg-blue-600/10 border border-blue-400/20 shadow-sm max-w-md mx-auto"
                >
                    {[
                        { value: "4.9/5", label: "Rating" },
                        { value: loading ? "..." : `${tenantCount.toLocaleString()}+`, label: "Students" },
                        { value: "98%", label: "Recommend" }
                    ].map((stat, index) => (
                        <motion.div 
                            key={index} 
                            className="text-center px-2"
                            whileHover={{ scale: 1.05 }}
                        >
                            <span className="block text-base md:text-lg font-bold text-blue-700">{stat.value}</span>
                            <span className="text-[10px] text-slate-500">{stat.label}</span>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};
