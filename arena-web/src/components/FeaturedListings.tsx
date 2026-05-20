"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, X, Send, CheckCircle, MapPin, Home, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PropertyApi } from "@/lib/api/domains/properties";
import { ApplicationApi } from "@/lib/api/domains/applications";
import { HouseCard, HouseProps } from "@/components/listings/HouseCard";

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
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (dir: -1 | 1) => {
    carouselRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  };

  useEffect(() => {
    async function loadListings() {
      try {
        const propertiesWithVacancy = await PropertyApi.getPropertiesWithVacancy();

        const mapped: HousePropsWithCaretaker[] = propertiesWithVacancy
          .filter((p) => p.vacantUnits > 0)
          .slice(0, 6)
          .map((p) => ({
            id: p.id,
            title: p.name,
            location: p.location,
            price: p.rentRange.min || 0,
            type: `${p.vacantUnits} rooms available`,
            image: p.logoUrl || `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80`,
            vacancy: "Available",
            water: true,
            isVerified: p.verificationStatus === "VERIFIED",
            verificationStatus: p.verificationStatus,
            availabilityStatus: "AVAILABLE",
            availableRooms: p.vacantUnits,
            totalRooms: p.totalUnits,
            likesCount: p.likes_count || 0,
            propertyId: p.id,
            caretakerId: p.caretakerId,
          }));

        setDynamicListings(mapped);

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const latestProperties = propertiesWithVacancy
          .filter((p) => (p.created_at && new Date(p.created_at) >= oneWeekAgo) || p.vacantUnits > 0)
          .map((p) => ({
            id: p.id,
            title: p.name,
            location: p.location,
            price: `KSh ${p.rentRange.min.toLocaleString()}`,
            image: p.logoUrl || `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80`,
          }))
          .filter((p) => p.id)
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit application";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleListings = dynamicListings;
  /* Application modal opener; same as previous homepage (not wired to cards). */
  void handleApply;

  return (
    <>
      <section className="bg-slate-950 pb-stack-sm pt-stack-lg">
        <div className="mx-auto mb-6 max-w-[1280px] px-4 md:px-10">
          <div className="flex items-end justify-between">
            <div>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-vibrant-blue">
                Just Listed
              </span>
              <h2 className="font-semibold text-[24px] leading-tight text-white md:text-2xl">New This Week</h2>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/listings"
                className="hidden items-center gap-2 text-sm font-semibold text-vibrant-blue transition-colors hover:text-primary-fixed-dim sm:inline-flex"
              >
                View All
                <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                onClick={() => scrollCarousel(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white transition-colors hover:bg-white/10"
                aria-label="Scroll carousel left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel(1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white transition-colors hover:bg-white/10"
                aria-label="Scroll carousel right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1280px] px-4 md:px-10">
          <div
            ref={carouselRef}
            className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-6 hide-scrollbar md:mx-0 md:px-0"
          >
            {loading ? (
              <div className="min-w-[180px] p-6 text-center sm:min-w-[220px]">
                <div className="h-64 animate-pulse rounded-2xl bg-slate-800" />
              </div>
            ) : newThisWeek.length === 0 ? (
              <div className="min-w-[180px] rounded-2xl border border-slate-700 bg-slate-800/50 p-6 text-center text-slate-400 sm:min-w-[220px]">
                No new listings this week
              </div>
            ) : (
              newThisWeek.map((item) => (
                <div
                  key={item.id}
                  className="group min-w-[180px] overflow-hidden rounded-2xl border border-white/5 bg-surface-navy/30 md:min-w-[240px]"
                >
                  <Link href={`/listings/${item.id}`} className="block">
                    <div className="relative aspect-[4/3]">
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                      <div className="absolute right-2 top-2">
                        <span className="rounded-full bg-vibrant-blue px-2 py-0.5 text-[8px] font-bold uppercase text-white">
                          New
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="mb-1 truncate text-xs font-semibold text-white">{item.title}</h4>
                      <p className="mb-2 text-[10px] font-bold text-vibrant-blue">{item.price}</p>
                      <p className="mb-2 line-clamp-1 text-[10px] text-white/60">
                        <MapPin className="mr-0.5 inline h-3 w-3" aria-hidden />
                        {item.location}
                      </p>
                      <span className="flex w-full items-center justify-center rounded-lg bg-white/5 py-1.5 text-[10px] font-bold text-white transition-colors group-hover:bg-vibrant-blue">
                        Details
                      </span>
                    </div>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-12 md:py-stack-lg">
        <div className="mx-auto mb-stack-md max-w-[1280px] px-4 md:px-10">
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-accent">
            Premium Listings
          </span>
          <span className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-vibrant-blue">
            <span className="h-2 w-2 rounded-full bg-vibrant-blue" />
            Featured Properties
          </span>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-bold leading-tight text-white text-[24px] md:text-[32px] md:leading-tight">
                Find Your Perfect <span className="text-vibrant-blue">Student Home</span>
              </h2>
              <p className="mt-2 max-w-xl text-sm text-slate-400 md:text-base">
                Verified listings near Egerton University with transparent pricing
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/listings"
                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-vibrant-blue px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-vibrant-blue/25 transition-all hover:bg-primary-marketing active:scale-95 sm:w-auto"
              >
                Browse All
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="mx-auto max-w-[1280px] px-4 md:px-10">
          <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-3">
            {loading ? (
              [...Array(6)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="mb-4 aspect-[4/3] rounded-2xl bg-slate-700/50 md:rounded-[32px]" />
                  <div className="mb-2 h-4 w-3/4 rounded bg-slate-700/50" />
                  <div className="h-3 w-1/2 rounded bg-slate-700/50" />
                </div>
              ))
            ) : visibleListings.length === 0 ? (
              <div className="col-span-full py-16 text-center">
                <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
                  <Home size={24} className="text-slate-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">No properties available</h3>
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 flex justify-center pb-8 md:mt-16"
          >
            <Link
              href="/listings"
              className="group relative animate-bounce-slow overflow-hidden rounded-xl bg-vibrant-blue px-8 py-4 text-sm font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-vibrant-blue/40 active:scale-95 md:rounded-2xl md:px-12 md:py-6 md:text-lg"
            >
              <span className="relative z-10 flex items-center gap-2 md:gap-4">
                View All Properties
                <ArrowRight className="transition-transform group-hover:translate-x-2" size={20} />
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_2s_infinite]" />
            </Link>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {showModal && selectedProperty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#C9B37F]/20 bg-[#F8F5F0] shadow-2xl shadow-[#0F172A]/10 dark:border-slate-700 dark:bg-slate-900"
            >
              {showSuccess ? (
                <div className="p-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <CheckCircle size={32} className="text-vibrant-blue dark:text-primary-fixed-dim" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Application Submitted!</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    The caretaker will review your application and contact you soon.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-700">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Apply for Property</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{selectedProperty.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X size={20} className="text-slate-500" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 p-6">
                    {submitError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                        {submitError}
                      </div>
                    )}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Full Name *
                      </label>
                      <input
                        name="fullName"
                        type="text"
                        required
                        placeholder="Your full name"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-vibrant-blue focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Email Address *
                      </label>
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-vibrant-blue focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Phone *
                        </label>
                        <input
                          name="phoneNumber"
                          type="tel"
                          required
                          placeholder="+254..."
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-vibrant-blue focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          WhatsApp
                        </label>
                        <input
                          name="whatsappNumber"
                          type="tel"
                          placeholder="+254..."
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-vibrant-blue focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        University Reg. No.
                      </label>
                      <input
                        name="universityRegNo"
                        type="text"
                        placeholder="Eg. CT202/001/..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-vibrant-blue focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Preferred Move-in Date
                      </label>
                      <input
                        name="preferredMoveInDate"
                        type="date"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-vibrant-blue focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Message to Caretaker
                      </label>
                      <textarea
                        name="message"
                        rows={3}
                        placeholder="Tell us about yourself and why you're interested in this property..."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-vibrant-blue focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-vibrant-blue py-3 font-semibold text-white transition-all hover:bg-primary-marketing active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
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

                    <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                      By applying, you agree to our terms. The caretaker will contact you via phone/WhatsApp/email.
                    </p>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
