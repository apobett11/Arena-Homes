'use client';

import React, { useState } from 'react';
import { Shield, Clock, Trash2, Users, Volume2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TenantRuleItem {
    id: string;
    title: string;
    desc: string;
}

interface PlotRulesProps {
    rules: TenantRuleItem[];
    loading: boolean;
}

const iconSet = [Volume2, Clock, Trash2, Users];
const colorSet = [
    { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-200 dark:border-blue-800" },
    { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-200 dark:border-orange-800" },
    { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-200 dark:border-green-800" },
    { color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-200 dark:border-purple-800" },
];

const PlotRules = ({ rules, loading }: PlotRulesProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mb-6">
            {/* Header */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 cursor-pointer hover:shadow-sm transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <BookOpen size={16} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">House Rules</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {loading ? 'Loading...' : `${rules.length} rules & guidelines`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                        {isOpen ? 'Hide' : 'View'}
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </div>

            {/* Expanded Rules */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="pt-2 space-y-2">
                            {loading ? (
                                <div className="text-xs text-slate-400 py-3 text-center">Loading rules...</div>
                            ) : rules.length === 0 ? (
                                <div className="text-xs text-slate-400 py-3 text-center">No rules available</div>
                            ) : (
                                rules.map((rule, index) => {
                                    const Icon = iconSet[index % iconSet.length];
                                    const colors = colorSet[index % colorSet.length];
                                    return (
                                        <div 
                                            key={rule.id} 
                                            className={`flex gap-3 p-3 rounded-xl bg-white dark:bg-slate-800/60 border ${colors.border} shadow-sm`}
                                        >
                                            <div className={`shrink-0 w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                                                <Icon size={16} className={colors.color} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200">{rule.title}</h4>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                                    {rule.desc}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PlotRules;
