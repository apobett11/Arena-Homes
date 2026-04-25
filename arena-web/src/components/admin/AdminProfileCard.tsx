"use client";

import { Shield, Edit, Activity, Globe } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useRouter } from "next/navigation";

export default function AdminProfileCard() {
    const cardRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (cardRef.current) {
            gsap.from(cardRef.current, {
                opacity: 0,
                y: -20,
                duration: 0.8,
                ease: "power3.out",
                delay: 0.2
            });
        }
    }, []);

    return (
        <div ref={cardRef} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 p-6 shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0066FF]/10 rounded-full blur-[80px]"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    {/* Admin Avatar */}
                    <div className="relative group cursor-pointer">
                        <div className="w-20 h-20 rounded-xl bg-slate-950 border-2 border-[#0066FF] flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,102,255,0.3)] transition-all group-hover:shadow-[0_0_30px_rgba(0,102,255,0.5)]">
                            <span className="text-2xl font-bold text-white">SA</span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-slate-900 rounded-lg p-1.5 border border-slate-700">
                            <Shield className="w-4 h-4 text-[#0066FF]" />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome, Administrator</h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0066FF] text-white uppercase tracking-wider">Super Admin</span>
                        </div>
                        <p className="text-slate-400 text-sm flex items-center gap-2">
                            Arena Homes HQ • <span className="text-[#00D084] flex items-center gap-1"><Activity className="w-3 h-3" /> Systems Optimal</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={() => router.push("/admin/settings")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all hover:text-white active:scale-95">
                        <Globe className="w-4 h-4" />
                        <span className="text-sm font-medium">Public Face</span>
                    </button>
                    <button onClick={() => router.push("/admin/settings")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0066FF]/10 hover:bg-[#0066FF]/20 border border-[#0066FF]/30 text-[#0066FF] hover:text-[#0066FF] transition-all active:scale-95">
                        <Edit className="w-4 h-4" />
                        <span className="text-sm font-medium">Edit Profile</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
