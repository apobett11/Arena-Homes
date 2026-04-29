"use client";

import { useState } from "react";
import { Plus, Minus, HelpCircle } from "lucide-react";
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
    {
        question: "How do I contact the caretaker or landlord?",
        answer: "Once you create an account and express interest in a property, you'll have access to our secure messaging system. You can chat directly with the caretaker, ask questions, arrange viewings, and discuss lease terms all within the platform."
    }
];

export const FAQSection = () => {
    const [activeIndex, setActiveIndex] = useState<number | null>(0);

    return (
        <section className="py-20 md:py-28 bg-gradient-to-b from-[#F8FAFC] to-white dark:from-slate-950 dark:to-slate-900 overflow-hidden">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                        <HelpCircle size={14} />
                        Got Questions?
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white">
                        Frequently Asked <span className="text-gradient">Questions</span>
                    </h2>
                    <p className="mt-4 text-slate-600 dark:text-slate-400 text-base md:text-lg">
                        Everything you need to know about finding student housing near Egerton University
                    </p>
                </motion.div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.08 }}
                            className={`card-premium overflow-hidden transition-all ${
                                activeIndex === index 
                                    ? "border-primary/30 shadow-glow" 
                                    : "hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                        >
                            <button
                                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left gap-4"
                                aria-expanded={activeIndex === index}
                            >
                                <span className={`font-semibold text-base ${activeIndex === index ? "text-primary" : "text-slate-900 dark:text-white"}`}>
                                    {faq.question}
                                </span>
                                <div className={`h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl transition-all ${
                                    activeIndex === index 
                                        ? "bg-primary text-white" 
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                }`}>
                                    {activeIndex === index ? <Minus size={18} /> : <Plus size={18} />}
                                </div>
                            </button>

                            <AnimatePresence>
                                {activeIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-6 pt-0 text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                                            <p className="pt-4 text-sm md:text-base">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {/* Contact CTA */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-12 text-center"
                >
                    <div className="inline-flex flex-col sm:flex-row items-center gap-3 px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <HelpCircle size={20} className="text-primary" />
                        <p className="text-slate-700 dark:text-slate-300 text-sm">
                            Still have questions?{" "}
                            <a href="/contact" className="text-primary font-semibold hover:underline">
                                Contact our support team
                            </a>
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
