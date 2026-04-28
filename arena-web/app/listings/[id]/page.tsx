"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowLeft, Share2, Heart, Menu, X,
    MapPin, Star, ShieldCheck, Clock, CheckCircle2,
    Calendar, Home, MessageSquare, HelpCircle, User,
    ChevronRight, Lock, Droplets, Banknote, Sun,
    Phone, Mail, Facebook, Instagram, Twitter, Youtube,
    Send, Copy, Check, FileText, MessageCircle,
    ArrowRightCircle, XCircle, Info, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HouseCard } from "@/components/listings/HouseCard";
import { PropertyApi } from "@/lib/api/domains/properties";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

// Types for dynamic data
interface PropertyRule {
    id: string;
    title: string;
    details: string;
    sort_order: number;
}

interface PropertyFAQ {
    id: string;
    question: string;
    answer: string;
    sort_order: number;
}

interface SiteSettings {
    contact_phone?: string;
    contact_email?: string;
    whatsapp_number?: string;
    facebook_url?: string;
    instagram_url?: string;
    twitter_url?: string;
    youtube_url?: string;
    tiktok_url?: string;
    telegram_url?: string;
    office_address?: string;
    business_hours?: string;
}

interface PropertyReview {
    id: string;
    tenant_id: string;
    property_id: string;
    rating: number;
    comment: string;
    created_at: string;
}

interface CaretakerInfo {
    id: string;
    full_name: string;
    email?: string;
    phone_number?: string;
}

