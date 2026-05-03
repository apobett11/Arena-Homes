'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react';

export interface TenantActivityItem {
    id: string;
    type: string;
    title: string;
    date: string;
    amount?: string;
    desc?: string;
}

interface RecentActivityProps {
    activities: TenantActivityItem[];
    onViewAll: () => void;
}

const RecentActivity = ({ activities, onViewAll }: RecentActivityProps) => {
    const getIcon = (type: string) => {
        switch (type) {
            case 'payment': return <CheckCircle size={14} className="text-emerald-500" />;
            case 'announcement': return <AlertTriangle size={14} className="text-amber-500" />;
            default: return <Info size={14} className="text-blue-500" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'payment': return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30';
            case 'announcement': return 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30';
            default: return 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30';
        }
    };

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Recent Activity
                </h3>
                <button 
                    onClick={onViewAll} 
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                >
                    View All
                    <ArrowRight size={12} />
                </button>
            </div>

            {activities.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    No recent activity
                </div>
            ) : (
                <div className="flex gap-2 overflow-x-auto pb-2 snap-x hide-scrollbar">
                    {activities.slice(0, 5).map((item) => (
                        <div
                            key={item.id}
                            className={`snap-center shrink-0 w-44 p-3 rounded-xl border ${getBgColor(item.type)} flex flex-col gap-2`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    {getIcon(item.type)}
                                    <span className="text-[10px] uppercase tracking-wider font-medium text-slate-500 dark:text-slate-400">
                                        {item.type}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400">{item.date}</span>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">
                                    {item.title}
                                </p>
                                {item.amount && (
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                        {item.amount}
                                    </p>
                                )}
                                {item.desc && (
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                        {item.desc}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentActivity;
