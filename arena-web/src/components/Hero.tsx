"use client";

import { Search, MapPin, Home, DollarSign, ArrowRight } from "lucide-react";
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
        <section className="relative min-h-[85vh] md:min-h-screen flex items-center justify-center overflow-hidden">
            {/* Full-bleed Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={heroImage}
                    alt="Modern student housing"
                    fill
                    className="object-cover"
                    priority
                    quality={90}
                />
                {/* Gradient Overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/80" />
            </div>

            <div className="container mx-auto px-4 md:px-6 text-center relative z-10 pt-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mx-auto max-w-5xl"
                >
                    {/* Badge */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm font-medium text-white"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                        </span>
                        Now serving Egerton University & surrounding areas
                    </motion.div>

                    {/* Main Heading */}
                    <h1 className="mb-6 text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                        Discover Your <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                            Perfect Student Home
                        </span>
                    </h1>

                    <p className="mb-10 text-lg md:text-xl text-white/80 font-normal max-w-2xl mx-auto leading-relaxed">
                        Premium student housing near Egerton University. Verified listings, 
                        affordable prices, and a seamless rental experience built for students.
                    </p>

                    {/* Modern Search Bar */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="mx-auto max-w-3xl"
                    >
                        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl md:rounded-3xl p-2 shadow-2xl shadow-black/20">
                            {/* Mobile: Lateral layout for inputs, full width search */}
                            <div className="flex flex-col gap-2 p-2">
                                {/* Row 1: Location, Type, Price dropdowns on mobile */}
                                <div className="grid grid-cols-3 gap-2">
                                    {/* Location Input */}
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 md:bg-transparent md:border-r md:border-y-0 md:border-l-0 md:rounded-none md:px-4 md:py-3">
                                        <MapPin className="text-primary shrink-0" size={18} />
                                        <div className="flex flex-col items-start w-full min-w-0">
                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide hidden md:block">Location</label>
                                            <input
                                                type="text"
                                                placeholder="Location..."
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                className="bg-transparent border-none p-0 focus:ring-0 text-xs md:text-base font-medium w-full outline-none placeholder:text-slate-400 text-slate-900 dark:text-white truncate"
                                            />
                                        </div>
                                    </div>

                                    {/* Property Type */}
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 md:bg-transparent md:border-r md:border-y-0 md:border-l-0 md:rounded-none md:px-4 md:py-3">
                                        <Home className="text-primary shrink-0" size={18} />
                                        <div className="flex flex-col items-start w-full min-w-0">
                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide hidden md:block">Type</label>
                                            <select
                                                value={type}
                                                onChange={(e) => setType(e.target.value)}
                                                className={selectBaseClass}
                                            >
                                                <option value="" className={optionClass}>All Types</option>
                                                <option value="Single Room" className={optionClass}>Single</option>
                                                <option value="Bedsitter" className={optionClass}>Bedsitter</option>
                                                <option value="Apartment" className={optionClass}>1-Bed Apt</option>
                                                <option value="Shared" className={optionClass}>Shared</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Price Range */}
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 md:bg-transparent md:border-r md:border-y-0 md:border-l-0 md:rounded-none md:px-4 md:py-3">
                                        <DollarSign className="text-primary shrink-0" size={18} />
                                        <div className="flex flex-col items-start w-full min-w-0">
                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide hidden md:block">Price</label>
                                            <select
                                                value={priceRange}
                                                onChange={(e) => setPriceRange(e.target.value)}
                                                className={selectBaseClass}
                                            >
                                                <option value="" className={optionClass}>Any</option>
                                                <option value="Low" className={optionClass}>Low-High</option>
                                                <option value="High" className={optionClass}>High-Low</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Search Button - Full width, large */}
                                <button
                                    onClick={handleSearch}
                                    className="flex h-12 md:h-14 w-full items-center justify-center gap-2 rounded-xl md:rounded-2xl bg-gradient-premium text-white font-semibold text-base transition-all hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Search size={20} />
                                    <span>Search</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="mt-12 flex flex-wrap justify-center gap-8 md:gap-16"
                    >
                        {displayStats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <span className="block text-2xl md:text-3xl font-bold text-white tracking-tight">{stat.value}</span>
                                <span className="text-xs md:text-sm font-medium text-white/70">{stat.label}</span>
                            </div>
                        ))}
                    </motion.div>

                    {/* Scroll Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
                    >
                        <div className="flex flex-col items-center gap-2 text-white/60">
                            <span className="text-xs font-medium tracking-wide">Scroll to explore</span>
                            <motion.div
                                animate={{ y: [0, 8, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
                            >
                                <div className="w-1 h-2 bg-white/60 rounded-full" />
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};
