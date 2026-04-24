"use client";

import { ScrollText, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const rules = [
    {
        title: "Respect for Property",
        desc: "Maintain the premises in the condition it was provided. Report any damages immediately.",
        type: "important"
    },
    {
        title: "Quiet Hours",
        desc: "Observe quiet hours between 10:00 PM and 8:00 AM to respect neighboring residents.",
        type: "regulation"
    },
    {
        title: "Guest Policy",
        desc: "Day guests are welcome, but overnight guests must be registered through the platform.",
        type: "regulation"
    },
    {
        title: "Prohibited Items",
        desc: "No combustible materials, illegal substances, or unauthorized modifications to the unit.",
        type: "alert"
    }
];

export const RulesSection = () => {
    return (
        <section className="py-10 md:py-12 bg-white dark:bg-black">
            <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-start">
                    <div className="w-full md:w-1/3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-secondary text-slate-900 dark:text-secondary-foreground text-xs font-bold uppercase mb-3 shadow-sm border border-slate-200 dark:border-transparent">
                            <ScrollText size={14} />
                            Guidelines
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">Rules & Regulations</h2>
                        <p className="text-slate-600 dark:text-muted-foreground mb-6 text-sm leading-relaxed">
                            To ensure a harmonious living experience, we've established these ground rules.
                            Compliance is mandatory for all residents.
                        </p>
                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-primary/5 border border-blue-100 dark:border-primary/10">
                            <p className="text-xs font-bold text-blue-900 dark:text-primary leading-relaxed">
                                "Our community thrives on mutual respect. These rules protect both residents and hosts."
                            </p>
                        </div>
                    </div>

                    <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {rules.map((rule, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="p-4 rounded-2xl border border-slate-100 bg-white shadow-md hover:shadow-lg transition-all"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    {rule.type === 'alert' ?
                                        <AlertCircle className="text-red-700" size={20} /> :
                                        <CheckCircle2 className="text-green-700" size={20} />
                                    }
                                    <h4 className="font-bold text-slate-900 dark:text-foreground text-sm">{rule.title}</h4>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-muted-foreground leading-relaxed">{rule.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
