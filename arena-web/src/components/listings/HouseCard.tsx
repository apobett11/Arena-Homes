"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Heart, MapPin, Droplets, Home, Footprints, ArrowRight, ShieldCheck, Zap, Shield, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabase/client";

export interface HouseProps {
    id: string | number;
    image: string;
    location: string;
    title: string;
    price: number;
    type: string;
    distance?: string;
    vacancy?: "Available" | "Limited" | "Reserved" | "Occupied" | "Under Maintenance";
    water?: boolean;
    // Trust signals
    isVerified?: boolean;
    verificationStatus?: string;
    availabilityStatus?: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'UNDER_MAINTENANCE' | 'UNAVAILABLE';
    depositAmount?: number;
    walkingTimeMinutes?: number | null;
    lastUpdated?: string;
    amenities?: {
        water?: boolean;
        electricity?: boolean;
        security?: boolean;
        internet?: boolean;
    };
    // New fields
    availableRooms?: number;
    totalRooms?: number;
    likesCount?: number;
}

export const HouseCard = ({
    id,
    image,
    location,
    title,
    price,
    type,
    distance = "Near Campus",
    vacancy = "Available",
    water = true,
    isVerified = false,
    verificationStatus,
    availabilityStatus,
    depositAmount,
    walkingTimeMinutes,
    lastUpdated,
    amenities,
    availableRooms,
    totalRooms,
    likesCount: initialLikesCount = 0
}: HouseProps) => {
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(initialLikesCount);
    const [isLoading, setIsLoading] = useState(false);

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading) return;
        setIsLoading(true);

        try {
            const supabase = getSupabaseClient();

            // Toggle like status
            if (isLiked) {
                // Unlike
                setLikesCount(prev => Math.max(0, prev - 1));
                setIsLiked(false);
            } else {
                // Like
                setLikesCount(prev => prev + 1);
                setIsLiked(true);
            }

            // TODO: Call API to persist like (would need user authentication)
            // For now, we just update the UI state
        } catch (error) {
            console.error("Failed to toggle like:", error);
            // Revert on error
            setLikesCount(initialLikesCount);
            setIsLiked(false);
        } finally {
            setIsLoading(false);
        }
    };
    // Determine badge color based on availability
    const getAvailabilityBadge = () => {
        const status = availabilityStatus || (vacancy === "Available" ? 'AVAILABLE' : 'OCCUPIED');
        switch (status) {
            case 'AVAILABLE':
                return { text: "Available", class: "bg-blue-500 text-white" };
            case 'RESERVED':
                return { text: "Reserved", class: "bg-amber-500 text-white" };
            case 'OCCUPIED':
                return { text: "Occupied", class: "bg-slate-500 text-white" };
            case 'UNDER_MAINTENANCE':
                return { text: "Maintenance", class: "bg-rose-500 text-white" };
            default:
                return { text: vacancy, class: "bg-blue-500 text-white" };
        }
    };

    const badge = getAvailabilityBadge();
    const displayDistance = walkingTimeMinutes 
        ? `${walkingTimeMinutes} min walk` 
        : distance;
    
    // Show available rooms text
    const availableRoomsText = availableRooms !== undefined 
        ? `${availableRooms} room${availableRooms !== 1 ? 's' : ''} avail.`
        : vacancy;

    // Format last updated
    const getLastUpdatedText = () => {
        if (!lastUpdated) return null;
        const date = new Date(lastUpdated);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return "Updated today";
        if (diffDays === 1) return "Updated yesterday";
        if (diffDays < 7) return `Updated ${diffDays} days ago`;
        return `Updated ${date.toLocaleDateString()}`;
    };

    // Guard against invalid IDs
    const validId = id && id !== "undefined" && id !== "null" ? String(id) : null;
    
    if (!validId) {
        return (
            <div className="block group h-full cursor-not-allowed opacity-60">
                <div className="bg-slate-900 h-full flex flex-col overflow-hidden rounded-xl border-2 border-slate-700 shadow-xl shadow-black/30">
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-800 flex items-center justify-center">
                        <span className="text-slate-500 text-sm">Property not available</span>
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                        <h3 className="text-slate-300 text-sm font-bold mb-1">{title || "Unknown"}</h3>
                        <p className="text-xs text-slate-500">Please try again later</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Link href={`/listings/${validId}`} className="block group h-full">
            <motion.div
                whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
                whileTap={{ scale: 0.98 }}
                className="bg-slate-900 h-full flex flex-col overflow-hidden rounded-xl cursor-pointer border-2 border-slate-700 shadow-xl shadow-black/30 hover:border-slate-600 transition-all duration-300"
            >
                {/* Image Section */}
                <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                        {/* Available Rooms Badge */}
                        {availableRooms !== undefined && availableRooms > 0 && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-blue-500 text-white shadow-lg">
                                {availableRoomsText}
                            </span>
                        )}
                        {/* Verified Badge */}
                        {(isVerified || verificationStatus === 'VERIFIED') && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-blue-500 text-white flex items-center gap-1 shadow-lg">
                                <ShieldCheck size={10} />
                                Verified
                            </span>
                        )}
                    </div>

                    {/* Favorite Button with Count - Reactive */}
                    <motion.button
                        onClick={handleLike}
                        whileTap={{ scale: 0.9 }}
                        disabled={isLoading}
                        className={cn(
                            "absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all shadow-lg backdrop-blur-sm",
                            isLiked
                                ? "bg-rose-500 text-white hover:bg-rose-600"
                                : "bg-slate-800/90 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400"
                        )}
                    >
                        <Heart
                            size={14}
                            className={cn(
                                "transition-all",
                                isLiked && "fill-current"
                            )}
                        />
                        <span className="text-xs font-semibold">{likesCount}</span>
                    </motion.button>

                    {/* Price Badge */}
                    <div className="absolute bottom-3 left-3">
                        <span className="px-3 py-1.5 bg-slate-900/95 text-white rounded-lg font-bold text-sm shadow-lg border border-slate-700">
                            KSh {price.toLocaleString()}<span className="text-xs font-normal text-slate-400">/mo</span>
                        </span>
                    </div>
                </div>

                {/* Content - Dark Theme */}
                <div className="p-3 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Home size={14} className="text-blue-400" />
                            <span className="text-xs font-medium">{type}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-xs">
                            <Footprints size={12} />
                            {displayDistance}
                        </div>
                    </div>

                    <h3 className="card-title text-sm mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">
                        {title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-2">
                        <MapPin size={12} className="text-blue-400" />
                        {location}
                    </div>

                    {/* Amenities Row - Dark Theme */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {(amenities?.water || water) && (
                            <div className="flex items-center gap-1 text-blue-300 text-[10px] font-medium bg-blue-500/20 px-1.5 py-0.5 rounded">
                                <Droplets size={8} />
                                <span>Water</span>
                            </div>
                        )}
                        {amenities?.electricity && (
                            <div className="flex items-center gap-1 text-amber-300 text-[10px] font-medium bg-amber-500/20 px-1.5 py-0.5 rounded">
                                <Zap size={8} />
                                <span>Power</span>
                            </div>
                        )}
                        {amenities?.security && (
                            <div className="flex items-center gap-1 text-blue-300 text-[10px] font-medium bg-blue-500/20 px-1.5 py-0.5 rounded">
                                <Shield size={8} />
                                <span>Secure</span>
                            </div>
                        )}
                        {amenities?.internet && (
                            <div className="flex items-center gap-1 text-cyan-300 text-[10px] font-medium bg-cyan-500/20 px-1.5 py-0.5 rounded">
                                <Wifi size={8} />
                                <span>WiFi</span>
                            </div>
                        )}
                    </div>

                    {/* Deposit Info */}
                    {depositAmount && depositAmount > 0 && (
                        <div className="text-[10px] text-slate-400 mb-1">
                            Deposit: KSh {depositAmount.toLocaleString()}
                        </div>
                    )}

                    {/* Last Updated */}
                    {getLastUpdatedText() && (
                        <div className="text-[9px] text-slate-500 mb-1">
                            {getLastUpdatedText()}
                        </div>
                    )}

                    {/* CTA */}
                    <div className="mt-auto pt-2 border-t border-slate-700/50 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400 group-hover:text-blue-400 transition-colors">
                            View Details
                        </span>
                        <motion.div 
                            whileHover={{ scale: 1.1 }}
                            className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-400"
                        >
                            <ArrowRight size={12} />
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};
