"use client";

import { usePathname } from "next/navigation";
import RoleGate from "@/components/auth/RoleGate";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Allow unauthenticated access to setup and onboarding flows
  // These routes handle their own auth state
  const isPublicTenantRoute =
    pathname?.startsWith("/tenant/setup") ||
    pathname?.startsWith("/tenant/onboarding");

  if (isPublicTenantRoute) {
    return <>{children}</>;
  }

  return <RoleGate allowedRoles={["TENANT", "ADMIN"]}>{children}</RoleGate>;
}
