"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Star, Bed, Bath, Move, Heart, MapPin, ArrowRight, X, Send, CheckCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { PropertyApi } from "@/lib/api/domains/properties";
import { ApplicationApi } from "@/lib/api/domains/applications";

// Student-focused listings near Egerton University
const listings = [
    {
        id: 1,
        title: "Modern Student Single Room",
        location: "Njoro, Near Main Gate",
        price: "KSh 6,500",
        beds: 1,
        baths: 1,
        sqft: 180,
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
        badge: "Available",
    },
    {
        id: 2,
        title: "Shared Student Apartment",
        location: "Njokerio, 5min walk",
        price: "KSh 4,500",
        beds: 2,
        baths: 1,
        sqft: 280,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
        badge: "Popular",
    },
    {
        id: 3,
        title: "Cozy Bedsitter",
        location: "Milimani Area",
        price: "KSh 5,500",
        beds: 1,
        baths: 1,
        sqft: 160,
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
        badge: "New",
    },
    {
        id: 4,
        title: "Premium 1-Bedroom Apt",
        location: "Blue Valley Estate",
        price: "KSh 12,000",
        beds: 1,
        baths: 1,
        sqft: 320,
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&q=80",
        badge: "Verified",
    },
    {
        id: 5,
        title: "Affordable Self-Contain",
        location: "Town Center",
        price: "KSh 7,500",
        beds: 1,
        baths: 1,
        sqft: 200,
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
        badge: "Deal",
    },
    {
        id: 6,
        title: "Student Hostel Room",
        location: "Njoro Campus Area",
        price: "KSh 3,500",
        beds: 1,
        baths: 1,
        sqft: 140,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=800&q=80",
        badge: "Budget",
    },
];

