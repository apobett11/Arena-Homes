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
    ArrowRightCircle, XCircle, Info, ExternalLink,
    Ruler, Car, Zap, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HouseCard, HouseProps } from "@/components/listings/HouseCard";
import { PropertyApi } from "@/lib/api/domains/properties";
import type { Property } from "@/lib/api/domains/properties";
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
    user_id: string;
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

// Helper functions for formatting display values
const formatMoney = (amount: number | null | undefined): string => {
    if (!amount || amount <= 0) return '0';
    return `KES ${amount.toLocaleString()}`;
};

const formatElectricity = (value: string | null | undefined): string => {
    if (!value) return 'Not specified';
    const normalized = value.toUpperCase().replace(/[_\s-]/g, '_');
    if (normalized.includes('PERSONAL') || normalized.includes('SELF')) return 'Personal payment';
    if (normalized.includes('COVERED') || normalized.includes('INCLUDED')) return 'Covered';
    return value;
};

const formatWaterDays = (days: number | null | undefined): string => {
    if (!days || days <= 0) return 'Not specified';
    return `${days} day${days > 1 ? 's' : ''}/week`;
};

const formatRoomDimensions = (sqm: number | null | undefined): { display: string; area: string } | null => {
    if (!sqm || sqm <= 0) return null;
    const side = Math.sqrt(sqm);
    return {
        display: `approx ${side.toFixed(1)}m × ${side.toFixed(1)}m`,
        area: `${sqm} m²`
    };
};

