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
        <section className="py-16 md:py-24 bg-white dark:bg-slate-950">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 block">Got Questions?</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                        Frequently Asked Questions
                    </h2>
                    <p className="mt-3 text-slate-600 dark:text-slate-400">
                        Everything you need to know about finding student housing
                    </p>
                </motion.div>

                <div className="space-y-3">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            className={`border rounded-2xl overflow-hidden transition-all ${
                                activeIndex === index 
                                    ? "border-primary/30 bg-primary/5" 
                                    : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                        >
                            <button
                                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-5 text-left gap-4"
                            >
                                <span className={`font-semibold text-base ${activeIndex === index ? "text-primary" : "text-slate-900 dark:text-white"}`}>
                                    {faq.question}
                                </span>
                                <div className={`h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full transition-all ${
                                    activeIndex === index 
                                        ? "bg-primary text-white rotate-0" 
                                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                }`}>
                                    {activeIndex === index ? <Minus size={16} /> : <Plus size={16} />}
                                </div>
                            </button>

                            <AnimatePresence>
                                {activeIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 pb-5 pt-0 text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200 dark:border-slate-700">
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
                    className="mt-10 text-center"
                >
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Still have questions?{" "}
                        <a href="/contact" className="text-primary font-semibold hover:underline">
                            Contact our support team
                        </a>
                    </p>
                </motion.div>
            </div>
        </section>
    );
};
