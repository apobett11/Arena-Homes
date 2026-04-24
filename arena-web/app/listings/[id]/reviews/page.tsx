"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star, Filter, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const allReviews = [
    { id: 1, user: "Sarah Jenkins", rating: 5, date: "2023-10-15", comment: "Absolutely loved staying here! The garden is magical, and the host was incredibly responsive." },
    { id: 2, user: "Mike Rossi", rating: 4, date: "2023-10-10", comment: "Great location, very clean. A bit pricey but worth it for the amenities provided." },
    { id: 3, user: "Jessica Lee", rating: 5, date: "2023-09-28", comment: "The security is top notch, felt very safe coming home late at night." },
    { id: 4, user: "David Chen", rating: 4, date: "2023-09-20", comment: "Modern and stylish. The water pressure is amazing, unlike my last apartment." },
    { id: 5, user: "Amanda White", rating: 3, date: "2023-09-15", comment: "Good place but the street noise can be a bit much on weekends." },
    { id: 6, user: "Robert Black", rating: 5, date: "2023-09-02", comment: "Perfect for remote work. Fast internet and quiet neighbors." },
    { id: 7, user: "Emily Davis", rating: 2, date: "2023-08-30", comment: "Had some issues with the AC, took a while to fix." },
    { id: 8, user: "Chris Martin", rating: 5, date: "2023-08-25", comment: "Simply the best rental experience I've had in this city." },
];

type SortOption = "All" | "Latest" | "With Comments" | "Highest Rated" | "Lowest Rated";

export default function ReviewsPage({ params }: { params: { id: string } }) {
    const [activeSort, setActiveSort] = useState<SortOption>("All");

    const getSortedReviews = () => {
        let reviews = [...allReviews];
        switch (activeSort) {
            case "Latest":
                return reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            case "Highest Rated":
                return reviews.sort((a, b) => b.rating - a.rating);
            case "Lowest Rated":
                return reviews.sort((a, b) => a.rating - b.rating);
            case "With Comments":
                return reviews.filter(r => r.comment && r.comment.length > 0);
            default:
                return reviews;
        }
    };

    const sortedReviews = getSortedReviews();

    return (
        <div className="min-h-screen bg-white dark:bg-black font-sans text-slate-900 dark:text-slate-100">

            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-100 dark:border-white/10 p-4">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <Link href={`/listings/${params.id}`} className="min-w-[40px] h-10 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-xl font-bold">Comments and Reviews</h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4 md:p-8">

                {/* Sorting Options */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {(["All", "Latest", "With Comments", "Highest Rated", "Lowest Rated"] as SortOption[]).map((option) => (
                        <button
                            key={option}
                            onClick={() => setActiveSort(option)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-bold transition-all border",
                                activeSort === option
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                    : "bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800"
                            )}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                {/* Reviews List */}
                <div className="grid gap-4">
                    {sortedReviews.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">
                            <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No reviews found matching your filter.</p>
                        </div>
                    ) : (
                        sortedReviews.map((review) => (
                            <div key={review.id} className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-white/5 hover:border-primary/20 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm">
                                            {review.user.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm sm:text-base">{review.user}</h3>
                                            <p className="text-xs text-slate-400">{review.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-0.5 text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i >= review.rating ? "opacity-30" : ""} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                    {review.comment}
                                </p>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}
