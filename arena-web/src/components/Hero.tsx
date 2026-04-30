"use client";

import { Search, MapPin, Home, DollarSign, ShieldCheck, BadgeCheck, Clock, Users, Sparkles, ChevronDown } from "lucide-react";
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
    const [locations, setLocations] = useState<string[]>([]);
    const selectBaseClass =
        "border-none p-0 focus:ring-0 text-xs md:text-base font-medium w-full outline-none appearance-none cursor-pointer text-[#1F2937] truncate bg-[#F8F5F0] rounded-md";
    const optionClass = "bg-[#F8F5F0] text-[#1F2937]";

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

                // Get unique locations from properties
                const { data: locationData } = await supabase
                    .from('properties')
                    .select('location')
                    .not('location', 'is', null);

                const uniqueLocations = [...new Set(locationData?.map((p: { location: string }) => p.location).filter(Boolean))].sort();
                setLocations(uniqueLocations);

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
        <section className="relative min-h-[90vh] md:min-h-screen flex items-center overflow-hidden bg-[#F8F5F0]">
            {/* Hero Background - 100% Opacity Visual Photo */}
            <div className="absolute inset-0 z-0">
                {/* Full Opacity Background Image */}
                <Image
                    src={heroImage}
                    alt="Modern student housing near Egerton University"
                    fill
                    className="object-cover"
                    priority
                    quality={100}
                />
                
                {/* Subtle Dark Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/40" />
                <div className="absolute inset-0 bg-blue-900/20" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24 md:pt-32">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mx-auto max-w-5xl"
                >
                    {/* Premium Trust Badge - White on Dark */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 text-sm font-medium text-white shadow-lg"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400"></span>
                        </span>
                        <span>Now serving Egerton University & surrounding areas</span>
                        <Sparkles size={14} className="text-blue-300" />
                    </motion.div>

                    {/* Main Heading - White Text for Dark Background */}
                    <h1 className="mb-6 text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-[1.1] drop-shadow-lg">
                        Find a verified{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-blue-200 to-white">
                            student home
                        </span>
                        <br className="hidden sm:block" />
                        near <span className="text-blue-300">Egerton University</span>
                    </h1>

                    <p className="mb-10 text-lg md:text-xl text-white/90 font-normal max-w-2xl mx-auto leading-relaxed drop-shadow-md">
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
                        <div className="glass-elevated rounded-3xl p-3 shadow-2xl shadow-[#0F172A]/8 border border-[#C9B37F]/25">
                            <div className="flex flex-col gap-3 p-3 bg-white/95 backdrop-blur-sm rounded-2xl border border-blue-200/50 shadow-xl shadow-blue-900/10">
                                <div className="grid grid-cols-3 gap-2">
                                    {/* Location Dropdown */}
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                                            <MapPin size={16} />
                                        </div>
                                        <select 
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="w-full h-11 pl-9 pr-7 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium text-xs focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">All Locations</option>
                                            {locations.map(loc => (
                                                <option key={loc} value={loc}>{loc}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>

                                    {/* Price Range Dropdown */}
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                                            <DollarSign size={16} />
                                        </div>
                                        <select className="w-full h-11 pl-9 pr-7 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium text-xs focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer">
                                            <option>Any Price</option>
                                            <option>Under KSh 5k</option>
                                            <option>KSh 5k - 8k</option>
                                            <option>KSh 8k - 12k</option>
                                            <option>Above KSh 12k</option>
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>

                                    {/* Property Type */}
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                                            <Home size={16} />
                                        </div>
                                        <select className="w-full h-11 pl-9 pr-7 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium text-xs focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer">
                                            <option>All Types</option>
                                            <option>Single Room</option>
                                            <option>Bedsitter</option>
                                            <option>1 Bedroom</option>
                                            <option>2 Bedroom</option>
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>

                                {/* Full Width Search Button */}
                                <motion.button 
                                    onClick={handleSearch}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-semibold text-sm transition-all hover:bg-blue-500 shadow-lg shadow-blue-500/25"
                                    aria-label="Search properties"
                                >
                                    <Search size={18} />
                                    Search Properties
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Trust Chips - Dark Background Theme */}
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
                            <motion.div
                                key={index}
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white text-sm shadow-lg hover:bg-black/40 transition-all duration-300"
                            >
                                <chip.icon size={14} className="text-blue-300" />
                                <span className="font-medium">{chip.text}</span>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Stats - Compact, moved to unified section later */}
                </motion.div>
            </div>
        </section>
    );
};
