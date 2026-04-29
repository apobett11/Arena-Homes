"use client";

import { MapPin, Navigation, School, Shield, Clock } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export const StaticMap = () => {
    const locations = [
        { name: "Njoro Town", distance: "5 min walk", available: 12 },
        { name: "Main Gate", distance: "2 min walk", available: 8 },
        { name: "Njokerio", distance: "8 min walk", available: 15 },
        { name: "Milimani", distance: "10 min walk", available: 6 },
        { name: "Blue Valley", distance: "12 min walk", available: 9 },
    ];

    const benefits = [
        { icon: Navigation, text: "Walking distance to campus" },
        { icon: School, text: "Near lecture halls & library" },
        { icon: Shield, text: "Safe, student-friendly areas" },
        { icon: Clock, text: "Quick caretaker support" },
    ];

    return (
        <section className="py-20 md:py-28 bg-gradient-to-b from-slate-50 to-[#F8FAFC] dark:from-slate-950 dark:to-slate-900 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
                    {/* Content Side */}
                    <div className="w-full lg:w-2/5">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                                <span className="w-2 h-2 rounded-full bg-primary" />
                                Prime Location
                            </span>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
                                Student Housing Near{" "}
                                <span className="text-gradient">Egerton University</span>
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed mb-8">
                                All our properties are strategically located within walking distance 
                                to campus, with easy access to lecture halls, the library, dining, 
                                and essential student amenities.
                            </p>
                            
                            {/* Benefits */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {benefits.map((benefit, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <benefit.icon size={18} className="text-primary" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{benefit.text}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Location List */}
                            <div className="space-y-3">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Popular Areas</p>
                                {locations.slice(0, 4).map((loc, index) => (
                                    <div key={index} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700/50 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <MapPin size={16} className="text-primary" />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{loc.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-slate-500">{loc.distance}</span>
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                                                {loc.available} available
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Map Visual Side */}
                    <div className="w-full lg:w-3/5 relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-luxury border border-slate-200 dark:border-slate-700">
                                {/* Map Background Image */}
                                <Image
                                    src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=1200&q=80"
                                    alt="Egerton University and Njoro area map view"
                                    fill
                                    className="object-cover"
                                />
                                
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-slate-900/40" />
                                
                                {/* Animated Map Pins */}
                                {[
                                    { top: "25%", left: "30%", delay: 0 },
                                    { top: "40%", left: "55%", delay: 0.5 },
                                    { top: "60%", left: "40%", delay: 1 },
                                    { top: "35%", left: "70%", delay: 1.5 },
                                    { top: "70%", left: "60%", delay: 2 },
                                ].map((pin, index) => (
                                    <motion.div
                                        key={index}
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: pin.delay }}
                                        className="absolute"
                                        style={{ top: pin.top, left: pin.left }}
                                    >
                                        <div className="bg-white dark:bg-slate-900 text-primary p-2 rounded-xl shadow-lg relative">
                                            <MapPin size={20} fill="currentColor" />
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 rotate-45 -z-10" />
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Info Card Overlay */}
                                <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl glass-elevated">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-gradient-premium flex items-center justify-center text-white">
                                            <School size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">Egerton University</h4>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">50+ verified properties nearby</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white">5min</p>
                                            <p className="text-xs text-slate-500">avg. walk</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};
