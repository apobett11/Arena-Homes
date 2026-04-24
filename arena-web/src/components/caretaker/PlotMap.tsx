"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { MapPin, Info } from "lucide-react";

const rooms = [
    { id: 1, top: "25%", left: "30%", status: "occupied", number: "A1" },
    { id: 2, top: "25%", left: "50%", status: "available", number: "A2" },
    { id: 3, top: "25%", left: "70%", status: "issue", number: "A3" },
    { id: 4, top: "55%", left: "20%", status: "occupied", number: "B1" },
    { id: 5, top: "55%", left: "40%", status: "occupied", number: "B2" },
    { id: 6, top: "55%", left: "60%", status: "available", number: "B3" },
    { id: 7, top: "55%", left: "80%", status: "occupied", number: "B4" },
];

export const PlotMap = () => {
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (mapRef.current) {
            const pins = mapRef.current.querySelectorAll(".map-pin");

            gsap.fromTo(
                pins,
                { scale: 0, y: -20 },
                {
                    scale: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: "back.out(2)"
                }
            );

            // Bounce animation for issue pin
            gsap.to(".pin-issue", {
                y: -10,
                duration: 0.8,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut"
            });
        }
    }, []);

    return (
        <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 shadow-2xl relative">
            <div className="p-4 border-b border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex justify-between items-center z-10 relative">
                <div className="flex items-center gap-2">
                    <MapPin className="text-primary dark:text-primary w-5 h-5" />
                    <h2 className="text-slate-900 dark:text-white font-bold">Interactive Plot Overview</h2>
                </div>
                <div className="flex gap-4 text-[10px] uppercase tracking-widest font-bold">
                    <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span> <span className="text-slate-500 dark:text-slate-300">Available</span></div>
                    <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm"></span> <span className="text-slate-500 dark:text-slate-300">Occupied</span></div>
                    <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"></span> <span className="text-slate-500 dark:text-slate-300">Issue</span></div>
                </div>
            </div>

            <div
                ref={mapRef}
                className="h-[400px] w-full bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center relative grayscale opacity-40 mix-blend-luminosity"
            >
                {/* Overlay grid for "Tony Stark" vibe */}
                <div className="absolute inset-0 bg-blue-900/20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(0, 102, 255, 0.1) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

                {rooms.map((room) => (
                    <div
                        key={room.id}
                        className={`map-pin absolute cursor-pointer group ${room.status === 'issue' ? 'pin-issue' : ''}`}
                        style={{ top: room.top, left: room.left }}
                    >
                        <div className={`relative flex items-center justify-center`}>
                            <div className={`absolute w-10 h-10 rounded-full animate-ping opacity-20 ${room.status === 'available' ? 'bg-green-500' :
                                room.status === 'occupied' ? 'bg-red-500' : 'bg-yellow-400'
                                }`} />
                            <div className={`w-8 h-8 rounded-full border-2 border-white/50 flex items-center justify-center text-[10px] font-bold text-white shadow-xl ${room.status === 'available' ? 'bg-green-500' :
                                room.status === 'occupied' ? 'bg-red-500' : 'bg-yellow-400 text-slate-900'
                                }`}>
                                {room.number}
                            </div>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/20 p-2 rounded-xl text-[10px] w-28 pointer-events-none z-20 shadow-xl">
                                <p className="text-slate-900 dark:text-white font-bold">Room {room.number}</p>
                                <p className="text-slate-500 dark:text-slate-300 capitalize font-semibold">{room.status}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-200 dark:border-white/20 p-3 rounded-2xl flex items-start gap-3 max-w-xs transition-transform hover:scale-102 shadow-xl">
                <Info className="text-primary dark:text-primary w-6 h-6 mt-0.5" />
                <div>
                    <h4 className="text-slate-900 dark:text-white text-sm font-bold leading-tight uppercase tracking-tight">Spatial Insight</h4>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1 leading-snug font-medium">Hover over pins to check room status and tenant details instantly.</p>
                </div>
            </div>
        </div>
    );
};
