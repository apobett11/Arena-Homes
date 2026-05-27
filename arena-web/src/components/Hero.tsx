"use client";

import { Search, MapPin, Home, DollarSign, Sparkles, ChevronDown, CheckCircle, Shield, Headphones } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export const Hero = () => {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    async function loadLocations() {
      const supabase = getSupabaseClient();
      try {
        const { data: locationData } = await supabase
          .from("properties")
          .select("location")
          .not("location", "is", null);

        const uniqueLocations = [
          ...new Set(locationData?.map((p: { location: string }) => p.location).filter(Boolean)),
        ].sort() as string[];
        setLocations(uniqueLocations);
      } catch (e) {
        console.error("Failed to load locations:", e);
      }
    }
    loadLocations();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (type && type !== "All Types") params.set("type", type);
    if (priceRange === "Low") params.set("sort", "asc");
    if (priceRange === "High") params.set("sort", "desc");
    router.push(`/listings?${params.toString()}`);
  };

  return (
    <section className="relative flex min-h-[95vh] items-center overflow-hidden pt-24 md:min-h-[90vh]">
      <div className="relative z-20 mx-auto w-full max-w-[1280px] px-4 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="public-glass public-glass-border mb-8 inline-flex items-center gap-3 rounded-full px-4 py-2 backdrop-blur-xl"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-vibrant-blue pulse-dot" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-fixed-dim md:text-[14px] md:leading-none">
              Now serving Egerton University & surrounding areas
            </span>
            <Sparkles size={14} className="text-primary-fixed-dim" />
          </motion.div>

          <h1 className="mb-6 max-w-3xl font-bold leading-tight tracking-tight text-white drop-shadow-2xl text-[32px] leading-tight md:mb-12 md:text-[48px] md:leading-[1.1] md:tracking-[-0.02em]">
            Find a verified student home near Egerton University
          </h1>

          <p className="mb-10 max-w-2xl font-normal leading-relaxed text-white/90 drop-shadow-md text-[18px] leading-[1.6] md:text-xl">
            Browse trusted rooms, bedsitters, and apartments built around student budgets, safety, and campus
            convenience.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mx-auto max-w-4xl"
          >
            <div className="rounded-[24px] border border-white/15 bg-surface-navy p-2 shadow-2xl md:rounded-[32px] md:p-3">
              <div className="mb-2 grid grid-cols-3 gap-2 md:mb-0 md:gap-2">
                <div className="hero-search-glass-field flex flex-col gap-1 rounded-2xl p-2 md:p-4">
                  <span className="truncate text-[8px] font-semibold uppercase tracking-wider text-slate-900 md:text-[10px]">
                    Location
                  </span>
                  <div className="relative flex items-center gap-1 md:gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-gold-accent md:h-5 md:w-5" aria-hidden />
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full cursor-pointer appearance-none border-none bg-transparent p-0 text-[12px] font-semibold text-slate-900 focus:ring-0 md:text-base"
                    >
                      <option value="">All Locations</option>
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-700 md:hidden"
                      aria-hidden
                    />
                  </div>
                </div>

                <div className="hero-search-glass-field flex flex-col gap-1 rounded-2xl p-2 md:p-4">
                  <span className="truncate text-[8px] font-semibold uppercase tracking-wider text-slate-900 md:text-[10px]">
                    Budget
                  </span>
                  <div className="relative flex items-center gap-1 md:gap-2">
                    <DollarSign className="h-4 w-4 shrink-0 text-gold-accent md:h-5 md:w-5" aria-hidden />
                    <select
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="w-full cursor-pointer appearance-none border-none bg-transparent p-0 text-[12px] font-semibold text-slate-900 focus:ring-0 md:text-base"
                    >
                      <option value="">Any Price</option>
                      <option value="Low">Under KSh 5k</option>
                      <option value="5k-8k">KSh 5k - 8k</option>
                      <option value="8k-12k">KSh 8k - 12k</option>
                      <option value="High">Above KSh 12k</option>
                    </select>
                  </div>
                </div>

                <div className="hero-search-glass-field flex flex-col gap-1 rounded-2xl p-2 md:p-4">
                  <span className="truncate text-[8px] font-semibold uppercase tracking-wider text-slate-900 md:text-[10px]">
                    Type
                  </span>
                  <div className="relative flex items-center gap-1 md:gap-2">
                    <Home className="h-4 w-4 shrink-0 text-gold-accent md:h-5 md:w-5" aria-hidden />
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full cursor-pointer appearance-none border-none bg-transparent p-0 text-[12px] font-semibold text-slate-900 focus:ring-0 md:text-base"
                    >
                      <option value="">All Types</option>
                      <option value="Single Room">Single Room</option>
                      <option value="Bedsitter">Bedsitter</option>
                      <option value="1 Bedroom">1 Bedroom</option>
                      <option value="2 Bedroom">2 Bedroom</option>
                    </select>
                  </div>
                </div>
              </div>

              <motion.button
                onClick={handleSearch}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-vibrant-blue py-4 font-semibold text-[14px] leading-none text-white shadow-lg transition-all hover:bg-primary-marketing md:rounded-2xl md:py-5 md:text-[14px]"
                aria-label="Search properties"
              >
                <Search size={18} />
                Search Properties
              </motion.button>
            </div>
          </motion.div>

          <div className="mt-8 flex flex-wrap items-center gap-2 md:mt-8 md:gap-6">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur-md md:gap-2 md:px-4 md:py-2">
              <CheckCircle className="h-3 w-3 text-success-emerald md:h-4 md:w-4" aria-hidden />
              <span className="whitespace-nowrap text-[10px] font-semibold leading-none text-white md:text-xs">
                500+ Verified Homes
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur-md md:gap-2 md:px-4 md:py-2">
              <Shield className="h-3 w-3 text-gold-accent md:h-4 md:w-4" aria-hidden />
              <span className="whitespace-nowrap text-[10px] font-semibold leading-none text-white md:text-xs">
                100% Secure Payments
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur-md md:gap-2 md:px-4 md:py-2">
              <Headphones className="h-3 w-3 text-vibrant-blue md:h-4 md:w-4" aria-hidden />
              <span className="whitespace-nowrap text-[10px] font-semibold leading-none text-white md:text-xs">
                24/7 Support
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