const newListings = [
    { id: 101, title: "Njoro Heights", price: "KSh 5,500", location: "Near Campus", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80" },
    { id: 102, title: "Main Gate Flats", price: "KSh 6,000", location: "Main Gate", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80" },
    { id: 103, title: "Njokerio Suite", price: "KSh 7,500", location: "Njokerio", image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&q=80" },
    { id: 104, title: "Milimani House", price: "KSh 8,000", location: "Milimani", image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&q=80" },
    { id: 105, title: "Blue Valley Apt", price: "KSh 10,000", location: "Blue Valley", image: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=400&q=80" },
    { id: 106, title: "Town Center Room", price: "KSh 4,500", location: "Town", image: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400&q=80" },
];

type ListingItem = {
    id: string | number;
    title: string;
    location: string;
    price: string;
    beds: number;
    baths: number;
    sqft: number;
    rating: number;
    image: string;
    badge: string;
    propertyId?: string;
    caretakerId?: string;
};

export const FeaturedListings = () => {
    const [selectedProperty, setSelectedProperty] = useState<ListingItem | null>(null);
    const [dynamicListings, setDynamicListings] = useState<ListingItem[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        async function loadListings() {
            try {
                const [properties, units] = await Promise.all([
                    PropertyApi.getAll(),
                    PropertyApi.getUnits(),
                ]);

                const propertyById = new Map(properties.map((p) => [p.id, p]));
                const mapped = units
                    .filter((u) => u.status === "VACANT")
                    .slice(0, 6)
                    .map((u, idx) => {
                        const property = propertyById.get(u.propertyId);
                        if (!property) return null;
                        return {
                            id: u.id,
                            title: `${property.name} - ${u.type.replaceAll("_", " ")}`,
                            location: property.location,
                            price: `KSh ${Number(u.basePrice).toLocaleString()}`,
                            beds: 1,
                            baths: 1,
                            sqft: 180 + idx * 20,
                            rating: 4.6 + (idx % 4) * 0.1,
                            image: property.logoUrl || listings[idx % listings.length].image,
                            badge: "Available",
                            propertyId: property.id,
                            caretakerId: property.caretakerId,
                        } satisfies ListingItem;
                    })
                    .filter(Boolean) as ListingItem[];

                setDynamicListings(mapped);
            } catch (error) {
                console.error("Failed to load featured listings", error);
            }
        }

        loadListings();
    }, []);

    const handleApply = (property: ListingItem) => {
        setSelectedProperty(property);
        setShowModal(true);
        setShowSuccess(false);
        setSubmitError("");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError("");

        try {
            if (!selectedProperty?.propertyId || !selectedProperty?.caretakerId) {
                throw new Error("Property application target is unavailable. Please refresh and try again.");
            }

            const formData = new FormData(e.currentTarget);
            const preferredDate = formData.get("preferredMoveInDate")?.toString().trim();

            await ApplicationApi.submit({
                propertyId: selectedProperty.propertyId,
                caretakerId: selectedProperty.caretakerId,
                fullName: formData.get("fullName")?.toString().trim() || "",
                email: formData.get("email")?.toString().trim() || "",
                phoneNumber: formData.get("phoneNumber")?.toString().trim() || "",
                whatsappNumber: formData.get("whatsappNumber")?.toString().trim() || undefined,
                universityRegNo: formData.get("universityRegNo")?.toString().trim() || undefined,
                preferredMoveInDate: preferredDate ? new Date(preferredDate).toISOString() : undefined,
                message: formData.get("message")?.toString().trim() || undefined,
            });

            setShowSuccess(true);
            setTimeout(() => {
                setShowModal(false);
                setSelectedProperty(null);
                setShowSuccess(false);
            }, 3000);
        } catch (err: any) {
            setSubmitError(err?.message || "Failed to submit application");
        } finally {
            setIsSubmitting(false);
        }
    };

    const visibleListings = dynamicListings.length > 0 ? dynamicListings : listings;

    return (
        <section className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            <div className="container mx-auto px-4 md:px-6">
                {/* New Listings Carousel */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-16 md:mb-20"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 block">Just Listed</span>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">New This Week</h2>
                        </div>
                        <Link href="/listings" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide -mx-4 px-4">
                        {newListings.map((item) => (
                            <Link key={item.id} href="/listings" className="min-w-[200px] sm:min-w-[240px] group cursor-pointer">
                                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-3 shadow-lg">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <p className="text-white font-semibold text-lg leading-tight">{item.title}</p>
                                        <p className="text-white/80 text-sm font-medium">{item.price}/mo</p>
                                        <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                                            <MapPin size={12} /> {item.location}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* Featured Properties Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-12 gap-4">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="max-w-xl"
                    >
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 block">Featured Properties</span>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
                            Find Your Perfect <br className="hidden sm:block" />
                            <span className="text-gradient">Student Home</span>
                        </h2>
                        <p className="mt-3 text-slate-600 dark:text-slate-400 text-base md:text-lg">
                            Verified listings near Egerton University at affordable prices
                        </p>
                    </motion.div>
                    <Link href="/listings" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-95 sm:w-auto w-full">
                        Browse All Properties
                        <ArrowRight size={18} />
                    </Link>
                </div>

                {/* Property Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleListings.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            viewport={{ once: true }}
                            className="group card-premium overflow-hidden cursor-pointer"
                        >
                            {/* Image */}
                            <div className="relative aspect-[16/11] overflow-hidden">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                {/* Badge */}
                                <div className="absolute top-3 left-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                                        item.badge === "Available" ? "bg-emerald-500 text-white" :
                                        item.badge === "Popular" ? "bg-orange-500 text-white" :
                                        item.badge === "New" ? "bg-blue-500 text-white" :
                                        item.badge === "Deal" ? "bg-red-500 text-white" :
                                        "bg-slate-800 text-white"
                                    }`}>
                                        {item.badge}
                                    </span>
                                </div>

                                {/* Favorite Button */}
                                <button className="absolute top-3 right-3 h-9 w-9 flex items-center justify-center rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 shadow-md transition-all hover:bg-red-50 hover:text-red-500">
                                    <Heart size={18} />
                                </button>

                                {/* Price Overlay */}
                                <div className="absolute bottom-3 left-3">
                                    <span className="px-3 py-1.5 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white rounded-lg font-bold text-sm shadow-md">
                                        {item.price}<span className="text-xs font-normal text-slate-500">/mo</span>
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center gap-1 text-amber-500">
                                        <Star size={14} fill="currentColor" />
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.rating}</span>
                                    </div>
                                    <span className="text-xs text-slate-500">•</span>
                                    <span className="text-sm text-slate-500 flex items-center gap-1">
                                        <MapPin size={12} /> {item.location}
                                    </span>
                                </div>
                                
                                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 group-hover:text-primary transition-colors line-clamp-1">
                                    {item.title}
                                </h3>

                                {/* Property Stats */}
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                        <Bed size={16} className="text-primary" />
                                        <span className="text-sm font-medium">{item.beds}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                        <Bath size={16} className="text-primary" />
                                        <span className="text-sm font-medium">{item.baths}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                        <Move size={16} className="text-primary" />
                                        <span className="text-sm font-medium">{item.sqft} ft²</span>
                                    </div>
                                </div>

                                {/* Apply Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleApply(item);
                                    }}
                                    className="mt-3 w-full py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <Send size={16} />
                                    Apply / Show Interest
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-12 md:mt-16 text-center"
                >
                    <Link href="/listings" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-base hover:scale-105 transition-all shadow-xl shadow-slate-900/20 dark:shadow-white/20">
                        View All Properties
                        <ArrowRight size={18} />
                    </Link>
                </motion.div>
            </div>

            {/* Application Modal */}
            <AnimatePresence>
                {showModal && selectedProperty && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        >
                            {showSuccess ? (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Application Submitted!</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                                        The caretaker will review your application and contact you soon.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Apply for Property</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{selectedProperty.title}</p>
                                        </div>
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            <X size={20} className="text-slate-500" />
                                        </button>
                                    </div>
                                    
                                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                        {submitError && (
                                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                {submitError}
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                                Full Name *
                                            </label>
                                            <input
                                                name="fullName"
                                                type="text"
                                                required
                                                placeholder="Your full name"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                                Email Address *
                                            </label>
                                            <input
                                                name="email"
                                                type="email"
                                                required
                                                placeholder="you@example.com"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                                    Phone *
                                                </label>
                                                <input
                                                    name="phoneNumber"
                                                    type="tel"
                                                    required
                                                    placeholder="+254..."
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                                    WhatsApp
                                                </label>
                                                <input
                                                    name="whatsappNumber"
                                                    type="tel"
                                                    placeholder="+254..."
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                                University Reg. No.
                                            </label>
                                            <input
                                                name="universityRegNo"
                                                type="text"
                                                placeholder="Eg. CT202/001/..."
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                                Preferred Move-in Date
                                            </label>
                                            <input
                                                name="preferredMoveInDate"
                                                type="date"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                                Message to Caretaker
                                            </label>
                                            <textarea
                                                name="message"
                                                rows={3}
                                                placeholder="Tell us about yourself and why you're interested in this property..."
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none"
                                            />
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send size={18} />
                                                        Submit Application
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        
                                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                                            By applying, you agree to our terms. The caretaker will contact you via phone/WhatsApp/email.
                                        </p>
                                    </form>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};
