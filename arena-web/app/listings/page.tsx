"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FilterBar, FilterState } from "@/components/listings/FilterBar";
import { HouseCard, HouseProps } from "@/components/listings/HouseCard";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getSupabaseClient } from "@/lib/supabase/client";

const unitTypeToLabel: Record<string, string> = {
    SINGLE: "Single Room",
    BEDSITTER: "Bedsitter",
    ONE_BEDROOM: "One Bedroom",
    TWO_BEDROOM: "Two Bedroom",
    APARTMENT: "Apartment",
};

// Public listing data from database view
interface PublicListing {
    unit_id: string;
    property_id: string;
    unit_type: string;
    unit_description: string | null;
    rent_amount: number;
    deposit_amount: number | null;
    availability_status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'UNDER_MAINTENANCE' | 'UNAVAILABLE';
    unit_amenities: { water?: boolean; electricity?: boolean; security?: boolean; internet?: boolean } | null;
    unit_photos: string[] | null;
    last_updated: string | null;
    property_name: string;
    property_location: string;
    property_latitude: number | null;
    property_longitude: number | null;
    gate_latitude: number | null;
    gate_longitude: number | null;
    school_gate_distance_meters: number | null;
    landmark: string | null;
    property_verification_status: string;
    property_logo: string | null;
    walking_time_minutes: number | null;
    primary_photo_url: string | null;
    // New fields for vacancy tracking
    available_rooms: number;
    total_rooms: number;
    likes_count: number;
    max_occupancy: number;
}

// Helper to map public listing data to UI props
const mapPublicListingToHouseProps = (listing: PublicListing): HouseProps => ({
    id: listing.unit_id,
    title: `${listing.property_name} - ${unitTypeToLabel[listing.unit_type] || listing.unit_type}`,
    location: listing.property_location,
    price: listing.rent_amount,
    type: unitTypeToLabel[listing.unit_type] || listing.unit_type,
    image: listing.primary_photo_url || listing.property_logo || `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80`,
    distance: listing.school_gate_distance_meters 
        ? `${(listing.school_gate_distance_meters / 1000).toFixed(1)}km` 
        : "Near Campus",
    vacancy: listing.available_rooms > 0 ? 'Available' : 'Occupied',
    water: listing.unit_amenities?.water ?? true,
    // Trust signals
    isVerified: listing.property_verification_status === 'VERIFIED',
    verificationStatus: listing.property_verification_status,
    availabilityStatus: listing.availability_status,
    depositAmount: listing.deposit_amount ?? undefined,
    walkingTimeMinutes: listing.walking_time_minutes,
    lastUpdated: listing.last_updated ?? undefined,
    amenities: listing.unit_amenities ?? undefined,
    // New vacancy fields
    availableRooms: listing.available_rooms,
    totalRooms: listing.total_rooms,
    likesCount: listing.likes_count,
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

    // Data Fetching - Use public_listings view for safe, public data
    useEffect(() => {
        async function fetchListings() {
            try {
                const supabase = getSupabaseClient();
                
                // Query the public_listings view for safe, public data
                // Only get properties with available rooms (vacant)
                const { data: publicListings, error } = await supabase
                    .from('public_listings')
                    .select('*')
                    .gt('available_rooms', 0)
                    .order('rent_amount', { ascending: true });

                if (error) {
                    console.error("Failed to fetch listings:", error);
                    // Fallback to direct tables if view not available
                    const { data: unitsData, error: unitsError } = await supabase
                        .from('units')
                        .select(`
                            id,
                            property_id,
                            type,
                            description,
                            base_price,
                            deposit_amount,
                            availability_status,
                            amenities,
                            last_updated,
                            properties!inner(
                                id, name, location, logo_url, verification_status,
                                latitude, longitude, school_gate_distance_meters, landmark
                            )
                        `)
                        .not('properties.verification_status', 'eq', 'SUSPENDED');
                    
                    if (unitsError) throw unitsError;
                    
                    const fallbackListings: HouseProps[] = (unitsData || [])
                        .filter((u: any) => u.availability_status === 'AVAILABLE' || u.status === 'VACANT')
                        .map((u: any) => ({
                            id: u.id,
                            title: `${u.properties.name} - ${unitTypeToLabel[u.type] || u.type}`,
                            location: u.properties.location,
                            price: parseFloat(u.base_price) || 0,
                            type: unitTypeToLabel[u.type] || u.type,
                            image: u.properties.logo_url || `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80`,
                            distance: u.properties.school_gate_distance_meters 
                                ? `${(u.properties.school_gate_distance_meters / 1000).toFixed(1)}km` 
                                : "Near Campus",
                            vacancy: 'Available',
                            water: u.amenities?.water ?? true,
                            isVerified: u.properties.verification_status === 'VERIFIED',
                            verificationStatus: u.properties.verification_status,
                            availabilityStatus: u.availability_status,
                            depositAmount: u.deposit_amount ?? undefined,
                            lastUpdated: u.last_updated ?? undefined,
                            amenities: u.amenities ?? undefined,
                            availableRooms: u.total_rooms && u.occupied_rooms ? u.total_rooms - u.occupied_rooms : 1,
                            totalRooms: u.total_rooms ?? 1,
                            likesCount: u.likes_count ?? 0,
                        }));
                    
                    setListings(fallbackListings);
                } else {
                    const mapped: HouseProps[] = (publicListings || []).map(mapPublicListingToHouseProps);
                    setListings(mapped);
                }
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
            const supabase = getSupabaseClient();
            
            // First try to find by location_share_codes
            const { data: shareCodeData, error: shareError } = await (supabase as any)
                .rpc('get_location_share_code', { p_code: pinCode.trim().toUpperCase() });
            
            const shareCode = shareCodeData?.[0] as { unit_id: string } | undefined;
            if (shareCode && !shareError && shareCode.unit_id) {
                // Found a valid share code, navigate to that unit
                router.push(`/listings/${shareCode.unit_id}?pin=${encodeURIComponent(pinCode.trim().toUpperCase())}`);
                return;
            }
            
            // Fallback: Try to find by property facilities invitePinCode (legacy)
            const { data: propertyData, error: propError } = await (supabase as any)
                .from('properties')
                .select('id, facilities, units(id)')
                .filter('facilities->invitePinCode', 'eq', pinCode.trim().toUpperCase())
                .maybeSingle();
            
            const property = propertyData as { id: string; facilities: any; units?: { id: string }[] } | null;
            
            if (propError || !property) {
                setPinSearchError("Invalid PIN code. Please check with the host and try again.");
                return;
            }
            
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
