"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, HomeIcon } from "lucide-react";
import { Hero } from "@/components/Hero";
import { FeaturedListings } from "@/components/FeaturedListings";
import { HowItWorks } from "@/components/HowItWorks";
import { Testimonials } from "@/components/Testimonials";
import { TrustSection } from "@/components/TrustSection";
import { FAQRulesSection } from "@/components/FAQRulesSection";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getCurrentUserRoleProfile, redirectToRoleHome } from "@/lib/auth/role-routing";

// Final CTA Section Component - Futuristic Luxury
const FinalCTA = () => (
    <section className="py-10 md:py-12 bg-gradient-to-b from-[#F0EDE6] to-[#F8F5F0] relative overflow-hidden border-t border-[#C9B37F]/25">
        {/* Decorative gradient orbs - futuristic ambient */}
        <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-gradient-radial from-[#C9B37F]/12 via-transparent to-transparent rounded-full blur-3xl animate-mesh-glow" />
            <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-gradient-radial from-[#0F172A]/5 via-transparent to-transparent rounded-full blur-3xl" style={{ animationDelay: '-15s' }} />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <h2 className="text-xl md:text-2xl font-bold text-[#1F2937] mb-3">
                    Ready to find your student home?
                </h2>
                <p className="text-sm text-[#4B5563] mb-5 max-w-lg mx-auto">
                    Join thousands of Egerton University students who found their perfect housing through Arena Homes.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link 
                        href="/listings" 
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0F172A] text-white font-semibold hover:bg-[#1E293B] transition-all text-sm shadow-lg shadow-[#0F172A]/20 border-2 border-transparent hover:border-[#C9B37F] hover:scale-[1.02]"
                    >
                        Browse Houses
                        <ArrowRight size={16} />
                    </Link>
                    <Link 
                        href="/auth/login" 
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#F8F5F0] text-[#1F2937] font-medium hover:bg-[#F0EDE6] transition-all border-2 border-[#C9B37F]/30 hover:border-[#C9B37F] text-sm hover:scale-[1.02]"
                    >
                        Create Account
                    </Link>
                </div>
            </motion.div>
        </div>
    </section>
);

export default function Home() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;
    const timeout = window.setTimeout(() => {
      if (mounted) setCheckingSession(false);
    }, 3500);

    const checkSessionAndRedirect = async () => {
      const { data } = await getSupabaseClient().auth.getSession();
      if (!mounted) return;
      if (!data.session) {
        setCheckingSession(false);
        return;
      }

      const roleResult = await getCurrentUserRoleProfile();
      if (!mounted) return;

      if (roleResult.ok) {
        const route = redirectToRoleHome(roleResult.role);
        if (route) {
          router.replace(route);
          return;
        }
      }

      setCheckingSession(false);
    };

    void checkSessionAndRedirect();
    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [router]);

  if (checkingSession) {
    return <main className="min-h-screen p-6 text-sm text-[#4B5563] bg-[#F8F5F0]">Checking your session...</main>;
  }

  return (
    <main className="min-h-screen bg-[#F8F5F0]">
      {/* Hero Section */}
      <Hero />

      {/* Main Content Sections - Compact */}
      <FeaturedListings />
      <HowItWorks />
      <TrustSection />
      <Testimonials />
      <FAQRulesSection />

      {/* Final CTA Section */}
      <FinalCTA />
    </main>
  );
}
