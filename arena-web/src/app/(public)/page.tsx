"use client";

import { Hero } from "@/components/Hero";
import { FeaturedListings } from "@/components/FeaturedListings";
import { HowItWorks } from "@/components/HowItWorks";
import { Testimonials } from "@/components/Testimonials";
import { StaticMap } from "@/components/StaticMap";
import { TrustSection } from "@/components/TrustSection";
import { FAQSection } from "@/components/FAQSection";
import { RulesSection } from "@/components/RulesSection";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="relative">
        <Hero />
      </div>



      {/* Sections with reduced spacing py-24 -> py-16 */}
      <div className="space-y-0">
        <FeaturedListings />
        <HowItWorks />
        <Testimonials />



        <StaticMap />
        <TrustSection />

        {/* New Sections at the bottom */}
        <FAQSection />
        <RulesSection />
      </div>
    </main>
  );
}
