'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Map, Navigation, Share2, Info, Lock } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MAX_SELF_NAV_LOADS = 5;
const TOTAL_LOADS = 15;

const LiveMap = () => {
    const [loads, setLoads] = useState(0);
    const [mode, setMode] = useState<'self' | 'guest'>('self');
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load tracking logic
        const storedLoads = parseInt(localStorage.getItem('tenant_map_views') || '0');
        const newLoads = storedLoads + 1;

        if (newLoads <= TOTAL_LOADS) {
            localStorage.setItem('tenant_map_views', newLoads.toString());
            setLoads(newLoads);
        } else {
            setLoads(TOTAL_LOADS); // Cap visual at max
        }

        if (newLoads > MAX_SELF_NAV_LOADS) {
            setMode('guest');
        }

        // GSAP Animation for Overlay
        if (overlayRef.current) {
            gsap.fromTo(overlayRef.current,
                { opacity: 0, x: -20 },
                { opacity: 1, x: 0, duration: 0.6, delay: 0.2 }
            );
        }

    }, []);

    const remainingSelf = Math.max(0, MAX_SELF_NAV_LOADS - loads);
    const remainingTotal = Math.max(0, TOTAL_LOADS - loads);

    return (
        <div className="relative w-full h-80 md:h-96 rounded-2xl overflow-hidden glass border-0 shadow-lg group my-6">
            {/* Mock Map Background - Using an image or iframe for realism */}
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 transition-opacity duration-500">
                <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15958.987654321!2d36.0!3d-0.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMMKwMDAnMDAuMCJTIDM2wrAwMCcwMC4wIkU!5e0!3m2!1sen!2ske!4v1620000000000!5m2!1sen!2ske"
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: 'grayscale(30%) contrast(1.1)' }}
                    allowFullScreen
                    loading="lazy"
                    className="w-full h-full opacity-60 dark:opacity-40"
                />
            </div>

            {/* Overlay Stats (On Map) */}
            <div ref={overlayRef} className="absolute top-4 left-4 z-10 space-y-3">
                <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/20">
                    <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12">
                            {/* Pie Chart SVG Mock */}
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                <path className="text-gray-200 dark:text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                <path className="text-blue-600" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                            </svg>
                            <div ref={(el) => {
                                if (el) {
                                    gsap.from(el, {
                                        textContent: 0,
                                        duration: 1,
                                        snap: { textContent: 1 },
                                        scrollTrigger: el,
                                    });
                                }
                            }} className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">75%</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">Balance</div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">KES 0.00</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md p-3 rounded-xl shadow-xl border border-white/20 w-48">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Lease Progress</span>
                        <span className="font-bold text-blue-600">4 Months</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: '33%' }}></div>
                    </div>
                </div>
            </div>

            {/* Map Controls & Limits */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-col md:flex-row justify-between items-end gap-3">

                <div className="bg-black/70 text-white backdrop-blur-md px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
                    {mode === 'self' ? (
                        <>
                            <Navigation size={12} className="text-green-400" />
                            <span>Self-Nav Views: {remainingSelf} left</span>
                        </>
                    ) : (
                        <>
                            <Lock size={12} className="text-orange-400" />
                            <span>Self-Nav Locked. Guest Mode Only.</span>
                        </>
                    )}
                </div>

                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 font-medium transition-transform active:scale-95 w-full md:w-auto justify-center">
                    <Share2 size={18} />
                    Share Location
                </button>
            </div>

            {/* Location Marker (Visual) */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                    <div className="w-4 h-4 bg-blue-600 rounded-full animate-ping absolute inset-0 opacity-75"></div>
                    <div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center relative z-10">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-black/80 px-2 py-1 rounded text-xs whitespace-nowrap font-bold shadow-md">
                        My Block
                    </div>
                </div>
            </div>

        </div>
    );
};

export default LiveMap;
