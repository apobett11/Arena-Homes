"use client";

import { ScrollText, CheckCircle2, AlertCircle, FileText, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const rules = [
    {
        title: "Respect for Property",
        desc: "Maintain the premises in the condition it was provided. Report any damages immediately to the caretaker.",
        type: "important"
    },
    {
        title: "Quiet Hours",
        desc: "Observe quiet hours between 10:00 PM and 8:00 AM to respect neighboring residents and ensure study time.",
        type: "regulation"
    },
    {
        title: "Guest Policy",
        desc: "Day guests are welcome. Overnight guests must be registered through the platform for security.",
        type: "regulation"
    },
    {
        title: "Safety First",
        desc: "No combustible materials, illegal substances, or unauthorized electrical modifications to the unit.",
        type: "alert"
    }
];

export const RulesSection = () => {
    return (
        <section className="py-20 md:py-28 bg-white dark:bg-slate-950 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
                    {/* Content Side */}
                    <div className="w-full lg:w-2/5">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                                <ScrollText size={14} />
                                Transparency
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white leading-tight">
                                Clear Rules, <span className="text-gradient">Fair Living</span>
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-8 text-base leading-relaxed">
                                We believe in transparency. Every property has clearly defined rules so you 
                                know exactly what to expect before you move in. No surprises, no hidden clauses.
                            </p>
                            
                            {/* Trust Indicators */}
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <FileText size={24} className="text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white mb-1">Rules Available Upfront</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            View house rules, deposit requirements, and lease terms before applying. 
                                            Full transparency from day one.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Link 
                                href="/rules" 
                                className="inline-flex items-center gap-2 mt-6 text-primary font-semibold hover:gap-3 transition-all"
                            >
                                Read Full Rules & Guidelines
                                <ArrowRight size={18} />
                            </Link>
                        </motion.div>
                    </div>

                    {/* Rules Grid */}
                    <div className="w-full lg:w-3/5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {rules.map((rule, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.4 }}
                                viewport={{ once: true }}
                                className="card-premium p-6 group hover:border-primary/20"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        rule.type === 'alert' 
                                            ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' 
                                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                    }`}>
                                        {rule.type === 'alert' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{rule.title}</h4>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{rule.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
