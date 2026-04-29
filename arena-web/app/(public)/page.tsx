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
import { StaticMap } from "@/components/StaticMap";
import { TrustSection } from "@/components/TrustSection";
import { FAQSection } from "@/components/FAQSection";
import { RulesSection } from "@/components/RulesSection";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getCurrentUserRoleProfile, redirectToRoleHome } from "@/lib/auth/role-routing";

// Final CTA Section Component
const FinalCTA = () => (
    <section className="py-20 md:py-28 bg-gradient-navy relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-blue-500/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-radial from-amber-500/5 to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/10 mb-8">
                    <HomeIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                    Ready to find your next student home?
                </h2>
                <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
                    Join thousands of Egerton University students who found their perfect housing through Arena Homes. 
                    Browse verified listings and apply in minutes.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link 
                        href="/listings" 
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-slate-900 font-bold hover:bg-white/90 transition-all hover:scale-105 shadow-xl"
                    >
                        Browse Houses
                        <ArrowRight size={18} />
                    </Link>
                    <Link 
                        href="/auth/login" 
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all border border-white/20"
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

      {/* Main Content Sections */}
      <FeaturedListings />
      <HowItWorks />
      <TrustSection />
      <StaticMap />
      <Testimonials />
      <FAQSection />
      <RulesSection />

      {/* Final CTA Section */}
      <FinalCTA />
    </main>
  );
}
