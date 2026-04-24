"use client";

import { User, Clock, Edit } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function AccountantProfile() {
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (cardRef.current) {
            gsap.from(cardRef.current, {
                opacity: 0,
                scale: 0.95,
                duration: 0.8,
                ease: "back.out(1.2)",
            });
        }
    }, []);

    return (
        <div
            ref={cardRef}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50 p-6 md:p-8 hover:shadow-2xl hover:shadow-[#0066FF]/20 transition-all duration-300"
        >
            {/* Glassmorphic overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0066FF]/5 to-[#00D084]/5 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                {/* Profile Info */}
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#0066FF] to-[#00D084] p-1">
                            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                                <User className="w-8 h-8 md:w-10 md:h-10 text-[#0066FF]" />
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#00D084] rounded-full border-2 border-slate-900 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                    </div>

                    {/* Details */}
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white">Sarah Johnson</h2>
                        <p className="text-sm md:text-base text-slate-400 mt-1">
                            Senior Accountant / Bookkeeper
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>Last login: Today at 9:42 AM</span>
                        </div>
                    </div>
                </div>

                {/* Edit Profile Button */}
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-slate-300 hover:text-white transition-all group">
                    <Edit className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    <span className="text-sm font-medium">Edit Profile</span>
                </button>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0066FF]/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#00D084]/10 rounded-full blur-3xl"></div>
        </div>
    );
}
