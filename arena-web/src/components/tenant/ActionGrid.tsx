'use client';

import React, { useEffect, useRef } from 'react';
import { CreditCard, Wrench, FileText, Bell, Users, Star } from 'lucide-react';
import gsap from 'gsap';

interface ActionGridProps {
    onAction: (action: string) => void;
}

const actions = [
    { id: 'pay', label: 'Pay Rent', icon: CreditCard, color: 'text-blue-900 dark:text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/10' },
    { id: 'report', label: 'Report Issue', icon: Wrench, color: 'text-orange-900 dark:text-orange-500', bg: 'bg-orange-100 dark:bg-orange-500/10' },
    { id: 'lease', label: 'View Lease', icon: FileText, color: 'text-purple-900 dark:text-purple-500', bg: 'bg-purple-100 dark:bg-purple-500/10' },
    { id: 'announcements', label: 'Announcements', icon: Bell, color: 'text-red-900 dark:text-red-500', bg: 'bg-red-100 dark:bg-red-500/10' },
    { id: 'community', label: 'Community', icon: Users, color: 'text-green-900 dark:text-green-500', bg: 'bg-green-100 dark:bg-green-500/10' },
    { id: 'feedback', label: 'Feedback', icon: Star, color: 'text-yellow-900 dark:text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-500/10' },
];

const ActionGrid: React.FC<ActionGridProps> = ({ onAction }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.action-card',
                { opacity: 0, scale: 0.8, y: 20 },
                { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'back.out(1.7)' }
            );
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {actions.map((action) => (
                <button
                    key={action.id}
                    onClick={() => onAction(action.id)}
                    className="action-card flex flex-col items-center justify-center p-6 rounded-2xl glass hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/40 dark:border-white/5"
                >
                    <div className={`p-4 rounded-full ${action.bg} mb-3`}>
                        <action.icon size={28} className={action.color} />
                    </div>
                    <span className="font-medium text-black dark:text-gray-200">{action.label}</span>
                </button>
            ))}
        </div>
    );
};

export default ActionGrid;
