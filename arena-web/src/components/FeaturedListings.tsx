"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, X, Send, CheckCircle, MapPin } from "lucide-react";
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
                
                // Get units to create detailed listings
                const units = await PropertyApi.getUnits();
                
                const propertyById = new Map(propertiesWithVacancy.map((p) => [p.id, p]));
                
                // Map units to HouseProps - only show VACANT units from properties with vacancy
                const mapped: HouseProps[] = units
                    .filter((u) => u.status === "VACANT" && propertyById.has(u.propertyId))
                    .slice(0, 6)
                    .map((u, idx) => {
                        const property = propertyById.get(u.propertyId);
                        if (!property) return null;
                        return {
                            id: u.id,
                            title: `${property.name} - ${u.type.replaceAll("_", " ")}`,
                            location: property.location,
                            price: Number(u.basePrice) || 0,
                            type: `${property.vacantUnits} rooms available`,
                            image: property.logoUrl || `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80`,
                            vacancy: "Available",
                            water: true,
                            isVerified: property.verificationStatus === 'VERIFIED',
                            verificationStatus: property.verificationStatus,
                            availabilityStatus: 'AVAILABLE',
                            availableRooms: property.vacantUnits,
                            totalRooms: property.totalUnits,
                            likesCount: property.likes_count || 0,
                            propertyId: property.id,
                            caretakerId: property.caretakerId,
                        } as HousePropsWithCaretaker;
                    })
                    .filter(Boolean) as HousePropsWithCaretaker[];

                setDynamicListings(mapped);
                
                // New This Week - latest properties with vacancy (sorted by created_at)
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                
                // Create a map of property ID to first vacant unit for linking
                const unitsByPropertyId = new Map<string, typeof units[0]>();
                units.filter(u => u.status === "VACANT").forEach(u => {
                    if (!unitsByPropertyId.has(u.propertyId)) {
                        unitsByPropertyId.set(u.propertyId, u);
                    }
                });
                
                const latestProperties = propertiesWithVacancy
                    .filter(p => (p.created_at && new Date(p.created_at) >= oneWeekAgo) || p.vacantUnits > 0)
                    .map((p, idx) => {
                        // Get a vacant unit for this property to use as the link ID
                        const unitForLink = unitsByPropertyId.get(p.id);
                        return {
                            id: unitForLink?.id || p.id, // Use unit ID if available, fallback to property ID
                            title: p.name,
                            location: p.location,
                            price: unitForLink ? `KSh ${Number(unitForLink.basePrice).toLocaleString()}` : `KSh ${p.rentRange.min.toLocaleString()}`,
                            image: p.logoUrl || `https://images.unsplash.com/photo-${[
                                '1522708323590-d24dbb6b0267',
                                '1502672260266-1c1ef2d93688',
                                '1493809842364-78817add7ffb'
                            ][idx % 3]}?w=400&q=80`,
                        };
                    })
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

    const visibleListings = dynamicListings;

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

                    <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide -mx-4 px-4">
                        {loading ? (
                            <div className="min-w-[160px] sm:min-w-[200px] p-4 text-center text-slate-400">Loading...</div>
                        ) : newThisWeek.length === 0 ? (
                            <div className="min-w-[160px] sm:min-w-[200px] p-4 text-center text-slate-400">No new listings this week</div>
                        ) : (
                            newThisWeek.map((item) => (
                                <Link key={item.id} href="/listings" className="min-w-[160px] sm:min-w-[200px] group cursor-pointer">
                                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden mb-2 shadow-lg">
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                        <div className="absolute bottom-3 left-3 right-3">
                                            <p className="text-white font-semibold text-sm leading-tight">{item.title}</p>
                                            <p className="text-white/80 text-xs font-medium">{item.price}/mo</p>
                                            <p className="text-white/60 text-[10px] mt-0.5 flex items-center gap-1">
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

                {/* Property Grid - Using HouseCard from listings page - 2 cols on mobile */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                    {visibleListings.map((item, index) => (
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
