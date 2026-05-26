"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Search, ArrowRightLeft, ClipboardList, KeyRound, ShieldCheck, GraduationCap, Scale, Headphones, Star } from "lucide-react";

const HOW_STEPS = [
  { icon: Search, title: "Search", desc: "Browse verified listings." },
  { icon: ArrowRightLeft, title: "Compare", desc: "Distance & prices." },
  { icon: ClipboardList, title: "Apply", desc: "Reserve instantly." },
  { icon: KeyRound, title: "Move In", desc: "Start your semester." },
] as const;

const WHY_FEATURES = [
  { icon: ShieldCheck, title: "Verified", desc: "Physical inspections." },
  { icon: GraduationCap, title: "Student First", desc: "Tailored policies." },
  { icon: Scale, title: "Transparent", desc: "No agency fees." },
  { icon: Headphones, title: "Fast", desc: "24hr support." },
] as const;

const REVIEWS = [
  { name: "Sarah K.", role: "Nursing Student", text: "Found my perfect room in 2 days!", avatar: "SK", rating: 5 },
  { name: "James M.", role: "Engineering", text: "Best platform for student housing.", avatar: "JM", rating: 5 },
  { name: "Grace N.", role: "Education", text: "Transparent pricing, no surprises.", avatar: "GN", rating: 5 },
];

const WHY_IMAGE =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80";

export const UnifiedFeaturesSection = () => {
  return (
    <section
      id="how-it-works"
      className="public-home-light-zone relative bg-slate-50 py-6 [color-scheme:light] md:py-stack-lg"
    >
      <div className="pointer-events-none absolute inset-0 h-16 bg-gradient-to-b from-slate-100 to-slate-50 md:h-40" />

      <div className="relative z-10 mx-auto max-w-[1280px] px-4 md:px-10">
        {/* How it works */}
        <div className="mb-6 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-xl md:mb-12 md:rounded-[40px]">
          <div className="p-5 md:p-stack-lg">
            <div className="mb-4 text-center md:mb-12">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-vibrant-blue">Process</span>
              <h2 className="mt-1 text-[24px] font-bold leading-tight text-slate-900 md:text-3xl">How It Works</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-gutter">
              {HOW_STEPS.map((step) => (
                <div
                  key={step.title}
                  className="group flex flex-col items-center text-center transition-transform hover:scale-[1.02]"
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-vibrant-blue/10 text-vibrant-blue transition-transform group-hover:scale-110 md:mb-4 md:h-16 md:w-16 md:rounded-2xl">
                    <step.icon className="h-5 w-5 md:h-8 md:w-8" aria-hidden />
                  </div>
                  <h4 className="mb-1 text-xs font-semibold text-slate-900 md:text-sm">{step.title}</h4>
                  <p className="text-[9px] leading-snug text-slate-600 md:text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Why Arena Homes */}
        <div className="mb-6 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-xl md:rounded-[40px]">
          <div className="p-5 md:p-stack-lg">
            <div className="grid grid-cols-1 items-center gap-4 md:gap-stack-lg lg:grid-cols-2">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-vibrant-blue">Our Edge</span>
                <h2 className="mb-3 mt-1 text-xl font-semibold text-slate-900 md:mb-6 md:text-2xl">
                  Why Arena Homes?
                </h2>
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  {WHY_FEATURES.map((f) => (
                    <div
                      key={f.title}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 shadow-sm md:rounded-2xl md:p-4"
                    >
                      <f.icon className="mb-1 h-4 w-4 text-vibrant-blue md:h-5 md:w-5" aria-hidden />
                      <h5 className="text-[10px] font-semibold text-slate-900 md:text-sm">{f.title}</h5>
                      <p className="text-[8px] text-slate-600 md:text-xs">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative mt-3 h-[180px] overflow-hidden rounded-2xl border border-slate-200 shadow-lg md:mt-0 md:h-[400px] md:rounded-3xl">
                <Image src={WHY_IMAGE} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials + stats */}
        <div className="mt-6 p-5 md:p-stack-lg">
          <div className="mb-6 text-center md:mb-12">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-vibrant-blue">Testimonials</span>
            <h2 className="mt-1 text-xl font-semibold text-slate-900 md:text-2xl">Student Stories</h2>
          </div>

          <div className="-mx-4 mb-6 flex gap-4 overflow-x-auto px-4 hide-scrollbar md:mx-0 md:mb-12 md:grid md:min-w-0 md:grid-cols-3 md:gap-gutter md:px-0">
            {REVIEWS.map((review, index) => (
              <motion.div
                key={review.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                viewport={{ once: true }}
                className="min-w-[280px] flex-shrink-0 rounded-[24px] border border-slate-200 bg-white p-6 shadow-lg transition-transform hover:-translate-y-1 md:min-w-0 md:rounded-[32px] md:p-8"
              >
                <div className="mb-3 flex items-center gap-0.5 text-gold-accent md:mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 md:h-5 md:w-5 ${s <= review.rating ? "fill-gold-accent text-gold-accent" : "text-slate-300"}`}
                    />
                  ))}
                </div>
                <p className="mb-6 text-xs italic leading-relaxed text-slate-600 md:mb-8 md:text-sm">&ldquo;{review.text}&rdquo;</p>
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-vibrant-blue/20 bg-vibrant-blue/10 text-sm font-bold text-vibrant-blue md:h-12 md:w-12 md:text-base">
                    {review.avatar}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 md:text-sm">{review.name}</div>
                    <div className="text-[8px] font-semibold uppercase tracking-wider text-slate-500 md:text-[10px]">
                      {review.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {[
              { value: "4.9/5", label: "Rating" },
              { value: "500+", label: "Students" },
              { value: "98%", label: "Recommend" },
            ].map((stat) => (
              <div key={stat.label} className="px-4 text-center">
                <span className="block text-lg font-bold text-vibrant-blue">{stat.value}</span>
                <span className="text-xs text-slate-600">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
