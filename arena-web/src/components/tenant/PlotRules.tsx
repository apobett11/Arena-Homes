'use client';

import React, { useState } from 'react';
import { Clock, Trash2, Users, Volume2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
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
                className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-[#141f35] to-[#0f192d] border border-[#2a3f61] cursor-pointer hover:border-[#415e86] transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#f5c978]/15 border border-[#f5c978]/30 flex items-center justify-center">
                        <BookOpen size={16} className="text-[#f8ddad]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[#edf2fb]">House Rules</h3>
                        <p className="text-[11px] text-[#9fb0c9]">
                            {loading ? 'Loading...' : `${rules.length} rules & guidelines`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1f304b] text-[#b8c8de] border border-[#2f4566]">
                        {isOpen ? 'Hide' : 'View'}
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-[#9fb0c9]" /> : <ChevronDown size={16} className="text-[#9fb0c9]" />}
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
                                <div className="text-xs text-[#9fb0c9] py-3 text-center">Loading rules...</div>
                            ) : rules.length === 0 ? (
                                <div className="text-xs text-[#9fb0c9] py-3 text-center">No rules available</div>
                            ) : (
                                rules.map((rule, index) => {
                                    const Icon = iconSet[index % iconSet.length];
                                    const colors = colorSet[index % colorSet.length];
                                    return (
                                        <div 
                                            key={rule.id} 
                                            className={`flex gap-3 p-3 rounded-xl bg-[#121f35] border ${colors.border} shadow-sm`}
                                        >
                                            <div className={`shrink-0 w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                                                <Icon size={16} className={colors.color} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-semibold text-[#edf2fb]">{rule.title}</h4>
                                                <p className="text-[11px] text-[#a8b9d0] mt-0.5 line-clamp-2">
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
