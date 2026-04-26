'use client';

import React from 'react';
import { Share2 } from 'lucide-react';

interface LiveMapProps {
    gateLabel: string;
    plotLabel: string;
    gateLat: number | null;
    gateLng: number | null;
    houseLat: number | null;
    houseLng: number | null;
    onShareLocation: () => void;
    sharing: boolean;
    shareCode?: string | null;
}

const LiveMap = ({
    gateLabel,
    plotLabel,
    gateLat,
    gateLng,
    houseLat,
    houseLng,
    onShareLocation,
    sharing,
    shareCode,
}: LiveMapProps) => {
    const hasCoordinates =
        gateLat !== null &&
        gateLng !== null &&
        houseLat !== null &&
        houseLng !== null;
    const mapUrl = hasCoordinates
        ? `https://www.google.com/maps?q=${houseLat},${houseLng}&z=16&output=embed`
        : null;

    return (
        <div className="relative w-full h-80 md:h-[28rem] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 my-6 bg-slate-900">
            {mapUrl ? (
                <iframe
                    src={mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    className="w-full h-full"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            ) : (
                <div className="h-full w-full flex items-center justify-center text-sm text-slate-300">
                    Location coordinates are not available yet.
                </div>
            )}
            <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
                <div className="rounded-lg bg-slate-950/80 px-3 py-2 text-xs text-slate-200">
                    Start pin: {gateLabel} | Destination pin: {plotLabel}
                </div>
                
                {shareCode ? (
                    <div className="rounded-xl bg-emerald-900/80 border border-emerald-500/30 p-4">
                        <p className="text-emerald-300 text-sm font-semibold mb-2">Share code generated!</p>
                        <p className="text-2xl font-bold text-white tracking-wider mb-2">{shareCode}</p>
                        <p className="text-emerald-200/70 text-xs">
                            Send this code to your visitor. They can search it on the listings page to find your location.
                        </p>
                    </div>
                ) : (
                    <button
                        onClick={onShareLocation}
                        disabled={sharing}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-transform active:scale-95 w-full justify-center"
                    >
                        <Share2 size={18} />
                        {sharing ? "Generating code..." : "Share Location"}
                    </button>
                )}
            </div>
        </div>
    );
};

export default LiveMap;
