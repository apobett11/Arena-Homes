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
        <div className="relative w-full h-[19rem] md:h-[24rem] rounded-[24px] overflow-hidden border border-[#2a3f61] my-6 bg-[#0f192d] shadow-[0_20px_46px_rgba(5,12,24,0.45)]">
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
                <div className="h-full w-full flex items-center justify-center text-sm text-[#a9b7cb]">
                    Location coordinates are not available yet.
                </div>
            )}
            <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
                <div className="rounded-xl bg-[#0b1426]/88 border border-[#2c4161] px-3 py-2 text-xs text-[#dbe4f4]">
                    Start pin: {gateLabel} | Destination pin: {plotLabel}
                </div>
                
                {shareCode ? (
                    <div className="rounded-xl bg-[#172845]/92 border border-[#3d5782] p-4">
                        <p className="text-[#f8ddad] text-sm font-semibold mb-2">Share code generated!</p>
                        <p className="text-2xl font-bold text-white tracking-wider mb-2">{shareCode}</p>
                        <p className="text-[#b7c6dc] text-xs">
                            Send this code to your visitor. They can search it on the listings page to find your location.
                        </p>
                    </div>
                ) : (
                    <button
                        onClick={onShareLocation}
                        disabled={sharing}
                        className="bg-gradient-to-r from-[#2b5f9b] to-[#1f4673] hover:from-[#3572b7] hover:to-[#245388] disabled:opacity-60 text-white px-4 py-2.5 rounded-xl border border-[#456ba0] flex items-center gap-2 font-medium transition-transform active:scale-95 w-full justify-center"
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
