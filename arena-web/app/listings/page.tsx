"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FilterBar, FilterState } from "@/components/listings/FilterBar";
import { HouseCard, HouseProps } from "@/components/listings/HouseCard";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertyApi, Property, Unit } from "@/lib/api/domains/properties";

const unitTypeToLabel: Record<string, string> = {
    SINGLE: "Single Room",
    BEDSITTER: "Bedsitter",
    ONE_BEDROOM: "One Bedroom",
    TWO_BEDROOM: "Two Bedroom",
    APARTMENT: "Apartment",
};

// Helper to map API data to UI props
const mapToHouseProps = (property: Property, unit: Unit): HouseProps => ({
    id: unit.id,
    title: `${property.name} - ${unitTypeToLabel[unit.type] || unit.type}`,
    location: property.location,
    price: parseFloat(unit.basePrice),
    type: unitTypeToLabel[unit.type] || unit.type,
    image: property.logoUrl || `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80`, // Fallback
    distance: "0.5km", // Placeholder, backend API needs geo logic
    vacancy: unit.status === 'VACANT' ? 'Available' : 'Limited',
    water: true // Placeholder
});

function ListingsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const [listings, setListings] = useState<HouseProps[]>([]);

    // Initial Filter State
    const [filters, setFilters] = useState<FilterState>({
        priceRange: [2500, 20000],
        locations: [],
        houseTypes: [],
        sortDirection: 'asc'
    });

    const [loading, setLoading] = useState(true);
    const [pinCode, setPinCode] = useState("");
    const [pinSearchError, setPinSearchError] = useState("");

    // Read URL Params on Mount
    useEffect(() => {
        const typeParam = searchParams.get('type');
        const locParam = searchParams.get('location');
        const sortParam = searchParams.get('sort');

        if (typeParam || locParam || sortParam) {
            setFilters(prev => ({
                ...prev,
                houseTypes: typeParam ? [typeParam] : prev.houseTypes,
                locations: locParam ? [locParam] : prev.locations,
                sortDirection: (sortParam === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'
            }));
        }
    }, [searchParams]);

    // Data Fetching
    useEffect(() => {
        async function fetchListings() {
            try {
                // Fetch properties (with units implied or separate?)
                // Assuming properties endpoint returns basic info. We might need units.
                // Let's try fetching properties, and if they have units, good.
                // If not, we might need a specific '/listings' endpoint in real world.
                // Phase 4 Backend `PropertyRepository.get` returns units, `list` might not.
                // I'll fetch units directly via `getUnits` and properties via `getAll`.
                const [properties, units] = await Promise.all([
                    PropertyApi.getAll(),
                    PropertyApi.getUnits()
                ]);

                // Map units to houses
                const mapped: HouseProps[] = [];

                // Index properties for faster lookup
                const propMap = new Map(properties.map(p => [p.id, p]));

                units.forEach(u => {
                    const p = propMap.get(u.propertyId);
                    if (p) {
                        mapped.push(mapToHouseProps(p, u));
                    }
                });

                setListings(mapped);
            } catch (err) {
                console.error("Failed to fetch listings", err);
            } finally {
                setLoading(false);
            }
        }
        fetchListings();
    }, []);

    async function searchByInvitePin() {
        if (!pinCode.trim()) return;
        setPinSearchError("");
        try {
            const property = await PropertyApi.getByPinCode(pinCode.trim().toUpperCase());
            const firstUnit = property.units?.[0];
            if (!firstUnit) {
                setPinSearchError("No unit is currently attached to this house.");
                return;
            }
            router.push(`/listings/${firstUnit.id}?pin=${encodeURIComponent(pinCode.trim().toUpperCase())}`);
        } catch (error: unknown) {
            setPinSearchError(error instanceof Error ? error.message : "PIN search failed");
        }
    }

    // Filtering Logic
    const filteredListings = useMemo(() => {
        const result = listings.filter(house => {
            const matchesPrice = house.price >= filters.priceRange[0] && house.price <= filters.priceRange[1];
            const matchesLocation = filters.locations.length === 0 || filters.locations.includes(house.location);
            const matchesType = filters.houseTypes.length === 0 || filters.houseTypes.includes(house.type);

            return matchesPrice && matchesLocation && matchesType;
        });

        // Sorting
        result.sort((a, b) => {
            return filters.sortDirection === 'asc' ? a.price - b.price : b.price - a.price;
        });

        return result;
    }, [filters, listings]);

    // GSAP Animation updates
    useEffect(() => {
        if (!loading && containerRef.current) {
            const ctx = gsap.context(() => {
                gsap.fromTo(".house-card-wrapper",
                    { y: 50, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        stagger: 0.1,
                        duration: 0.6,
                        ease: "power2.out",
                        overwrite: "auto"
                    }
                );
            }, containerRef);
            return () => ctx.revert();
        }
    }, [filteredListings, loading]);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-[#0066FF] selection:text-white">
            <Navbar />

            <main className="pt-24 pb-20">
                {/* Header Section */}
                <section className="container mx-auto px-4 mb-8 text-center md:text-left">
                    <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-3">
                        Available Houses Near Egerton
                    </h1>
                    <p className="text-slate-400 max-w-2xl text-lg">
                        Real-time vacancy updates. Filtered for students.
                        <span className="inline-block ml-3 px-2 py-0.5 rounded-full bg-[#00D084]/10 text-[#00D084] text-xs font-bold border border-[#00D084]/20">
                            {filteredListings.length} Found
                        </span>
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                            value={pinCode}
                            onChange={(e) => setPinCode(e.target.value)}
                            placeholder="Enter host invite PIN code"
                            className="w-full sm:w-80 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                        />
                        <button
                            onClick={searchByInvitePin}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                        >
                            Find by PIN
                        </button>
                    </div>
                    {pinSearchError && <p className="mt-2 text-sm text-rose-400">{pinSearchError}</p>}
                </section>

                {/* Filters */}
                <div className="sticky top-16 z-30 mb-8">
                    <FilterBar
                        filters={filters}
                        setFilters={setFilters}
                        minPrice={2500}
                        maxPrice={20000}
                        // Available locations/types should be dynamic ideally
                        availableLocations={["Main Gate", "Njokerio", "Milimani", "Town", "Blue Valley"]}
                        availableTypes={["Single Room", "Bedsitter", "One Bedroom", "Two Bedroom", "Apartment"]}
                    />
                </div>

                {/* Listings Grid */}
                <div ref={containerRef} className="container mx-auto px-4 min-h-[60vh]">
                    {loading ? (
                        // Skeleton State
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="aspect-[3/4] rounded-3xl bg-slate-800/50 animate-pulse border border-white/5" />
                            ))}
                        </div>
                    ) : filteredListings.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {filteredListings.map((house) => (
                                <div key={house.id} className="house-card-wrapper h-full">
                                    <HouseCard {...house} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Empty State
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
                                <Filter size={32} className="text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No houses found</h3>
                            <p className="text-slate-400 mb-6">Try adjusting your filters to see more results.</p>
                            <button
                                onClick={() => setFilters({
                                    priceRange: [2500, 20000],
                                    locations: [],
                                    houseTypes: [],
                                    sortDirection: 'asc'
                                })}
                                className="px-6 py-2 rounded-xl bg-[#0066FF] text-white font-bold hover:bg-[#0052cc] transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>

            </main>
            <Footer />
        </div>
    );
}

export default function ListingsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="animate-pulse text-slate-400">Loading listings...</div>
            </div>
        }>
            <ListingsContent />
        </Suspense>
    );
}

// Helper for empty state icon
function Filter({ size, className }: { size: number, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    )
}