// --- Default/Fallback Data (used while loading) ---
const defaultHouseData = {
    id: "",
    title: "Loading...",
    location: "",
    price: 0,
    description: "Loading property details...",
    longDescription: "Please wait while we load the property information.",
    rating: 0,
    reviewCount: 0,
    amenities: [
        { icon: Banknote, label: "Deposit", value: "Loading..." },
        { icon: Droplets, label: "Water", value: "Loading..." },
        { icon: Calendar, label: "Holiday Policy", value: "Loading..." },
        { icon: ShieldCheck, label: "Security", value: "Loading..." },
        { icon: Lock, label: "Gate Hours", value: "Loading..." },
        { icon: CheckCircle2, label: "Deposit Return", value: "Loading..." },
    ],
    images: [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
    ],
    reviews: []
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
    
    // New state for dynamic data
    const [rules, setRules] = useState<PropertyRule[]>([]);
    const [faqs, setFaqs] = useState<PropertyFAQ[]>([]);
    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
    const [propertyId, setPropertyId] = useState<string | null>(null);
    const [reviews, setReviews] = useState<PropertyReview[]>([]);
    const [caretaker, setCaretaker] = useState<CaretakerInfo | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState("");
    const [applicationForm, setApplicationForm] = useState({
        fullName: "",
        email: "",
        phone: "",
        message: ""
    });

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
                const supabase = getSupabaseClient();
                
                // Load unit and property data
                const unit = await PropertyApi.getUnit(params.id);
                const property = await PropertyApi.getOne(unit.propertyId);
                setPropertyId(property.id);
                
                const price = Number(unit.basePrice) || 0;
                const image = property.logoUrl || defaultHouseData.images[0];
                const typeLabel = unit.type.replaceAll("_", " ");
                const policies = property.facilities?.policies || [];
                const map = property.facilities?.map;
                
                // Extract caretaker info first
                const caretakerInfo = property.caretaker ? {
                    id: property.caretaker.id,
                    full_name: property.caretaker.full_name,
                    email: property.caretaker.email,
                    phone_number: property.caretaker.phone_number
                } : null;
                
                if (caretakerInfo) {
                    setCaretaker(caretakerInfo);
                }
                
                if (map) {
                    setMapData(map);
                }

                setHouseData({
                    id: unit.id,
                    title: `${property.name} - ${typeLabel}`,
                    location: property.location,
                    price,
                    description: unit.description || `A ${typeLabel} unit at ${property.name} located in ${property.location}.`,
                    longDescription: unit.description || `This is a ${typeLabel} unit located at ${property.name} in ${property.location}. Contact the caretaker for more details and to schedule a viewing.`,
                    images: [image, property.logoUrl || image, image, image],
                    amenities: [
                        { icon: Banknote, label: "Deposit Policy", value: policies.find((p) => p.toLowerCase().includes("deposit")) || "Set by admin" },
                        { icon: Calendar, label: "Holiday Rent Policy", value: policies.find((p) => p.toLowerCase().includes("holiday")) || "Set by admin" },
                        { icon: Lock, label: "Gate", value: property.facilities?.map?.gateLabel || "Main gate" },
                        { icon: Home, label: "Owner", value: property.facilities?.ownerType || "Arena Homes" },
                        { icon: User, label: "Caretaker", value: caretakerInfo?.full_name || "Assigned" },
                        { icon: Droplets, label: "House Card", value: property.facilities?.houseCardDetails || "Available" },
                    ],
                });

                // Load property rules
                const { data: rulesData } = await supabase
                    .from('property_rules')
                    .select('*')
                    .eq('property_id', property.id)
                    .eq('is_active', true)
                    .order('sort_order', { ascending: true });
                if (rulesData) setRules(rulesData);

                // Load property FAQs
                const { data: faqsData } = await supabase
                    .from('property_faqs')
                    .select('*')
                    .eq('property_id', property.id)
                    .eq('is_active', true)
                    .order('sort_order', { ascending: true });
                if (faqsData) setFaqs(faqsData);

                // Load site settings for contact info
                const { data: settingsData } = await supabase
                    .from('site_settings')
                    .select('*')
                    .maybeSingle();
                if (settingsData) setSiteSettings(settingsData);

                // Load property reviews
                const { data: reviewsData } = await supabase
                    .from('property_reviews')
                    .select('*')
                    .eq('property_id', property.id)
                    .order('created_at', { ascending: false })
                    .limit(4);
                if (reviewsData) setReviews(reviewsData);

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

    const menuItems: Array<{
        icon: React.ElementType;
        label: string;
        href: string;
        disabled?: boolean;
        tooltip?: string;
        onClick?: () => void;
    }> = [
        { icon: User, label: "Sign In", href: "/auth/login" },
        { icon: Heart, label: "Browse Listings", href: "/listings" },
        { icon: Home, label: "Home", href: "/" },
        { icon: MessageSquare, label: "Tenant Chat (Tenants Only)", href: "#", disabled: true, tooltip: "Only tenants can chat with tenants" },
        { icon: HelpCircle, label: "FAQ", href: "#rules", onClick: () => document.getElementById('rules-faq-section')?.scrollIntoView({ behavior: 'smooth' }) },
    ];

    // Share functions
    const getShareUrl = () => {
        if (typeof window === 'undefined') return '';
        return `${window.location.origin}/listings/${params.id}`;
    };

    const handleShare = (platform: string) => {
        const url = encodeURIComponent(getShareUrl());
        const text = encodeURIComponent(`Check out this property: ${houseData.title}`);
        
        switch (platform) {
            case 'whatsapp':
                window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
                break;
            case 'telegram':
                window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
                break;
            case 'copy':
                navigator.clipboard.writeText(getShareUrl());
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                break;
        }
        setShowShareModal(false);
    };

    // Application submission
    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!applicationForm.fullName || !applicationForm.email || !applicationForm.phone) {
            setSubmitMessage("Please fill in all required fields");
            return;
        }
        
        setSubmitting(true);
        setSubmitMessage("");
        
        try {
            const supabase = getSupabaseClient();
            const applicationData = {
                unit_id: params.id,
                property_id: propertyId,
                caretaker_id: caretaker?.id || null,
                full_name: applicationForm.fullName,
                email: applicationForm.email,
                phone_number: applicationForm.phone,
                message: applicationForm.message,
                status: 'PENDING' as const
            };
            const { error } = await (supabase as any).from('tenant_applications').insert(applicationData);
            
            if (error) throw error;
            
            setSubmitMessage("Application submitted successfully! The caretaker will contact you soon.");
            setApplicationForm({ fullName: "", email: "", phone: "", message: "" });
            setTimeout(() => setShowApplyModal(false), 2000);
        } catch (error) {
            console.error("Failed to submit application:", error);
            setSubmitMessage("Failed to submit application. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

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
                            <div key={idx}>
                                {item.disabled ? (
                                    <div 
                                        className="flex items-center gap-4 text-base font-medium p-2 text-slate-400 cursor-not-allowed"
                                        title={item.tooltip}
                                    >
                                        <item.icon size={20} className="text-slate-400" />
                                        <span>{item.label}</span>
                                        <Info size={14} className="text-slate-300" />
                                    </div>
                                ) : item.onClick ? (
                                    <button 
                                        onClick={() => {
                                            item.onClick?.();
                                            setIsMenuOpen(false);
                                        }}
                                        className="flex items-center gap-4 text-base font-medium p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors w-full text-left"
                                    >
                                        <item.icon size={20} className="text-primary" />
                                        {item.label}
                                    </button>
                                ) : (
                                    <Link 
                                        href={item.href} 
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-4 text-base font-medium p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        <item.icon size={20} className="text-primary" />
                                        {item.label}
                                    </Link>
                                )}
                            </div>
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
                    <Link href="/listings" className="pointer-events-auto w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex gap-3 pointer-events-auto">
                        <button 
                            onClick={() => setShowShareModal(true)}
                            className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
                        >
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
                        Fulfilled by {caretaker?.full_name || "Arena Homes"}
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
                        {reviews.length > 0 && (
                            <Link href={`/listings/${houseData.id}/reviews`} className="text-primary text-sm font-bold hover:underline">View all</Link>
                        )}
                    </div>
                    <div className="space-y-3">
                        {reviews.length === 0 ? (
                            <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 text-center">
                                <p className="text-sm text-slate-500 dark:text-slate-400">No reviews yet. Be the first to review!</p>
                            </div>
                        ) : (
                            reviews.slice(0, 4).map((review) => (
                                <div key={review.id} className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-sm">Tenant</h4>
                                        <span className="text-[10px] text-slate-400 font-medium bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex text-amber-500 mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} className={i >= review.rating ? "text-slate-200 dark:text-zinc-700" : ""} />
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">&quot;{review.comment}&quot;</p>
                                </div>
                            ))
                        )}
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

                {/* --- Rules, FAQ, About & Contact Section --- */}
                <div id="rules-faq-section" className="space-y-8 pt-4">
                    
                    {/* House Rules */}
                    {rules.length > 0 && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-100 dark:border-zinc-800">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-primary" />
                                House Rules
                            </h3>
                            <div className="space-y-3">
                                {rules.map((rule) => (
                                    <div key={rule.id} className="flex gap-3">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
                                        <div>
                                            <p className="font-semibold text-sm">{rule.title}</p>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">{rule.details}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* FAQ Section */}
                    {faqs.length > 0 && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-100 dark:border-zinc-800">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <HelpCircle size={20} className="text-primary" />
                                Frequently Asked Questions
                            </h3>
                            <div className="space-y-4">
                                {faqs.map((faq) => (
                                    <div key={faq.id} className="border-b border-slate-100 dark:border-zinc-800 last:border-0 pb-3 last:pb-0">
                                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{faq.question}</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{faq.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* About this home - Moved to bottom */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-100 dark:border-zinc-800">
                        <h3 className="text-lg font-bold mb-3">About this home</h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm text-justify">
                            {houseData.longDescription}
                        </p>
                    </div>

                    {/* Contact Section */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-100 dark:border-zinc-800">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Phone size={20} className="text-primary" />
                            Contact Us
                        </h3>
                        
                        {siteSettings ? (
                            <div className="space-y-4">
                                {/* Quick Contact Buttons */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {siteSettings.whatsapp_number && (
                                        <a 
                                            href={`https://wa.me/${siteSettings.whatsapp_number.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                        >
                                            <MessageCircle size={20} />
                                            <span className="text-xs font-medium">WhatsApp</span>
                                        </a>
                                    )}
                                    {siteSettings.contact_phone && (
                                        <a 
                                            href={`tel:${siteSettings.contact_phone}`}
                                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                        >
                                            <Phone size={20} />
                                            <span className="text-xs font-medium">Call</span>
                                        </a>
                                    )}
                                    {siteSettings.contact_email && (
                                        <a 
                                            href={`mailto:${siteSettings.contact_email}`}
                                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                                        >
                                            <Mail size={20} />
                                            <span className="text-xs font-medium">Email</span>
                                        </a>
                                    )}
                                    <button 
                                        onClick={() => setShowApplyModal(true)}
                                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                    >
                                        <Send size={20} />
                                        <span className="text-xs font-medium">Apply</span>
                                    </button>
                                </div>

                                {/* Contact Details */}
                                <div className="space-y-2 text-sm">
                                    {siteSettings.contact_phone && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <Phone size={14} />
                                            <span>{siteSettings.contact_phone}</span>
                                        </div>
                                    )}
                                    {siteSettings.contact_email && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <Mail size={14} />
                                            <span>{siteSettings.contact_email}</span>
                                        </div>
                                    )}
                                    {siteSettings.whatsapp_number && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <MessageCircle size={14} />
                                            <span>WhatsApp: {siteSettings.whatsapp_number}</span>
                                        </div>
                                    )}
                                    {siteSettings.office_address && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <MapPin size={14} />
                                            <span>{siteSettings.office_address}</span>
                                        </div>
                                    )}
                                    {siteSettings.business_hours && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <Clock size={14} />
                                            <span>{siteSettings.business_hours}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Social Links */}
                                {(siteSettings.facebook_url || siteSettings.instagram_url || siteSettings.twitter_url || siteSettings.youtube_url || siteSettings.tiktok_url || siteSettings.telegram_url) && (
                                    <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
                                        <p className="text-xs font-medium text-slate-500 uppercase mb-3">Follow Us</p>
                                        <div className="flex gap-3">
                                            {siteSettings.facebook_url && (
                                                <a href={siteSettings.facebook_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                                                    <Facebook size={18} />
                                                </a>
                                            )}
                                            {siteSettings.instagram_url && (
                                                <a href={siteSettings.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors">
                                                    <Instagram size={18} />
                                                </a>
                                            )}
                                            {siteSettings.twitter_url && (
                                                <a href={siteSettings.twitter_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors">
                                                    <Twitter size={18} />
                                                </a>
                                            )}
                                            {siteSettings.youtube_url && (
                                                <a href={siteSettings.youtube_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                                                    <Youtube size={18} />
                                                </a>
                                            )}
                                            {siteSettings.tiktok_url && (
                                                <a href={siteSettings.tiktok_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                                    <ExternalLink size={18} />
                                                </a>
                                            )}
                                            {siteSettings.telegram_url && (
                                                <a href={siteSettings.telegram_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-500 hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors">
                                                    <Send size={18} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-slate-500">
                                <p className="text-sm">Contact information not available</p>
                                <p className="text-xs mt-1">Please try again later</p>
                            </div>
                        )}
                    </div>

                </div>

            </div>

            {/* --- Bottom Action Bar --- */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-white/10 p-4 pb-8 z-40">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <div className="hidden sm:flex flex-col">
                        <p className="text-xs text-slate-500 uppercase font-bold">Rent</p>
                        <p className="text-xl font-bold text-primary">KSh {houseData.price.toLocaleString()}<span className="text-sm font-normal text-slate-400">/mo</span></p>
                    </div>

                    <div className="flex gap-3 flex-1 sm:flex-none w-full sm:w-auto">
                        <button 
                            onClick={() => setShowApplyModal(true)}
                            className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-primary text-white font-bold hover:brightness-110 shadow-lg shadow-primary/20 transition-all whitespace-nowrap text-center"
                        >
                            Apply Now
                        </button>
                        <button 
                            onClick={() => alert("We are working on the chat feature. Coming soon!")}
                            className="flex-1 sm:flex-none px-6 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap text-center"
                        >
                            Chat
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Share Modal --- */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Share this property</h3>
                            <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <button onClick={() => handleShare('whatsapp')} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center">
                                    <MessageCircle size={24} />
                                </div>
                                <span className="text-xs font-medium">WhatsApp</span>
                            </button>
                            <button onClick={() => handleShare('facebook')} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                    <Facebook size={24} />
                                </div>
                                <span className="text-xs font-medium">Facebook</span>
                            </button>
                            <button onClick={() => handleShare('twitter')} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center">
                                    <Twitter size={24} />
                                </div>
                                <span className="text-xs font-medium">Twitter</span>
                            </button>
                            <button onClick={() => handleShare('telegram')} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-sky-400 text-white flex items-center justify-center">
                                    <Send size={24} />
                                </div>
                                <span className="text-xs font-medium">Telegram</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <input 
                                type="text" 
                                value={getShareUrl()} 
                                readOnly 
                                className="flex-1 bg-transparent text-sm text-slate-600 dark:text-slate-400 outline-none"
                            />
                            <button 
                                onClick={() => handleShare('copy')}
                                className="p-2 text-primary hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Apply Modal --- */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowApplyModal(false)}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Apply for this Property</h3>
                            <button onClick={() => setShowApplyModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            {houseData.title}
                        </p>
                        <form onSubmit={handleApply} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={applicationForm.fullName}
                                    onChange={(e) => setApplicationForm({...applicationForm, fullName: e.target.value})}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={applicationForm.email}
                                    onChange={(e) => setApplicationForm({...applicationForm, email: e.target.value})}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                                <input
                                    type="tel"
                                    required
                                    value={applicationForm.phone}
                                    onChange={(e) => setApplicationForm({...applicationForm, phone: e.target.value})}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                                    placeholder="+254 700 000 000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Message (Optional)</label>
                                <textarea
                                    rows={3}
                                    value={applicationForm.message}
                                    onChange={(e) => setApplicationForm({...applicationForm, message: e.target.value})}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary resize-none"
                                    placeholder="Tell us why you're interested in this property..."
                                />
                            </div>
                            {submitMessage && (
                                <div className={`p-3 rounded-xl text-sm ${submitMessage.includes('success') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                    {submitMessage}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
