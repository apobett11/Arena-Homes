"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Heart, MapPin, Droplets, Home, Footprints, ShieldCheck, Zap, Shield, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  isVerified?: boolean;
  verificationStatus?: string;
  availabilityStatus?:
    | "AVAILABLE"
    | "RESERVED"
    | "OCCUPIED"
    | "UNDER_MAINTENANCE"
    | "UNAVAILABLE";
  depositAmount?: number;
  walkingTimeMinutes?: number | null;
  lastUpdated?: string;
  amenities?: {
    water?: boolean;
    electricity?: boolean;
    security?: boolean;
    internet?: boolean;
  };
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
  likesCount: initialLikesCount = 0,
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
      if (isLiked) {
        setLikesCount((prev) => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        setLikesCount((prev) => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
      setLikesCount(initialLikesCount);
      setIsLiked(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailabilityBadge = () => {
    const status =
      availabilityStatus || (vacancy === "Available" ? "AVAILABLE" : "OCCUPIED");
    switch (status) {
      case "AVAILABLE":
        return { text: "Available", class: "bg-vibrant-blue/90 text-white" };
      case "RESERVED":
        return { text: "Reserved", class: "bg-amber-500 text-white" };
      case "OCCUPIED":
        return { text: "Occupied", class: "bg-slate-500 text-white" };
      case "UNDER_MAINTENANCE":
        return { text: "Maintenance", class: "bg-rose-500 text-white" };
      default:
        return { text: vacancy, class: "bg-vibrant-blue/90 text-white" };
    }
  };

  const badge = getAvailabilityBadge();
  const displayDistance = walkingTimeMinutes
    ? `${walkingTimeMinutes} min walk`
    : distance;

  const availableRoomsText =
    availableRooms !== undefined
      ? `${availableRooms} room${availableRooms !== 1 ? "s" : ""} avail.`
      : vacancy;

  const getLastUpdatedText = () => {
    if (!lastUpdated) return null;
    const date = new Date(lastUpdated);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0) return "Updated today";
    if (diffDays === 1) return "Updated yesterday";
    if (diffDays < 7) return `Updated ${diffDays} days ago`;
    return `Updated ${date.toLocaleDateString()}`;
  };

  const validId = id && id !== "undefined" && id !== "null" ? String(id) : null;

  if (!validId) {
    return (
      <div className="group block h-full cursor-not-allowed opacity-60">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-navy/50 md:rounded-[32px]">
          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-800">
            <span className="text-sm text-slate-500">Property not available</span>
          </div>
          <div className="flex flex-1 flex-col p-3 md:p-6">
            <h3 className="mb-1 truncate text-xs font-semibold text-white md:text-lg">
              {title || "Unknown"}
            </h3>
            <p className="text-[10px] text-outline-variant md:text-xs">
              Please try again later
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/listings/${validId}`} className="group block h-full min-w-0">
      <motion.div
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-navy/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-vibrant-blue/10 md:rounded-[32px]"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 33vw"
          />

          {availableRooms !== undefined && availableRooms > 0 && (
            <div className="absolute left-2 top-2 md:left-4 md:top-4">
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-semibold uppercase tracking-wide md:px-3 md:text-[10px]",
                  badge.class,
                )}
              >
                {availableRoomsText}
              </span>
            </div>
          )}

          <motion.button
            type="button"
            onClick={handleLike}
            whileTap={{ scale: 0.9 }}
            disabled={isLoading}
            className={cn(
              "absolute right-2 top-2 flex h-9 min-w-9 items-center justify-center gap-1 rounded-full px-2 backdrop-blur-md transition-colors md:right-4 md:top-4 md:h-11 md:min-w-11",
              isLiked
                ? "bg-black/50 text-rose-400 hover:bg-white hover:text-rose-600"
                : "bg-black/40 text-white hover:bg-white/20",
            )}
            aria-label={isLiked ? "Unlike listing" : "Like listing"}
          >
            <Heart size={14} className={cn("shrink-0", isLiked && "fill-current")} />
            <span className="min-w-[1rem] text-center text-[10px] font-semibold md:text-xs">
              {likesCount}
            </span>
          </motion.button>

          {(isVerified || verificationStatus === "VERIFIED") && (
            <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4">
              <span className="flex items-center gap-1 rounded-full bg-success-emerald px-2 py-1 text-[8px] font-semibold text-white md:px-3 md:text-[10px]">
                <ShieldCheck className="h-3 w-3 md:h-3.5 md:w-3.5" aria-hidden />
                VERIFIED
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3 md:p-6">
          <div className="mb-2 flex flex-col items-start justify-between gap-1 md:mb-4 md:flex-row md:items-start">
            <h3 className="line-clamp-2 w-full truncate font-semibold text-xs text-white md:w-auto md:text-lg">
              {title}
            </h3>
            <div className="shrink-0 font-bold text-vibrant-blue text-sm md:text-base">
              KSh {price.toLocaleString()}
              <span className="align-top text-[10px] font-normal text-outline-variant md:text-xs">
                /mo
              </span>
            </div>
          </div>

          <p className="mb-2 flex items-center gap-1 text-[10px] text-outline-variant md:mb-4 md:text-xs">
            <MapPin className="h-3 w-3 shrink-0 md:h-4 md:w-4" />
            {location}
          </p>

          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[10px] md:text-xs">
            <div className="flex items-center gap-1.5 text-outline-variant">
              <Home className="h-3.5 w-3.5 text-vibrant-blue" />
              <span className="font-medium text-white/90">{type}</span>
            </div>
            <div className="flex items-center gap-1 text-outline-variant">
              <Footprints className="h-3 w-3" />
              {displayDistance}
            </div>
          </div>

          <div className="mb-2 flex flex-wrap gap-1.5">
            {(amenities?.water || water) && (
              <div className="flex items-center gap-1 rounded bg-vibrant-blue/15 px-1.5 py-0.5 text-[10px] font-medium text-primary-fixed-dim">
                <Droplets size={8} />
                <span>Water</span>
              </div>
            )}
            {amenities?.electricity && (
              <div className="flex items-center gap-1 rounded bg-gold-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-gold-accent">
                <Zap size={8} />
                <span>Power</span>
              </div>
            )}
            {amenities?.security && (
              <div className="flex items-center gap-1 rounded bg-vibrant-blue/15 px-1.5 py-0.5 text-[10px] font-medium text-primary-fixed-dim">
                <Shield size={8} />
                <span>Secure</span>
              </div>
            )}
            {amenities?.internet && (
              <div className="flex items-center gap-1 rounded bg-success-emerald/15 px-1.5 py-0.5 text-[10px] font-medium text-success-emerald">
                <Wifi size={8} />
                <span>WiFi</span>
              </div>
            )}
          </div>

          {depositAmount != null && depositAmount > 0 && (
            <div className="mb-1 text-[10px] text-outline-variant">
              Deposit: KSh {depositAmount.toLocaleString()}
            </div>
          )}

          {getLastUpdatedText() && (
            <div className="mb-2 text-[9px] text-outline-variant md:mb-3">
              {getLastUpdatedText()}
            </div>
          )}

          <div className="mt-auto w-full rounded-xl border border-white/10 bg-white/5 py-2 text-center text-[10px] font-semibold text-white transition-all group-hover:border-vibrant-blue group-hover:bg-vibrant-blue md:rounded-xl md:py-3 md:text-sm">
            View Details
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
