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

// Final CTA Section Component - Compact
const FinalCTA = () => (
    <section className="py-10 md:py-12 bg-gradient-navy relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
                    Ready to find your student home?
                </h2>
                <p className="text-sm text-white/70 mb-5 max-w-lg mx-auto">
                    Join thousands of Egerton University students who found their perfect housing through Arena Homes.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link 
                        href="/listings" 
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white text-slate-900 font-semibold hover:bg-white/90 transition-all text-sm"
                    >
                        Browse Houses
                        <ArrowRight size={16} />
                    </Link>
                    <Link 
                        href="/auth/login" 
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-all border border-white/20 text-sm"
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
    return <main className="min-h-screen p-6 text-sm text-slate-400">Checking your session...</main>;
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
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
