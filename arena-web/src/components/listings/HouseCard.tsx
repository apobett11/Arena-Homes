"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Droplets, Home, Footprints, ArrowRight, ShieldCheck, Zap, Shield, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

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
    likesCount = 0
}: HouseProps) => {
    // Determine badge color based on availability
    const getAvailabilityBadge = () => {
        const status = availabilityStatus || (vacancy === "Available" ? 'AVAILABLE' : 'OCCUPIED');
        switch (status) {
            case 'AVAILABLE':
                return { text: "Available", class: "bg-emerald-500 text-white" };
            case 'RESERVED':
                return { text: "Reserved", class: "bg-amber-500 text-white" };
            case 'OCCUPIED':
                return { text: "Occupied", class: "bg-slate-500 text-white" };
            case 'UNDER_MAINTENANCE':
                return { text: "Maintenance", class: "bg-rose-500 text-white" };
            default:
                return { text: vacancy, class: "bg-emerald-500 text-white" };
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

    return (
        <Link href={`/listings/${id}`} className="block group h-full">
            <div className="card-premium h-full flex flex-col overflow-hidden">
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
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-emerald-500 text-white">
                                {availableRoomsText}
                            </span>
                        )}
                        {/* Verified Badge */}
                        {(isVerified || verificationStatus === 'VERIFIED') && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-blue-500 text-white flex items-center gap-1">
                                <ShieldCheck size={10} />
                                Verified
                            </span>
                        )}
                    </div>

                    {/* Favorite Button with Count */}
                    <button 
                        onClick={(e) => e.preventDefault()}
                        className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all shadow-md"
                    >
                        <Heart size={14} />
                        {likesCount > 0 && (
                            <span className="text-xs font-semibold">{likesCount}</span>
                        )}
                    </button>

                    {/* Price Badge */}
                    <div className="absolute bottom-3 left-3">
                        <span className="px-3 py-1.5 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white rounded-lg font-bold text-sm shadow-md">
                            KSh {price.toLocaleString()}<span className="text-xs font-normal text-slate-500">/mo</span>
                        </span>
                    </div>
                </div>

                {/* Content - Smaller padding */}
                <div className="p-3 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <Home size={14} className="text-primary" />
                            <span className="text-xs font-medium">{type}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
                            <Footprints size={12} />
                            {displayDistance}
                        </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-2">
                        <MapPin size={12} className="text-primary" />
                        {location}
                    </div>

                    {/* Amenities Row - Smaller */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {(amenities?.water || water) && (
                            <div className="flex items-center gap-1 text-primary text-[10px] font-medium bg-primary/10 px-1.5 py-0.5 rounded">
                                <Droplets size={8} />
                                <span>Water</span>
                            </div>
                        )}
                        {amenities?.electricity && (
                            <div className="flex items-center gap-1 text-amber-600 text-[10px] font-medium bg-amber-100 px-1.5 py-0.5 rounded">
                                <Zap size={8} />
                                <span>Power</span>
                            </div>
                        )}
                        {amenities?.security && (
                            <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-medium bg-emerald-100 px-1.5 py-0.5 rounded">
                                <Shield size={8} />
                                <span>Secure</span>
                            </div>
                        )}
                        {amenities?.internet && (
                            <div className="flex items-center gap-1 text-blue-600 text-[10px] font-medium bg-blue-100 px-1.5 py-0.5 rounded">
                                <Wifi size={8} />
                                <span>WiFi</span>
                            </div>
                        )}
                    </div>

                    {/* Deposit Info - Smaller */}
                    {depositAmount && depositAmount > 0 && (
                        <div className="text-[10px] text-slate-500 mb-1">
                            Deposit: KSh {depositAmount.toLocaleString()}
                        </div>
                    )}

                    {/* Last Updated - Smaller margin */}
                    {getLastUpdatedText() && (
                        <div className="text-[9px] text-slate-400 mb-1">
                            {getLastUpdatedText()}
                        </div>
                    )}

                    {/* CTA - Smaller */}
                    <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
                            View Details
                        </span>
                        <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-slate-400">
                            <ArrowRight size={12} />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};
