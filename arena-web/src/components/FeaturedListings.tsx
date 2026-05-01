"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, X, Send, CheckCircle, MapPin, Home } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { PropertyApi } from "@/lib/api/domains/properties";
import { ApplicationApi } from "@/lib/api/domains/applications";
import { HouseCard, HouseProps } from "@/components/listings/HouseCard";

// Extended type for application modal that includes caretaker info
type HousePropsWithCaretaker = HouseProps & {
    propertyId?: string;
    caretakerId?: string;
};

type NewListingItem = {
    id: string;
    title: string;
    location: string;
    price: string;
    image: string;
};

export const FeaturedListings = () => {
    const [selectedProperty, setSelectedProperty] = useState<HousePropsWithCaretaker | null>(null);
    const [dynamicListings, setDynamicListings] = useState<HousePropsWithCaretaker[]>([]);
    const [newThisWeek, setNewThisWeek] = useState<NewListingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        async function loadListings() {
            try {
                // Get properties with vacancy info - this already filters for vacant units > 0
                const propertiesWithVacancy = await PropertyApi.getPropertiesWithVacancy();
                
                // Map PROPERTIES to HouseProps - using PROPERTY ID for navigation
                // This matches the detail page which expects property ID
                const mapped: HousePropsWithCaretaker[] = propertiesWithVacancy
                    .filter((p) => p.vacantUnits > 0) // Only show properties with vacant units
                    .slice(0, 6)
                    .map((p) => ({
                        id: p.id, // CRITICAL: Use PROPERTY ID for navigation
                        title: p.name,
                        location: p.location,
                        price: p.rentRange.min || 0,
                        type: `${p.vacantUnits} rooms available`,
                        image: p.logoUrl || `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80`,
                        vacancy: "Available",
                        water: true,
                        isVerified: p.verificationStatus === 'VERIFIED',
                        verificationStatus: p.verificationStatus,
                        availabilityStatus: 'AVAILABLE',
                        availableRooms: p.vacantUnits,
                        totalRooms: p.totalUnits,
                        likesCount: p.likes_count || 0,
                        propertyId: p.id,
                        caretakerId: p.caretakerId,
                    }));

                setDynamicListings(mapped);
                
                // New This Week - latest properties with vacancy (sorted by created_at)
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                
                const latestProperties = propertiesWithVacancy
                    .filter(p => (p.created_at && new Date(p.created_at) >= oneWeekAgo) || p.vacantUnits > 0)
                    .map((p) => ({
                        id: p.id, // Use PROPERTY ID
                        title: p.name,
                        location: p.location,
                        price: `KSh ${p.rentRange.min.toLocaleString()}`,
                        image: p.logoUrl || `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80`,
                    }))
                    .filter(p => p.id) // Only include items with valid IDs
                    .slice(0, 6);
                
                setNewThisWeek(latestProperties);
            } catch (error) {
                console.error("Failed to load featured listings", error);
            } finally {
                setLoading(false);
            }
        }

        loadListings();
    }, []);

    const handleApply = (property: HousePropsWithCaretaker) => {
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
            if (!selectedProperty?.propertyId) {
                throw new Error("Property application target is unavailable. Please refresh and try again.");
            }

            const formData = new FormData(e.currentTarget);
            const preferredDate = formData.get("preferredMoveInDate")?.toString().trim();

            await ApplicationApi.submit({
                propertyId: selectedProperty.propertyId,
                caretakerId: null,
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

    const visibleListings = dynamicListings;

    return (
        <section className="py-10 md:py-14 bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* New Listings Carousel */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-8 md:mb-10"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Just Listed
                            </span>
                            <h2 className="text-xl md:text-2xl font-bold text-white">New This Week</h2>
                        </div>
                        <Link href="/listings" className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors group">
                            View All
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                        {loading ? (
                            <div className="min-w-[180px] sm:min-w-[220px] p-6 text-center">
                                <div className="animate-pulse bg-slate-800 rounded-2xl h-64" />
                            </div>
                        ) : newThisWeek.length === 0 ? (
                            <div className="min-w-[180px] sm:min-w-[220px] p-6 text-center text-slate-400 bg-slate-800/50 rounded-2xl border border-slate-700">
                                No new listings this week
                            </div>
                        ) : (
                            newThisWeek.map((item) => (
                                <Link key={item.id} href={`/listings/${item.id}`} className="min-w-[160px] sm:min-w-[200px] group cursor-pointer">
                                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-sm border border-[#EDE9E0] hover:border-[#C9B37F]/50 transition-all duration-300">
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#1F2937]/90 via-[#1F2937]/20 to-transparent" />
                                        <div className="absolute top-2 left-2">
                                            <span className="px-2 py-0.5 rounded-full bg-[#0F172A] text-white text-[10px] font-semibold uppercase tracking-wide">
                                                New
                                            </span>
                                        </div>
                                        <div className="absolute bottom-3 left-3 right-3">
                                            <p className="text-white font-semibold text-sm leading-tight">{item.title}</p>
                                            <p className="text-[#C9B37F] text-xs font-medium">{item.price}/mo</p>
                                            <p className="text-white/80 text-[10px] mt-0.5 flex items-center gap-1">
                                                <MapPin size={10} /> {item.location}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Featured Properties Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 gap-4">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="max-w-xl"
                    >
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-400">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Featured Properties
                        </span>
                        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                            Find Your Perfect <span className="text-blue-400">Student Home</span>
                        </h2>
                        <p className="mt-2 text-slate-400 text-sm md:text-base">
                            Verified listings near Egerton University with transparent pricing
                        </p>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Link href="/listings" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95 sm:w-auto w-full shrink-0 text-sm">
                            Browse All
                            <ArrowRight size={16} />
                        </Link>
                    </motion.div>
                </div>

                {/* Property Grid Container - Glassmorphism with white hue */}
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-3xl p-4 md:p-6 border-b-2 border-white/30 shadow-lg shadow-black/5">
                    {/* Property Grid - 2 columns on mobile for smaller cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {loading ? (
                            // Loading skeleton
                            [...Array(6)].map((_, index) => (
                                <div key={index} className="animate-pulse">
                                    <div className="aspect-[4/3] bg-slate-700/50 rounded-2xl mb-4" />
                                    <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-slate-700/50 rounded w-1/2" />
                                </div>
                            ))
                        ) : visibleListings.length === 0 ? (
                            <div className="col-span-full text-center py-16">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                                    <Home size={24} className="text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">No properties available</h3>
                                <p className="text-slate-400">Check back soon for new listings</p>
                            </div>
                        ) : (
                            visibleListings.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    viewport={{ once: true }}
                                    className="min-w-0"
                                >
                                    <HouseCard {...item} />
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* CTA - View All Properties Button with Styled Container */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-8 md:mt-10"
                    >
                        <div className="flex justify-center">
                            <motion.div
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-gradient-to-r from-blue-600/20 to-blue-400/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-1 shadow-lg shadow-blue-500/10"
                            >
                                <Link href="/listings" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25">
                                    View All Properties
                                    <ArrowRight size={18} />
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
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
                            className="bg-[#F8F5F0] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-[#0F172A]/10 border border-[#C9B37F]/20"
                        >
                            {showSuccess ? (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle size={32} className="text-blue-600 dark:text-blue-400" />
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
