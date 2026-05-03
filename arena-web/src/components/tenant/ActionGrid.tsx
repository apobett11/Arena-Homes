'use client';

import React, { useEffect, useRef } from 'react';
import { CreditCard, Wrench, FileText, Bell, Users, Star } from 'lucide-react';
import gsap from 'gsap';

interface ActionGridProps {
    onAction: (action: string) => void;
}

const actions = [
    { id: 'pay', label: 'Pay Rent', icon: CreditCard, gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
    { id: 'report', label: 'Report Issue', icon: Wrench, gradient: 'from-orange-500 to-amber-500', shadow: 'shadow-orange-500/20' },
    { id: 'lease', label: 'View Lease', icon: FileText, gradient: 'from-purple-500 to-pink-500', shadow: 'shadow-purple-500/20' },
    { id: 'announcements', label: 'Announcements', icon: Bell, gradient: 'from-red-500 to-rose-500', shadow: 'shadow-red-500/20' },
    { id: 'community', label: 'Community', icon: Users, gradient: 'from-green-500 to-emerald-500', shadow: 'shadow-green-500/20' },
    { id: 'feedback', label: 'Feedback', icon: Star, gradient: 'from-yellow-500 to-amber-500', shadow: 'shadow-yellow-500/20' },
];

const ActionGrid: React.FC<ActionGridProps> = ({ onAction }) => {
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
        <div ref={containerRef} className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
            {actions.map((action) => (
                <button
                    key={action.id}
                    onClick={() => onAction(action.id)}
                    className={`action-card group relative overflow-hidden rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 p-3 transition-all duration-300 hover:shadow-lg ${action.shadow} hover:-translate-y-1 active:scale-95`}
                >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    <div className="relative flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-sm`}>
                            <action.icon size={18} className="text-white" />
                        </div>
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 text-center leading-tight">
                            {action.label}
                        </span>
                    </div>
                </button>
            ))}
        </div>
    );
};

export default ActionGrid;
