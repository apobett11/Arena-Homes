"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowLeft, Share2, Heart, Menu, X,
    MapPin, Star, ShieldCheck, Clock, CheckCircle2,
    Calendar, Home, MessageSquare, HelpCircle, User,
    ChevronRight, Lock, Droplets, Banknote, Sun
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HouseCard } from "@/components/listings/HouseCard"; // We will assume similar houses use this
import { PropertyApi } from "@/lib/api/domains/properties";
import { useSearchParams } from "next/navigation";

// --- Dummy Data ---
const defaultHouseData = {
    id: "1",
    title: "Modern Minimalist Villa with Garden",
    location: "Beverly Hills, CA",
    price: 2400,
    description: "Experience luxury living in this stunning 2-bedroom villa located just minutes from the city center. Featuring a spacious open-plan layout, private garden, and top-tier security.",
    longDescription: "Nestled in the heart of Beverly Hills, this modern minimalist villa offers a perfect blend of style and comfort. The property features floor-to-ceiling windows that flood the living space with natural light. The kitchen is equipped with state-of-the-art appliances, and the bedrooms offer ample storage and en-suite bathrooms. The private garden is perfect for evening relaxation. \n\nIdeal for professionals or small families looking for a premium lifestyle with easy access to urban amenities while enjoying a quiet retreat.",
    rating: 4.8,
    reviewCount: 124,
    amenities: [
        { icon: Banknote, label: "Deposit", value: "$1,200" },
        { icon: Droplets, label: "Water", value: "24/7 Supply" },
        { icon: Calendar, label: "Holiday Policy", value: "Flexible" },
        { icon: ShieldCheck, label: "Security", value: "CCTV & Guards" },
        { icon: Lock, label: "Gate Hours", value: "Close at 11 PM" },
        { icon: CheckCircle2, label: "Deposit Return", value: "Guaranteed" },
    ],
    images: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80",
    ],
    reviews: [
        { id: 1, user: "Sarah Jenkins", rating: 5, date: "2 days ago", comment: "Absolutely loved staying here! The garden is magical." },
        { id: 2, user: "Mike Rossi", rating: 4, date: "1 week ago", comment: "Great location, very clean. A bit pricey but worth it." },
        { id: 3, user: "Jessica Lee", rating: 5, date: "2 weeks ago", comment: "The security is top notch, felt very safe." },
        { id: 4, user: "David Chen", rating: 4, date: "3 weeks ago", comment: "Modern and stylish. The water pressure is amazing." },
    ]
};

