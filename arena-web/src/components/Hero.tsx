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
            {/* Futuristic Hero Background - Deep navy (low opacity) → warm cream → faint gold */}
            <div className="absolute inset-0 z-0">
                {/* Ambient mesh gradient orbs with animation */}
                <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-radial from-[#C9B37F]/15 via-[#C9B37F]/5 to-transparent rounded-full blur-3xl animate-mesh-glow" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-[#0F172A]/6 via-[#0F172A]/2 to-transparent rounded-full blur-3xl animate-mesh-glow" style={{ animationDelay: '-10s' }} />
                <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-gradient-radial from-[#F0EDE6]/40 via-transparent to-transparent rounded-full blur-3xl" />
                
                {/* Subtle navy overlay on hero imagery */}
                <div className="absolute inset-0 opacity-25">
                    <Image
                        src={heroImage}
                        alt="Modern student housing near Egerton University"
                        fill
                        className="object-cover"
                        priority
                        quality={90}
                    />
                </div>
                
                {/* Sophisticated gradient overlay - navy → cream → gold */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#F8F5F0]/90 via-[#F5F1EB]/75 to-[#F0EDE6]/95" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/5 via-transparent to-[#C9B37F]/5" />
                
                {/* Futuristic accent lines */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9B37F]/30 to-transparent" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24 md:pt-32">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mx-auto max-w-5xl"
                >
                    {/* Premium Trust Badge - Futuristic Design */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="mb-8 inline-flex items-center gap-2 rounded-full bg-[#F0EDE6]/95 backdrop-blur-md border border-[#C9B37F]/40 px-4 py-2 text-sm font-medium text-[#0F172A] shadow-lg shadow-[#0F172A]/5"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                        </span>
                        <span>Now serving Egerton University & surrounding areas</span>
                        <Sparkles size={14} className="text-[#C9B37F]" />
                    </motion.div>

                    {/* Premium Main Heading - Deep Navy & Champagne Gold */}
                    <h1 className="mb-6 text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-[#1F2937] leading-[1.1]">
                        Find a verified{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0F172A] via-[#334155] to-[#C9B37F]">
                            student home
                        </span>
                        <br className="hidden sm:block" />
                        near Egerton University
                    </h1>

                    <p className="mb-10 text-lg md:text-xl text-[#4B5563] font-normal max-w-2xl mx-auto leading-relaxed">
                        Browse trusted rooms, bedsitters, and apartments built around student budgets,
                        safety, and campus convenience.
                    </p>

                    {/* Premium Search Bar - Futuristic Glass Design */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="mx-auto max-w-4xl"
                    >
                        <div className="glass-elevated rounded-3xl p-3 shadow-2xl shadow-[#0F172A]/8 border border-[#C9B37F]/25">
                            <div className="flex flex-col lg:flex-row gap-3">
                                {/* Location Dropdown */}
                                <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#F8F5F0] border border-[#EDE9E0] hover:border-[#C9B37F]/50 transition-all duration-300">
                                    <MapPin className="text-[#0F172A] shrink-0" size={20} />
                                    <div className="flex flex-col items-start w-full min-w-0 relative">
                                        <label className="text-[10px] font-semibold text-[#4B5563] uppercase tracking-wider">Location</label>
                                        <select
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className={`${selectBaseClass} font-semibold text-[#1F2937]`}
                                            aria-label="Select location"
                                        >
                                            <option value="" className={optionClass}>All Locations</option>
                                            {locations.map((loc) => (
                                                <option key={loc} value={loc} className={optionClass}>{loc}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <ChevronDown size={16} className="text-[#9CA3AF] shrink-0 pointer-events-none" />
                                </div>

                                {/* Property Type */}
                                <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#F8F5F0] border border-[#EDE9E0] hover:border-[#C9B37F]/50 transition-all duration-300">
                                    <Home className="text-[#0F172A] shrink-0" size={20} />
                                    <div className="flex flex-col items-start w-full min-w-0">
                                        <label className="text-[10px] font-semibold text-[#4B5563] uppercase tracking-wider">Type</label>
                                        <select
                                            value={type}
                                            onChange={(e) => setType(e.target.value)}
                                            className={`${selectBaseClass} font-semibold text-[#1F2937]`}
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
                                <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#F8F5F0] border border-[#EDE9E0] hover:border-[#C9B37F]/50 transition-all duration-300">
                                    <DollarSign className="text-[#0F172A] shrink-0" size={20} />
                                    <div className="flex flex-col items-start w-full min-w-0">
                                        <label className="text-[10px] font-semibold text-[#4B5563] uppercase tracking-wider">Budget</label>
                                        <select
                                            value={priceRange}
                                            onChange={(e) => setPriceRange(e.target.value)}
                                            className={`${selectBaseClass} font-semibold text-[#1F2937]`}
                                            aria-label="Select price range"
                                        >
                                            <option value="" className={optionClass}>Any Price</option>
                                            <option value="Low" className={optionClass}>Low to High</option>
                                            <option value="High" className={optionClass}>High to Low</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Search Button - Deep Navy with Gold Accent */}
                                <button
                                    onClick={handleSearch}
                                    className="flex h-14 lg:h-auto lg:w-14 items-center justify-center gap-2 rounded-2xl bg-[#0F172A] text-white font-semibold transition-all hover:bg-[#1E293B] hover:shadow-lg hover:shadow-[#0F172A]/25 hover:scale-[1.02] active:scale-[0.98] shrink-0 border-2 border-transparent hover:border-[#C9B37F]"
                                    aria-label="Search properties"
                                >
                                    <Search size={22} />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Trust Chips - Futuristic with Gold Accents */}
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
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F0EDE6]/90 border border-[#C9B37F]/30 text-[#4B5563] text-sm shadow-sm hover:shadow-md hover:border-[#C9B37F]/50 hover:scale-[1.02] transition-all duration-300"
                            >
                                <chip.icon size={14} className="text-[#C9B37F]" />
                                <span className="font-medium">{chip.text}</span>
                            </div>
                        ))}
                    </motion.div>

                    {/* Premium Stats Bar - Futuristic Design */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16 px-6 py-4 rounded-2xl bg-[#F0EDE6]/80 border border-[#C9B37F]/25 backdrop-blur-sm shadow-lg shadow-[#0F172A]/5"
                    >
                        {displayStats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <span className="block text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">{stat.value}</span>
                                <span className="text-xs md:text-sm font-medium text-[#4B5563]">{stat.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};
