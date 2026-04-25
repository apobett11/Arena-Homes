"use client";

import RoleGate from "@/components/auth/RoleGate";

export default function ITSupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGate allowedRoles={["IT_SUPPORT", "ADMIN"]}>{children}</RoleGate>;
}