const formatGateHours = (open: string | null | undefined, close: string | null | undefined): string => {
    if (!open || !close) return 'Not specified';

    const to12Hour = (time: string): string => {
        const [hours, minutes] = time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return time;
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return `${to12Hour(open)} - ${to12Hour(close)}`;
};

const formatDistance = (meters: number | null | undefined, km: number | null | undefined): string => {
    // Temporarily showing 'Not available' - will be calculated from coordinates in future
    return 'Not available';
};

const hasDeposit = (amount: number | null | undefined): boolean => {
    return !!amount && amount > 0;
};

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
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
    const [activeTab, setActiveTab] = useState<'faq' | 'rules'>('faq');
    const [relatedProperties, setRelatedProperties] = useState<Property[]>([]);

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

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadListing() {
            // Guard against invalid IDs
            if (!id || id === "undefined" || id === "null") {
                console.error("Invalid property ID:", id);
                setError("Invalid property ID. Please check the URL and try again.");
                setLoading(false);
                return;
            }
            
            try {
                const supabase = getSupabaseClient();
                
                // Load property by PROPERTY ID (from URL param)
                const property = await PropertyApi.getOne(id);
                setPropertyId(property.id);

                // Load units for this property to get vacancy info and pricing
                const units = await PropertyApi.getUnits(id);
                const vacantUnit = units.find(u => u.status === 'VACANT');
                const firstUnit = units[0];
                const representativeUnit = vacantUnit || firstUnit;

                // Get price from first available unit, or default
                const price = representativeUnit ? Number(representativeUnit.basePrice) : (property.monthlyRent || 0);
                const image = property.coverPhotoUrl || property.logoUrl || defaultHouseData.images[0];
                const typeLabel = representativeUnit ? representativeUnit.type.replaceAll("_", " ") : (property.propertyType || 'Unit');
                const policies = property.facilities?.policies || [];
                const map = property.facilities?.map;

                // Extract caretaker info first
                const caretakerInfo = property.caretaker ? {
                    id: property.caretaker.id,
                    user_id: property.caretaker.user_id,
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

                // Build amenities with new fields
                const roomDimensions = formatRoomDimensions(property.roomSpaceSqm);

                setHouseData({
                    id: property.id, // Use PROPERTY ID
                    title: `${property.name} - ${typeLabel}`,
                    location: property.location,
                    price,
                    description: property.description || representativeUnit?.description || `A ${typeLabel} unit at ${property.name} located in ${property.location}.`,
                    longDescription: property.description || representativeUnit?.description || `This is a ${typeLabel} unit located at ${property.name} in ${property.location}. Contact the caretaker for more details and to schedule a viewing.`,
                    rating: 0,
                    reviewCount: 0,
                    images: [image, property.coverPhotoUrl || property.logoUrl || image, property.logoUrl || image, image],
                    amenities: [
                        // Deposit
                        hasDeposit(property.depositAmount)
                            ? { icon: Banknote, label: "Deposit", value: formatMoney(property.depositAmount) }
                            : { icon: Banknote, label: "Deposit", value: "No deposit required" },
                        // Deposit Cashback (automated Yes if deposit exists)
                        { icon: CheckCircle2, label: "Deposit Cashback", value: hasDeposit(property.depositAmount) ? "Yes" : "No" },
                        // Water Source
                        { icon: Droplets, label: "Water Source", value: property.waterSource || "Not specified" },
                        // Water Availability
                        { icon: Calendar, label: "Water Available", value: formatWaterDays(property.waterAvailabilityDaysPerWeek) },
                        // Electricity
                        { icon: Zap, label: "Electricity", value: formatElectricity(property.electricityPayment) },
                        // Room Dimensions
                        roomDimensions
                            ? { icon: Ruler, label: "Room Dimensions", value: roomDimensions.display }
                            : { icon: Ruler, label: "Room Dimensions", value: "Not specified" },
                        // Gate Hours
                        { icon: Clock, label: "Gate Hours", value: formatGateHours(property.gateOpenTime, property.gateCloseTime) },
                        // Distance from school
                        { icon: MapPin, label: "Distance from School", value: formatDistance(property.schoolGateDistanceMeters, property.distanceFromSchoolKm) },
                        // Parking
                        property.parkingAvailable
                            ? { icon: Car, label: "Parking", value: "Available" }
                            : { icon: Car, label: "Parking", value: "No Parking" },
                        // Legacy fields (kept for compatibility)
                        { icon: Lock, label: "Gate", value: property.facilities?.map?.gateLabel || "Main gate" },
                        { icon: Home, label: "Owner", value: property.facilities?.ownerType || "Arena Homes" },
                        { icon: User, label: "Caretaker", value: caretakerInfo?.full_name || "Assigned" },
                    ],
                    reviews: [],
                });

                // Load related properties from database
                if (property.propertyType) {
                    try {
                        const related = await PropertyApi.getRelatedProperties(property.id, property.propertyType, 3);
                        setRelatedProperties(related);
                    } catch (err) {
                        console.error("Failed to load related properties:", err);
                        setRelatedProperties([]);
                    }
                }

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

            } catch (err) {
                console.error("Failed to load listing details", err);
                setError(err instanceof Error ? err.message : "Failed to load property details. Please try again later.");
            } finally {
                setLoading(false);
            }
        }

        loadListing();
    }, [id]);

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
        return `${window.location.origin}/listings/${id}`;
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
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation: All required fields must be filled
        if (!applicationForm.fullName || !applicationForm.email || !applicationForm.phone) {
            setSubmitMessage("Please fill in all required fields: Full Name, Email, and Phone Number");
            return;
        }
        
        // Validation: Full name must have at least 2 words (first and last name)
        const nameParts = applicationForm.fullName.trim().split(/\s+/);
        if (nameParts.length < 2) {
            setSubmitMessage("Please provide both first and last name (e.g., 'John Doe')");
            return;
        }
        
        // Validation: Email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(applicationForm.email)) {
            setSubmitMessage("Please provide a valid email address");
            return;
        }
        
        // Validation: Phone number minimum length
        if (applicationForm.phone.trim().length < 8) {
            setSubmitMessage("Please provide a valid phone number");
            return;
        }

        setSubmitting(true);
        setSubmitMessage("");

        try {
            const { ApplicationApi } = await import('@/lib/api/domains/applications');

            // Submit application - ONLY user data, no status field
            // Database automatically sets status to 'WAITING'
            await ApplicationApi.submit({
                propertyId: propertyId!,
                fullName: applicationForm.fullName.trim(),
                email: applicationForm.email.trim().toLowerCase(),
                phoneNumber: applicationForm.phone.trim(),
                message: applicationForm.message?.trim() || undefined,
            });

            // Show success modal instead of inline message
            setShowApplyModal(false);
            setShowSuccessModal(true);
            setApplicationForm({ fullName: "", email: "", phone: "", message: "" });
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

            {/* Error State */}
            {error && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-black p-4">
                    <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-zinc-800 text-center">
                        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle size={32} className="text-rose-600 dark:text-rose-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Unable to Load Property</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
                        <div className="flex gap-3 justify-center">
                            <Link 
                                href="/listings" 
                                className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:brightness-110 transition-all"
                            >
                                Browse Listings
                            </Link>
                            <button 
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
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

                {/* 1. Name, Location and Price */}
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
                        <span className="text-3xl font-bold text-primary">KSh {houseData.price.toLocaleString()}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">/ month</span>
                    </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-zinc-800" />

                {/* 2. Rating Stars (Default 5) and Number of Ratings */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={20}
                                className="text-amber-400 fill-amber-400"
                            />
                        ))}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-900 dark:text-white">5.0</span>
                        <span className="mx-1">•</span>
                        <span>{reviews.length > 0 ? reviews.length : 'No'} ratings</span>
                    </div>
                </div>

                {/* 3. Amenities & Policies - Glassmorphism Card */}
                <div className="rounded-2xl p-6 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-white/20 dark:border-zinc-700/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                    <h3 className="text-lg font-bold mb-4">Amenities & Policies</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {houseData.amenities.map((amenity, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm border border-slate-100/50 dark:border-zinc-700/30 shadow-sm">
                                <div className="p-2 bg-slate-100/80 dark:bg-zinc-700/50 rounded-full text-slate-700 dark:text-slate-200">
                                    <amenity.icon size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{amenity.label}</p>
                                    <p className="text-sm font-semibold">{amenity.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Security Verified Badge */}
                <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 rounded-xl text-sm font-bold border border-emerald-100 dark:border-emerald-800/30">
                    <ShieldCheck size={18} />
                    Security Verified
                </div>

                {/* 5. Fulfilled by Arena Homes Banner */}
                <div className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-center shadow-lg">
                    <div className="flex items-center justify-center gap-2">
                        <ShieldCheck size={20} />
                        <span className="font-bold text-lg">Fulfilled by: Arena Homes</span>
                    </div>
                    <p className="text-blue-100 text-sm mt-1">Trusted property management and tenant services</p>
                </div>

                {/* 6. Caretaker Details Card */}
                {caretaker && (
                    <div className="rounded-2xl p-5 bg-gradient-to-br from-slate-50 to-white dark:from-zinc-800 dark:to-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-md">
                        <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                            <User size={18} className="text-blue-500" />
                            Caretaker Details
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 min-w-[60px]">Name:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-100">{caretaker.full_name}</span>
                            </div>
                            {caretaker.email && (
                                <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-slate-400" />
                                    <span className="text-slate-500 min-w-[50px]">Email:</span>
                                    <a href={`mailto:${caretaker.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                                        {caretaker.email}
                                    </a>
                                </div>
                            )}
                            {caretaker.phone_number && (
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-slate-400" />
                                    <span className="text-slate-500 min-w-[50px]">Phone:</span>
                                    <a href={`tel:${caretaker.phone_number}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                                        {caretaker.phone_number}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 7. Reviews and Comments */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold">Reviews & Comments</h3>
                        <Link href={`/listings/${houseData.id}/reviews`} className="text-primary text-sm font-bold hover:underline">
                            {reviews.length > 0 ? 'View all' : 'Write a review'}
                        </Link>
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

                {/* 6. FAQ and Rules - Side by side, swipeable on mobile */}
                <div id="rules-faq-section">
                    {/* Mobile Tab Switcher */}
                    <div className="lg:hidden flex gap-2 mb-4">
                        <button
                            onClick={() => setActiveTab('faq')}
                            className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                                activeTab === 'faq'
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-zinc-800'
                            }`}
                        >
                            FAQ
                        </button>
                        <button
                            onClick={() => setActiveTab('rules')}
                            className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                                activeTab === 'rules'
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-zinc-800'
                            }`}
                        >
                            Rules
                        </button>
                    </div>

                    <div className="lg:grid lg:grid-cols-2 lg:gap-6">
                        {/* FAQ Column */}
                        <div className={`${activeTab !== 'faq' ? 'hidden lg:block' : ''}`}>
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-100 dark:border-zinc-800 h-full">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <HelpCircle size={20} className="text-primary" />
                                    Frequently Asked Questions
                                </h3>
                                {faqs.length > 0 ? (
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                        {faqs.map((faq) => (
                                            <div key={faq.id} className="border-b border-slate-100 dark:border-zinc-800 last:border-0 pb-3 last:pb-0">
                                                <p className="font-semibold text-sm text-slate-900 dark:text-white">{faq.question}</p>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{faq.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No FAQs available for this property.</p>
                                )}
                            </div>
                        </div>

                        {/* Rules Column */}
                        <div className={`${activeTab !== 'rules' ? 'hidden lg:block' : ''}`}>
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-100 dark:border-zinc-800 h-full">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <FileText size={20} className="text-primary" />
                                    House Rules
                                </h3>
                                {rules.length > 0 ? (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
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
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No rules specified for this property.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 8. About this home */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-100 dark:border-zinc-800">
                    <h3 className="text-lg font-bold mb-3">About this home</h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm text-justify">
                        {houseData.longDescription}
                    </p>
                </div>

                {/* 9. Similar Homes - Fetched from database */}
                <div>
                    <h3 className="text-lg font-bold mb-4">Similar Homes</h3>
                    <div className="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6 scrollbar-hide">
                        {relatedProperties.length > 0 ? (
                            relatedProperties.map((property) => (
                                <div key={property.id} className="min-w-[200px] sm:min-w-[240px]">
                                    <HouseCard
                                        id={property.id}
                                        image={property.coverPhotoUrl || property.logoUrl || `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80`}
                                        location={property.location || "Near Campus"}
                                        title={property.name}
                                        price={property.monthlyRent || 0}
                                        type={property.propertyType || "Unit"}
                                        distance={property.schoolGateDistanceMeters ? `${(property.schoolGateDistanceMeters / 1000).toFixed(1)}km` : "Near Campus"}
                                        vacancy="Available"
                                        water={true}
                                        isVerified={true}
                                        verificationStatus={property.verificationStatus}
                                        depositAmount={property.depositAmount || undefined}
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="min-w-full p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 text-center">
                                <p className="text-sm text-slate-500 dark:text-slate-400">No similar homes found.</p>
                            </div>
                        )}
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

                {/* 9. Contact Section */}
                <div id="contact-section" className="pt-4">

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
            <div className="fixed bottom-0 left-0 right-0 bg-blue-600 dark:bg-blue-700 border-t border-blue-500 dark:border-blue-600 p-4 pb-8 z-40 shadow-lg shadow-blue-500/30">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <div className="hidden sm:flex flex-col">
                        <p className="text-xs text-blue-100 uppercase font-bold">Rent</p>
                        <p className="text-xl font-bold text-white">KSh {houseData.price.toLocaleString()}<span className="text-sm font-normal text-blue-200">/mo</span></p>
                    </div>

                    <div className="flex gap-3 flex-1 sm:flex-none w-full sm:w-auto">
                        <button
                            onClick={() => setShowApplyModal(true)}
                            className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-white text-blue-600 font-bold hover:bg-blue-50 shadow-lg transition-all whitespace-nowrap text-center"
                        >
                            Apply Now
                        </button>
                        <button
                            onClick={() => alert("We are working on the chat feature. Coming soon!")}
                            className="flex-1 sm:flex-none px-6 py-3 rounded-xl border-2 border-blue-300 text-white font-bold hover:bg-blue-500 transition-colors whitespace-nowrap text-center"
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
                                className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Success Modal --- */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowSuccessModal(false)}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 w-full max-w-md text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Application Submitted!</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                            Your application has been submitted. You will be approved and contacted by the tenant for the site visit and move in.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:brightness-110 transition-all"
                            >
                                Keep Browsing
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
