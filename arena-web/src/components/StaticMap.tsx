"use client";

import { MapPin } from "lucide-react";
import { motion } from "framer-motion";

export const StaticMap = () => {
    return (
        <section className="py-16 bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row gap-12 items-center">
                    <div className="w-full md:w-1/3">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary dark:text-primary mb-4">Location View</h2>
                        <h3 className="text-4xl md:text-5xl font-bold mb-8 text-slate-900 dark:text-white leading-tight tracking-tight">Find Spaces Near <span className="text-primary dark:text-primary">You</span></h3>
                        <p className="text-slate-600 dark:text-muted-foreground mb-10 text-lg font-medium leading-relaxed">
                            Explore our interactive map to see available rooms and apartments in your preferred neighborhood.
                            Real-time pins show exactly where the action is.
                        </p>
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-5 w-5 rounded-full bg-primary/20 dark:bg-primary/20 flex items-center justify-center">
                                    <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-sm"></div>
                                </div>
                                <span className="text-base font-bold text-slate-700 dark:text-white">Available Rooms</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-5 w-5 rounded-full bg-secondary/20 dark:bg-secondary/20 flex items-center justify-center">
                                    <div className="h-2.5 w-2.5 rounded-full bg-secondary shadow-sm"></div>
                                </div>
                                <span className="text-base font-bold text-slate-700 dark:text-white">Coming Soon</span>
                            </div>
                        </div>
                        <button className="mt-12 px-10 py-5 bg-primary text-white rounded-[32px] font-bold hover:bg-primary/90 transition-all shadow-xl border border-white/5 uppercase tracking-widest text-sm">
                            Open Full Map
                        </button>
                    </div>

                    <div className="w-full md:w-2/3 relative">
                        <div className="aspect-video rounded-[48px] overflow-hidden border-[8px] border-white dark:border-zinc-800 shadow-2xl relative">

                            {/* Fake Map Background */}
                            <div className="absolute inset-0 bg-blue-50 dark:bg-zinc-800 flex items-center justify-center">
                                <div className="absolute inset-0 opacity-20 dark:opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mt-[-50px]"></div>

                                {/* Pins */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute top-1/4 left-1/4"
                                >
                                    <div className="bg-primary text-white p-2 rounded-xl shadow-lg relative">
                                        <MapPin size={24} fill="currentColor" />
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rotate-45 -z-10"></div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                    className="absolute bottom-1/3 right-1/4"
                                >
                                    <div className="bg-secondary text-white p-2 rounded-xl shadow-lg relative">
                                        <MapPin size={24} fill="currentColor" />
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-secondary rotate-45 -z-10"></div>
                                    </div>
                                </motion.div>

                                <div className="text-zinc-400 font-medium text-lg uppercase tracking-widest opacity-30">Map Interface Placeholder</div>
                            </div>
                        </div>

                        {/* Overlay Info Card */}
                        <div className="absolute bottom-10 left-10 p-6 rounded-[32px] bg-white dark:bg-zinc-950 border border-slate-100 dark:border-white/20 shadow-xl hidden md:block max-w-xs transition-all hover:scale-102">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10">
                                    <MapPin className="text-primary dark:text-primary" />
                                </div>
                                <div>
                                    <h5 className="text-lg font-bold text-slate-900 dark:text-white">12 Nearby Places</h5>
                                    <p className="text-[10px] text-slate-500 dark:text-muted-foreground uppercase font-bold tracking-widest">Updated 2 mins ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
