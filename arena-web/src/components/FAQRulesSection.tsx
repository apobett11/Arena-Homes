"use client";

import { useState } from "react";
import { Plus, Minus, ScrollText, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
    {
        question: "How do I book a room viewing?",
        answer: "Simply browse our listings, click on any property you're interested in, and click the 'Schedule Viewing' button. Select a date and time that works for you, and the caretaker will confirm your appointment within 24 hours."
    },
    {
        question: "What areas near Egerton University do you cover?",
        answer: "We currently cover all major areas around Egerton University including Njoro Town, Main Gate, Njokerio, Milimani, Blue Valley Estate, and the Town Center. All our listings are within walking or biking distance to campus."
    },
    {
        question: "How much is the typical rent for student housing?",
        answer: "Our student housing options range from KSh 3,500 to KSh 15,000 per month depending on the location, room type, and amenities. Single rooms typically cost KSh 4,500-7,000, bedsitters KSh 5,500-8,500, and 1-bedroom apartments KSh 8,000-15,000."
    },
    {
        question: "Is there a security deposit required?",
        answer: "Yes, most landlords require a security deposit equal to one month's rent. This is refundable at the end of your tenancy if the room is left in good condition. Some properties also require a small booking fee to secure your spot."
    },
    {
        question: "Can I pay rent monthly or do I need to pay per semester?",
        answer: "Most of our listings offer flexible payment options. While some landlords prefer semester payments (3-4 months), many accept monthly payments. You can filter listings by payment terms in our search options."
    },
];

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

export const FAQRulesSection = () => {
    const [activeFaq, setActiveFaq] = useState<number | null>(0);

    return (
        <section className="py-8 md:py-10 bg-gradient-to-b from-[#F0EDE6] to-[#F8F5F0]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* FAQ Column */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-[#0F172A]/10 flex items-center justify-center">
                                <ScrollText size={18} className="text-[#0F172A]" />
                            </div>
                            <h2 className="text-lg font-bold text-[#1F2937]">Frequently Asked Questions</h2>
                        </div>
                        
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                            {faqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className={`card-premium overflow-hidden transition-all ${
                                        activeFaq === index 
                                            ? "border-[#C9B37F]/50 shadow-sm" 
                                            : "hover:border-[#EDE9E0]"
                                    }`}
                                >
                                    <button
                                        onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                                        className="w-full flex items-center justify-between p-3 text-left gap-3"
                                        aria-expanded={activeFaq === index}
                                    >
                                        <span className={`font-medium text-sm ${activeFaq === index ? "text-[#0F172A]" : "text-[#1F2937]"}`}>
                                            {faq.question}
                                        </span>
                                        <div className={`h-7 w-7 flex-shrink-0 flex items-center justify-center rounded-lg transition-all ${
                                            activeFaq === index 
                                                ? "bg-[#0F172A] text-white" 
                                                : "bg-[#EDE9E0] text-[#4B5563]"
                                        }`}>
                                            {activeFaq === index ? <Minus size={14} /> : <Plus size={14} />}
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {activeFaq === index && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-3 pb-3 pt-0 text-[#4B5563] leading-relaxed border-t border-[#EDE9E0]">
                                                    <p className="pt-2 text-xs">
                                                        {faq.answer}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Rules Column */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-[#0F172A]/10 flex items-center justify-center">
                                <CheckCircle2 size={18} className="text-[#0F172A]" />
                            </div>
                            <h2 className="text-lg font-bold text-[#1F2937]">Rules & Guidelines</h2>
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                            {rules.map((rule, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                    viewport={{ once: true }}
                                    className="card-premium p-3 group hover:border-[#C9B37F]/40"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                                            rule.type === 'alert' 
                                                ? 'bg-rose-100 text-rose-600' 
                                                : 'bg-emerald-100 text-emerald-600'
                                        }`}>
                                            {rule.type === 'alert' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm text-[#1F2937] mb-0.5">{rule.title}</h4>
                                            <p className="text-[#4B5563] text-xs leading-relaxed">{rule.desc}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <p className="mt-3 text-xs text-[#4B5563] text-center">
                            View full rules and FAQ on our <a href="/rules" className="text-[#0F172A] hover:underline">rules page</a>
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