const similarHouses = [
    { id: 2, title: "Luxury Penthouse Suite", type: "Two Bedroom", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80", location: "Manhattan, NY", description: "Luxury Penthouse Suite", price: 4500, distance: "2km", vacancy: "Available" as const, water: true },
    { id: 3, title: "Cozy Garden Cottage", type: "One Bedroom", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80", location: "Portland, OR", description: "Cozy Garden Cottage", price: 1800, distance: "1.5km", vacancy: "Available" as const, water: true },
    { id: 4, title: "Sunset Ridge Estate", type: "Two Bedroom", image: "https://images.unsplash.com/photo-1600585154526-990dcea4db0d?auto=format&fit=crop&w=800&q=80", location: "Malibu, CA", description: "Sunset Ridge Estate", price: 3200, distance: "3km", vacancy: "Limited" as const, water: true },
];

export default function ListingDetailPage({ params }: { params: { id: string } }) {
    const searchParams = useSearchParams();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [houseData, setHouseData] = useState(defaultHouseData);
    const [loading, setLoading] = useState(true);
    const [pinCode, setPinCode] = useState("");
    const [visitorId, setVisitorId] = useState("");
    const [accessMessage, setAccessMessage] = useState("");
    const [mapData, setMapData] = useState<{
        gateLabel: string;
        plotLabel: string;
        gateLat: number;
        gateLng: number;
        houseLat: number;
        houseLng: number;
    } | null>(null);
    const galleryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const pin = searchParams.get("pin");
        if (pin) setPinCode(pin);
        const existingVisitorId = typeof window !== "undefined" ? localStorage.getItem("arena_visitor_id") : null;
        if (existingVisitorId) {
            setVisitorId(existingVisitorId);
        } else if (typeof window !== "undefined") {
            const generated = crypto.randomUUID();
            localStorage.setItem("arena_visitor_id", generated);
            setVisitorId(generated);
        }
    }, [searchParams]);

    useEffect(() => {
        async function loadListing() {
            try {
                const unit = await PropertyApi.getUnit(params.id);
                const property = await PropertyApi.getOne(unit.propertyId);
                const price = Number(unit.basePrice) || 0;
                const image = property.logoUrl || defaultHouseData.images[0];
                const typeLabel = unit.type.replaceAll("_", " ");
                const policies = property.facilities?.policies || [];
                const map = property.facilities?.map;
                if (map) {
                    setMapData(map);
                }

                setHouseData((prev) => ({
                    ...prev,
                    id: unit.id,
                    title: `${property.name} - ${typeLabel}`,
                    location: property.location,
                    price,
                    description: unit.description || prev.description,
                    longDescription: unit.description || prev.longDescription,
                    images: [image, ...prev.images.slice(1)],
                    amenities: [
                        { icon: Banknote, label: "Deposit Policy", value: policies.find((p) => p.toLowerCase().includes("deposit")) || "Set by admin" },
                        { icon: Calendar, label: "Holiday Rent Policy", value: policies.find((p) => p.toLowerCase().includes("holiday")) || "Set by admin" },
                        { icon: Lock, label: "Gate", value: property.facilities?.map?.gateLabel || "Main gate" },
                        { icon: Home, label: "Owner", value: property.facilities?.ownerType || "Arena Homes" },
                        { icon: User, label: "Caretaker", value: property.facilities?.caretakerName || "Assigned" },
                        { icon: Droplets, label: "House Card", value: property.facilities?.houseCardDetails || "Available" },
                    ],
                }));
            } catch (error) {
                console.error("Failed to load listing details", error);
            } finally {
                setLoading(false);
            }
        }

        loadListing();
    }, [params.id]);

    async function startRealtimeMap() {
        if (!pinCode || !visitorId) {
            setAccessMessage("This map session needs a valid host PIN code.");
            return;
        }
        try {
            const result = await PropertyApi.consumeRealtimeMapByPin(pinCode, visitorId);
            setAccessMessage(`Realtime map started. Remaining uses: ${result.remainingUses}/${result.maxUses}`);
        } catch (error: unknown) {
            setAccessMessage(error instanceof Error ? error.message : "Unable to start realtime map");
        }
    }

    // Simple scroll listener for gallery to update index
    const handleScroll = () => {
        if (galleryRef.current) {
            const scrollLeft = galleryRef.current.scrollLeft;
            const width = galleryRef.current.offsetWidth;
            const index = Math.round(scrollLeft / width);
            setCurrentImageIndex(index);
        }
    };

    const menuItems = [
        { icon: User, label: "Sign In", href: "/auth/login" },
        { icon: Heart, label: "Browse Listings", href: "/listings" },
        { icon: Home, label: "Home", href: "/" },
        { icon: MessageSquare, label: "Tenant Chat", href: "/tenant/chat" },
        { icon: HelpCircle, label: "FAQ", href: "/#faq" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black pb-24 font-sans text-slate-900 dark:text-slate-100">
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm text-white font-semibold">
                    Loading listing...
                </div>
            )}

            {/* --- Hamburger Menu Dropdown --- */}
            <div className={cn(
                "fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 backdrop-blur-sm",
                isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )} onClick={() => setIsMenuOpen(false)}>
                <div className={cn(
                    "absolute top-0 right-0 h-full w-3/4 max-w-xs bg-white dark:bg-zinc-900 shadow-2xl transform transition-transform duration-300 p-6 flex flex-col gap-6",
                    isMenuOpen ? "translate-x-0" : "translate-x-full"
                )} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Menu</h2>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full">
                            <X />
                        </button>
                    </div>
                    <nav className="flex flex-col gap-4">
                        {menuItems.map((item, idx) => (
                            <Link key={idx} href={item.href} className="flex items-center gap-4 text-base font-medium p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                                <item.icon size={20} className="text-primary" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>

            {/* --- Hero Gallery --- */}
            <div className="relative h-[60vh] w-full bg-slate-200 dark:bg-zinc-800">
                <div
                    ref={galleryRef}
                    onScroll={handleScroll}
                    className="flex overflow-x-auto snap-x snap-mandatory w-full h-full scrollbar-hide"
                >
                    {houseData.images.map((img, idx) => (
                        <div key={idx} className="flex-none w-full h-full snap-center relative">
                            <Image src={img} alt={`House view ${idx + 1}`} fill className="object-cover" priority={idx === 0} />
                        </div>
                    ))}
                </div>

                {/* Overlay Controls */}
                <div className="absolute top-0 left-0 right-0 p-4 pt-12 flex justify-between items-start pointer-events-none">
                    <Link href="/" className="pointer-events-auto w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex gap-3 pointer-events-auto">
                        <button className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">
                            <Share2 size={20} />
                        </button>
                        <button className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-red-500 transition-colors">
                            <Heart size={20} />
                        </button>
                        <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">
                            <Menu size={20} />
                        </button>
                    </div>
                </div>

                {/* Gallery Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {houseData.images.map((_, idx) => (
                        <div key={idx} className={cn(
                            "w-2 h-2 rounded-full transition-all shadow-sm",
                            currentImageIndex === idx ? "bg-white w-4" : "bg-white/50"
                        )} />
                    ))}
                </div>
            </div>

            {/* --- Main Content --- */}
            <div className="rounded-t-3xl -mt-6 relative bg-slate-50 dark:bg-black p-6 space-y-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">

                {/* Header Info */}
                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold leading-tight">{houseData.title}</h1>
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mt-2 text-sm">
                                <MapPin size={14} />
                                {houseData.location}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-primary">${houseData.price.toLocaleString()}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">/ month</span>
                    </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-zinc-800" />

                {/* Reviews Summary - Clickable Area */}
                <Link href={`/listings/${houseData.id}/reviews`} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 hover:border-primary/30 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 w-12 h-12 rounded-full font-bold text-lg">
                            {houseData.rating}
                        </div>
                        <div>
                            <div className="flex text-amber-500">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill={s <= Math.round(houseData.rating) ? "currentColor" : "none"} className={s > Math.round(houseData.rating) ? "text-slate-300 dark:text-slate-700" : ""} />)}
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wide">Excellent • {houseData.reviewCount} Reviews</p>
                        </div>
                    </div>
                    <ChevronRight className="text-slate-400 group-hover:text-primary transition-colors" />
                </Link>

                {/* Description */}
                <div>
                    <h3 className="text-lg font-bold mb-3">About this home</h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm text-justify">
                        {houseData.longDescription}
                    </p>
                </div>

                {/* Amenities & Policies */}
                <div>
                    <h3 className="text-lg font-bold mb-4">Amenities & Policies</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {houseData.amenities.map((amenity, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                                <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-full text-slate-700 dark:text-slate-200">
                                    <amenity.icon size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{amenity.label}</p>
                                    <p className="text-sm font-semibold">{amenity.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-xl text-xs font-bold uppercase tracking-widest border border-blue-100 dark:border-blue-800/30">
                        <ShieldCheck size={14} />
                        Fulfilled by Arena Homes
                    </div>
                </div>

                {/* Map Guidance */}
                {mapData && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <h3 className="text-lg font-bold mb-2">Map & Gate Guidance</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Static route starts at gate <b>{mapData.gateLabel}</b> and ends at plot <b>{mapData.plotLabel}</b>.
                            Red pin is placed on the house by admin during registration.
                        </p>
                        <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <div>Gate: {mapData.gateLat}, {mapData.gateLng}</div>
                            <div>House Pin: {mapData.houseLat}, {mapData.houseLng}</div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                                href={`https://www.google.com/maps/dir/?api=1&destination=${mapData.houseLat},${mapData.houseLng}&waypoints=${mapData.gateLat},${mapData.gateLng}`}
                                target="_blank"
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                            >
                                View Static Route
                            </Link>
                            <button
                                onClick={startRealtimeMap}
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                            >
                                Start Realtime Guidance
                            </button>
                        </div>
                        {accessMessage && <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{accessMessage}</p>}
                    </div>
                )}

                {/* Reviews Preview Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold">What people say</h3>
                        <Link href={`/listings/${houseData.id}/reviews`} className="text-primary text-sm font-bold hover:underline">View all</Link>
                    </div>
                    <div className="space-y-3">
                        {houseData.reviews.map((review) => (
                            <div key={review.id} className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-sm">{review.user}</h4>
                                    <span className="text-[10px] text-slate-400 font-medium bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-full">{review.date}</span>
                                </div>
                                <div className="flex text-amber-500 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} className={i >= review.rating ? "text-slate-200 dark:text-zinc-700" : ""} />
                                    ))}
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 italic">&quot;{review.comment}&quot;</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Similar Houses Carousel */}
                <div>
                    <h3 className="text-lg font-bold mb-4">Similar Homes</h3>
                    <div className="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6 scrollbar-hide">
                        {similarHouses.map(house => (
                            <div key={house.id} className="min-w-[200px] sm:min-w-[240px]">
                                <HouseCard {...house} />
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* --- Bottom Action Bar --- */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-white/10 p-4 pb-8 z-40">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <div className="hidden sm:flex flex-col">
                        <p className="text-xs text-slate-500 uppercase font-bold">Total Price</p>
                        <p className="text-xl font-bold">${houseData.price.toLocaleString()}<span className="text-sm font-normal text-slate-400">/mo</span></p>
                    </div>

                    <div className="flex gap-3 flex-1 sm:flex-none w-full sm:w-auto">
                        <Link href={`https://maps.google.com/?q=${encodeURIComponent(houseData.location)}`} target="_blank" className="flex-1 sm:flex-none px-6 py-3 rounded-xl border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-colors whitespace-nowrap text-center">
                            Visit Plot
                        </Link>
                        <Link href="/tenant/chat" className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-primary text-white font-bold hover:brightness-110 shadow-lg shadow-primary/20 transition-all whitespace-nowrap text-center">
                            Chat w/ Tenant
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    );
}
