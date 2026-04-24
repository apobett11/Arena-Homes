'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react';

const activities = [
    { id: 1, type: 'payment', title: 'Rent Paid', date: 'Oct 27, 2025', amount: 'KES 12,000', status: 'success' },
    { id: 2, type: 'announcement', title: 'Water Maintenance', date: 'Oct 25, 2025', desc: 'Water supply interruption 2pm-5pm', status: 'warning' },
    { id: 3, type: 'maintenance', title: 'Leaking Tap Fixed', date: 'Oct 20, 2025', desc: 'Resolved by Maintenance Team', status: 'info' },
    { id: 4, type: 'payment', title: 'Rent Paid', date: 'Sep 27, 2025', amount: 'KES 12,000', status: 'success' },
];

const RecentActivity = () => {
    return (
        <div className="mb-24 md:mb-8">
            <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Recent Activity</h2>
                <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
            </div>

            {/* Horizontal Scroll / Swipeable */}
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar px-1">
                {activities.map((item) => (
                    <div
                        key={item.id}
                        className="snap-center shrink-0 w-64 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className={`p-2 rounded-full ${item.type === 'payment' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                    item.type === 'announcement' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                {item.type === 'payment' ? <CheckCircle size={18} /> :
                                    item.type === 'announcement' ? <AlertTriangle size={18} /> :
                                        <Info size={18} />}
                            </div>
                            <span className="text-xs text-gray-400">{item.date}</span>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{item.title}</h3>
                            {item.amount && <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{item.amount}</p>}
                            {item.desc && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.desc}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentActivity;
