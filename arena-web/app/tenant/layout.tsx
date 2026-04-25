"use client";

import RoleGate from "@/components/auth/RoleGate";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGate allowedRoles={["TENANT", "ADMIN"]}>{children}</RoleGate>;
}
