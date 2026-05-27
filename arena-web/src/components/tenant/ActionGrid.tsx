'use client';

import React, { useEffect, useRef } from 'react';
import { CreditCard, Wrench, FileText, Bell, Users, Star } from 'lucide-react';
import gsap from 'gsap';

interface ActionGridProps {
    onAction: (action: string) => void;
    notificationCounts?: Partial<Record<string, number>>;
}

const actions = [
    { id: 'pay', label: 'Pay Rent', icon: CreditCard, gradient: 'from-[#224a7d] to-[#173454]' },
    { id: 'report', label: 'Report Issue', icon: Wrench, gradient: 'from-[#6b4c1f] to-[#4f371a]' },
    { id: 'lease', label: 'Lease', icon: FileText, gradient: 'from-[#2f345d] to-[#242848]' },
    { id: 'announcements', label: 'Announcements', icon: Bell, gradient: 'from-[#6f2b33] to-[#54212a]' },
    { id: 'community', label: 'Community', icon: Users, gradient: 'from-[#27495a] to-[#1f3647]' },
    { id: 'feedback', label: 'Feedback', icon: Star, gradient: 'from-[#5c4a2b] to-[#44361f]' },
];

const ActionGrid: React.FC<ActionGridProps> = ({ onAction, notificationCounts = {} }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.action-card',
                { opacity: 0, y: 15, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.1 }
            );
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
            {actions.map((action) => (
                <button
                    key={action.id}
                    onClick={() => onAction(action.id)}
                    className={`action-card group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 active:scale-[0.985] bg-gradient-to-br from-[#141f35] to-[#101a2f] border-[#223655] shadow-[0_14px_36px_rgba(5,12,24,0.4)] ${notificationCounts[action.id] ? 'ring-1 ring-rose-400/45 shadow-[0_0_0_1px_rgba(244,63,94,0.26),0_18px_40px_rgba(5,12,24,0.45)]' : ''}`}
                >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-35 group-hover:opacity-55 transition-opacity duration-300`} />
                    {notificationCounts[action.id] ? (
                        <span className="absolute top-2.5 right-2.5 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-[10px] font-semibold text-white grid place-items-center border border-rose-200/50">
                            {notificationCounts[action.id]}
                        </span>
                    ) : null}
                    <div className="relative flex flex-col items-center gap-2.5">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-[0_10px_20px_rgba(7,11,20,0.35)] border border-white/10`}>
                            <action.icon size={18} className="text-white" />
                        </div>
                        <span className="text-[11px] font-semibold text-[#d7e0ef] text-center leading-tight tracking-wide">
                            {action.label}
                        </span>
                    </div>
                </button>
            ))}
        </div>
    );
};

export default ActionGrid;
