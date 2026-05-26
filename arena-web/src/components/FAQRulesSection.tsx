"use client";

import { useState } from "react";
import { Plus, Minus, ScrollText, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQItem = ({
  faq,
  index,
  activeFaq,
  setActiveFaq,
}: {
  faq: { question: string; answer: string };
  index: number;
  activeFaq: number | null;
  setActiveFaq: (i: number | null) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    viewport={{ once: true }}
    className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-all ${
      activeFaq === index ? "border-vibrant-blue/40 ring-1 ring-vibrant-blue/20" : "border-slate-200"
    }`}
  >
    <button
      onClick={() => setActiveFaq(activeFaq === index ? null : index)}
      className="flex w-full items-center justify-between gap-3 p-3 text-left"
      aria-expanded={activeFaq === index}
    >
      <span className={`text-sm font-medium ${activeFaq === index ? "text-vibrant-blue" : "text-slate-900"}`}>
        {faq.question}
      </span>
      <div
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all ${
          activeFaq === index ? "bg-vibrant-blue text-white" : "bg-slate-100 text-slate-600"
        }`}
      >
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
          <div className="border-t border-slate-200 bg-slate-50/80 px-3 pb-3 pt-0">
            <p className="pt-2 text-xs leading-relaxed text-slate-700">{faq.answer}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

const RuleItem = ({ rule, index }: { rule: { title: string; desc: string; type: string }; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    viewport={{ once: true }}
    className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
  >
    <div className="flex items-start gap-3">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          rule.type === "alert" ? "bg-rose-100 text-rose-600" : "bg-vibrant-blue/10 text-vibrant-blue"
        }`}
      >
        {rule.type === "alert" ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
      </div>
      <div>
        <h4 className="mb-0.5 text-sm font-semibold text-slate-900">{rule.title}</h4>
        <p className="text-xs leading-relaxed text-slate-600">{rule.desc}</p>
      </div>
    </div>
  </motion.div>
);

const faqs = [
  {
    question: "How do I book a room viewing?",
    answer:
      "Simply browse our listings, click on any property you're interested in, and click the 'Schedule Viewing' button. Select a date and time that works for you, and the caretaker will confirm your appointment within 24 hours.",
  },
  {
    question: "What areas near Egerton University do you cover?",
    answer:
      "We currently cover all major areas around Egerton University including Njoro Town, Main Gate, Njokerio, Milimani, Blue Valley Estate, and the Town Center. All our listings are within walking or biking distance to campus.",
  },
  {
    question: "How much is the typical rent for student housing?",
    answer:
      "Our student housing options range from KSh 3,500 to KSh 15,000 per month depending on the location, room type, and amenities. Single rooms typically cost KSh 4,500-7,000, bedsitters KSh 5,500-8,500, and 1-bedroom apartments KSh 8,000-15,000.",
  },
  {
    question: "Is there a security deposit required?",
    answer:
      "Yes, most landlords require a security deposit equal to one month's rent. This is refundable at the end of your tenancy if the room is left in good condition. Some properties also require a small booking fee to secure your spot.",
  },
  {
    question: "Can I pay rent monthly or do I need to pay per semester?",
    answer:
      "Most of our listings offer flexible payment options. While some landlords prefer semester payments (3-4 months), many accept monthly payments. You can filter listings by payment terms in our search options.",
  },
];

const rules = [
  {
    title: "Respect for Property",
    desc: "Maintain the premises in the condition it was provided. Report any damages immediately to the caretaker.",
    type: "important",
  },
  {
    title: "Quiet Hours",
    desc: "Observe quiet hours between 10:00 PM and 8:00 AM to respect neighboring residents and ensure study time.",
    type: "regulation",
  },
  {
    title: "Guest Policy",
    desc: "Day guests are welcome. Overnight guests must be registered through the platform for security.",
    type: "regulation",
  },
  {
    title: "Safety First",
    desc: "No combustible materials, illegal substances, or unauthorized electrical modifications to the unit.",
    type: "alert",
  },
];

export const FAQRulesSection = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<"faq" | "rules">("faq");

  return (
    <section id="faqs" className="public-home-light-zone relative overflow-hidden py-12 [color-scheme:light] md:py-16">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Information
          </span>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
            FAQs & <span className="text-vibrant-blue">House Rules</span>
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            Everything you need to know about finding and living in your student home
          </p>
        </div>

        {/* Subtle enclosing card — visible on white page background */}
        <div className="rounded-[28px] border border-slate-200/90 bg-[#eef2f7] p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] md:p-8 lg:p-10">
          <div className="mb-6 flex gap-2 lg:hidden">
            <button
              onClick={() => setActiveTab("faq")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === "faq"
                  ? "bg-vibrant-blue text-white shadow-md shadow-vibrant-blue/20"
                  : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              FAQ
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === "rules"
                  ? "bg-vibrant-blue text-white shadow-md shadow-vibrant-blue/20"
                  : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              Rules
            </button>
          </div>

          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`${activeTab !== "faq" ? "hidden lg:block" : ""}`}
            >
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/15">
                  <ScrollText size={20} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h3>
              </div>

              <div className="scrollbar-thin max-h-[400px] space-y-2 overflow-y-auto pr-1">
                {faqs.map((faq, index) => (
                  <FAQItem
                    key={index}
                    faq={faq}
                    index={index}
                    activeFaq={activeFaq}
                    setActiveFaq={setActiveFaq}
                  />
                ))}
              </div>
            </motion.div>

            <motion.div
              id="rules"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`${activeTab !== "rules" ? "hidden lg:block" : ""}`}
            >
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/15">
                  <CheckCircle2 size={20} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">House Rules</h3>
              </div>

              <div className="scrollbar-thin max-h-[400px] space-y-2 overflow-y-auto pr-1">
                {rules.map((rule, index) => (
                  <RuleItem key={index} rule={rule} index={index} />
                ))}
              </div>

              <p className="mt-3 text-center text-xs text-slate-500">
                View full rules on our{" "}
                <a href="/rules" className="font-semibold text-blue-600 hover:underline">
                  rules page
                </a>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
