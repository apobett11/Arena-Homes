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
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface-navy transition-opacity duration-700"
        aria-live="polite"
      >
        <div className="relative mb-6 h-24 w-24">
          <div className="absolute inset-0 rounded-full border-4 border-vibrant-blue/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-vibrant-blue border-r-transparent border-b-transparent border-l-transparent" />
        </div>
        <p className="font-semibold tracking-tight text-primary-fixed-dim text-[24px] leading-tight">
          Checking your session...
        </p>
      </div>
    );
  }

  return (
    <>
      <Hero />

      <FeaturedListings />

      <UnifiedFeaturesSection />

      <FAQRulesSection />
    </>
  );
}
