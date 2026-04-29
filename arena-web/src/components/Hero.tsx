"use client";

import { Search, MapPin, Home, DollarSign, ShieldCheck, BadgeCheck, Clock, Users, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getSupabaseClient } from "@/lib/supabase/client";

interface HeroStats {
    propertyCount: number;
    tenantCount: number;
    availableRooms: number;
    verifiedProperties: number;
}

export const Hero = () => {
    const router = useRouter();
    const [location, setLocation] = useState("");
    const [type, setType] = useState("");
    const [priceRange, setPriceRange] = useState("");
    const [stats, setStats] = useState<HeroStats>({
        propertyCount: 0,
        tenantCount: 0,
        availableRooms: 0,
        verifiedProperties: 0,
    });
    const [statsLoading, setStatsLoading] = useState(true);
    const selectBaseClass =
        "border-none p-0 focus:ring-0 text-xs md:text-base font-medium w-full outline-none appearance-none cursor-pointer text-slate-900 dark:text-white truncate bg-white dark:bg-slate-800 rounded-md";
    const optionClass = "bg-white dark:bg-slate-800 text-slate-900 dark:text-white";

    useEffect(() => {
        async function loadStats() {
            const supabase = getSupabaseClient();
            try {
                // Get property count
                const { count: propertyCount } = await supabase
                    .from('properties')
                    .select('*', { count: 'exact', head: true });

                // Get tenant count
                const { count: tenantCount } = await supabase
                    .from('tenants')
                    .select('*', { count: 'exact', head: true });

                // Get available rooms count
                const { count: availableRooms } = await supabase
                    .from('units')
                    .select('*', { count: 'exact', head: true })
                    .or('status.eq.VACANT,availability_status.eq.AVAILABLE');

                // Get verified properties count
                const { count: verifiedProperties } = await supabase
                    .from('properties')
                    .select('*', { count: 'exact', head: true })
                    .eq('verification_status', 'VERIFIED');

                setStats({
                    propertyCount: propertyCount || 0,
                    tenantCount: tenantCount || 0,
                    availableRooms: availableRooms || 0,
                    verifiedProperties: verifiedProperties || 0,
                });
            } catch (e) {
                console.error('Failed to load hero stats:', e);
            } finally {
                setStatsLoading(false);
            }
        }
        loadStats();
    }, []);

    const formatNumber = (num: number): string => {
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}k`;
        }
        return num.toString();
    };

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (location) params.set("location", location);
        if (type && type !== "All Types") params.set("type", type);
        if (priceRange === "Low") params.set("sort", "asc");
        if (priceRange === "High") params.set("sort", "desc");
        router.push(`/listings?${params.toString()}`);
    };

    const heroImage = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80";

    const displayStats = statsLoading
        ? [
            { value: "...", label: "Properties Listed" },
            { value: "...", label: "Happy Students" },
            { value: "...", label: "Available Rooms" },
            { value: "...", label: "Verified" },
        ]
        : [
            { value: formatNumber(stats.propertyCount), label: "Properties Listed" },
            { value: formatNumber(stats.tenantCount), label: "Happy Students" },
            { value: formatNumber(stats.availableRooms), label: "Available Rooms" },
            { value: formatNumber(stats.verifiedProperties), label: "Verified" },
        ];

    return (
        <section className="relative min-h-[90vh] md:min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-[#08111F] via-[#0F1D2E] to-[#1E3A5F]">
            {/* Premium Background Layers */}
            <div className="absolute inset-0 z-0">
                {/* Abstract gradient orbs */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-blue-500/10 via-blue-600/5 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-amber-500/5 via-amber-600/3 to-transparent rounded-full blur-3xl" />
                
                {/* Hero Image with premium overlay */}
                <div className="absolute inset-0 opacity-40">
                    <Image
                        src={heroImage}
                        alt="Modern student housing near Egerton University"
                        fill
                        className="object-cover"
                        priority
                        quality={90}
                    />
                </div>
                
                {/* Multi-layer gradient overlay for luxury feel */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#08111F]/90 via-[#0F1D2E]/70 to-[#08111F]/95" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#08111F]/50 via-transparent to-[#08111F]/50" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24 md:pt-32">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mx-auto max-w-5xl"
                >
                    {/* Premium Trust Badge */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 text-sm font-medium text-white/90"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                        </span>
                        <span>Now serving Egerton University & surrounding areas</span>
                        <Sparkles size={14} className="text-amber-400" />
                    </motion.div>

                    {/* Premium Main Heading */}
                    <h1 className="mb-6 text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                        Find a verified{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400">
                            student home
                        </span>
                        <br className="hidden sm:block" />
                        near Egerton University
                    </h1>

                    <p className="mb-10 text-lg md:text-xl text-white/70 font-normal max-w-2xl mx-auto leading-relaxed">
                        Browse trusted rooms, bedsitters, and apartments built around student budgets, 
                        safety, and campus convenience.
                    </p>

                    {/* Premium Search Bar */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="mx-auto max-w-4xl"
                    >
                        <div className="glass-elevated rounded-3xl p-3 shadow-2xl shadow-black/20">
                            <div className="flex flex-col lg:flex-row gap-3">
                                {/* Location Input */}
                                <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50">
                                    <MapPin className="text-primary shrink-0" size={20} />
                                    <div className="flex flex-col items-start w-full min-w-0">
                                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Location</label>
                                        <input
                                            type="text"
                                            placeholder="Where to?"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="bg-transparent border-none p-0 focus:ring-0 text-sm md:text-base font-semibold w-full outline-none placeholder:text-slate-400 text-slate-900 dark:text-white truncate"
                                            aria-label="Search by location"
                                        />
                                    </div>
                                </div>

                                {/* Property Type */}
                                <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50">
                                    <Home className="text-primary shrink-0" size={20} />
                                    <div className="flex flex-col items-start w-full min-w-0">
                                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Type</label>
                                        <select
                                            value={type}
                                            onChange={(e) => setType(e.target.value)}
                                            className={`${selectBaseClass} font-semibold`}
                                            aria-label="Select property type"
                                        >
                                            <option value="" className={optionClass}>All Types</option>
                                            <option value="Single Room" className={optionClass}>Single Room</option>
                                            <option value="Bedsitter" className={optionClass}>Bedsitter</option>
                                            <option value="Apartment" className={optionClass}>1-Bed Apartment</option>
                                            <option value="Shared" className={optionClass}>Shared</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50">
                                    <DollarSign className="text-primary shrink-0" size={20} />
                                    <div className="flex flex-col items-start w-full min-w-0">
                                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Budget</label>
                                        <select
                                            value={priceRange}
                                            onChange={(e) => setPriceRange(e.target.value)}
                                            className={`${selectBaseClass} font-semibold`}
                                            aria-label="Select price range"
                                        >
                                            <option value="" className={optionClass}>Any Price</option>
                                            <option value="Low" className={optionClass}>Low to High</option>
                                            <option value="High" className={optionClass}>High to Low</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Search Button */}
                                <button
                                    onClick={handleSearch}
                                    className="flex h-14 lg:h-auto lg:w-14 items-center justify-center gap-2 rounded-2xl bg-gradient-premium text-white font-semibold transition-all hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] shrink-0"
                                    aria-label="Search properties"
                                >
                                    <Search size={22} />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Trust Chips */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="mt-8 flex flex-wrap justify-center gap-3"
                    >
                        {[
                            { icon: ShieldCheck, text: "Verified listings" },
                            { icon: BadgeCheck, text: "Near campus" },
                            { icon: Users, text: "Student budget friendly" },
                            { icon: Clock, text: "Direct caretaker contact" },
                        ].map((chip, index) => (
                            <div 
                                key={index}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm"
                            >
                                <chip.icon size={14} className="text-amber-400" />
                                <span>{chip.text}</span>
                            </div>
                        ))}
                    </motion.div>

                    {/* Premium Stats Bar */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
                    >
                        {displayStats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <span className="block text-2xl md:text-3xl font-bold text-white tracking-tight">{stat.value}</span>
                                <span className="text-xs md:text-sm font-medium text-white/60">{stat.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};
