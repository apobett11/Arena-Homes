"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Hero } from "@/components/Hero";
import { FeaturedListings } from "@/components/FeaturedListings";
import { UnifiedFeaturesSection } from "@/components/UnifiedFeaturesSection";
import { FAQRulesSection } from "@/components/FAQRulesSection";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getCurrentUserRoleProfile, redirectToRoleHome } from "@/lib/auth/role-routing";

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
    return <main className="min-h-screen p-6 text-sm text-slate-600">Checking your session...</main>;
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Main Content Sections */}
      <FeaturedListings />
      
      {/* Unified Section: How It Works + Why Choose Us + Testimonials + Stats */}
      <UnifiedFeaturesSection />
      
      <FAQRulesSection />

    </main>
  );
}
