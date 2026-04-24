'use client';

import React, { useState } from 'react';
import { Shield, Clock, Trash2, Users, Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const rules = [
    {
        id: 1,
        title: 'Quiet Hours',
        desc: 'Strict silence observed from 10:00 PM to 6:00 AM daily to ensure a restful environment for all students.',
        icon: Volume2,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10'
    },
    {
        id: 2,
        title: 'Gate Closing Time',
        desc: 'Main gate is locked at 11:00 PM. Late entry requires prior notification to the caretaker.',
        icon: Clock,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10'
    },
    {
        id: 3,
        title: 'Waste Disposal',
        desc: 'Garbage must be segregated and placed in the designated bins at the back of Block C before 9:00 AM.',
        icon: Trash2,
        color: 'text-green-500',
        bg: 'bg-green-500/10'
    },
    {
        id: 4,
        title: 'Visitors Policy',
        desc: 'Guests are allowed between 9:00 AM and 9:00 PM. No overnight guests without admin approval.',
        icon: Users,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10'
    },
];

const PlotRules = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mb-24 md:mb-8">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center mb-4 px-1 cursor-pointer group"
            >
                <div className="flex items-center gap-2">
                    <Shield className="text-blue-600 dark:text-blue-400" size={20} />
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Plot Rules & Guidelines</h2>
                </div>
                <div className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="grid gap-4">
                            {rules.map((rule) => (
                                <div key={rule.id} className="flex gap-4 p-4 rounded-2xl bg-[#0f172a] border border-white/10 shadow-lg">
                                    <div className={`shrink-0 p-3 rounded-xl h-fit ${rule.bg} ${rule.color}`}>
                                        <rule.icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{rule.title}</h3>
                                        <p className="text-sm text-gray-300 leading-relaxed mt-1">
                                            {rule.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
                <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10 flex items-center gap-4 opacity-90 hover:opacity-100 transition-opacity cursor-pointer shadow-lg" onClick={() => setIsOpen(true)}>
                    <div className="bg-blue-900/40 p-2 rounded-lg text-blue-400">
                        <Shield size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-white">View 4 active house rules</p>
                    </div>
                    <ChevronDown size={16} className="text-gray-400" />
                </div>
            )}
        </div>
    );
};

export default PlotRules;
