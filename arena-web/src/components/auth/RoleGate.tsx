"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  getCurrentUserRoleProfile,
  getHomeRouteForRole,
  normalizeRole,
} from "@/lib/auth/role-routing";

interface RoleGateProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

function devLog(message: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") return;
  if (details) {
    console.log(`[role-gate] ${message}`, details);
    return;
  }
  console.log(`[role-gate] ${message}`);
}

export default function RoleGate({ allowedRoles, children }: RoleGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const allowed = useMemo(
    () => allowedRoles.map((role) => normalizeRole(role)).filter(Boolean) as string[],
    [allowedRoles]
  );

  useEffect(() => {
    let isMounted = true;

    const enforceRole = async () => {
      devLog("checking session/role", { pathname, allowedRoles: allowed });
      const result = await getCurrentUserRoleProfile();
      if (!isMounted) return;

      if (!result.ok) {
        devLog("session found", { hasSession: false, code: result.code });
        if (result.code === "NOT_AUTHENTICATED") {
          devLog("final redirect route", {
            to: "/auth/login",
            from: pathname || "/",
            reason: "NOT_AUTHENTICATED",
          });
          router.replace(`/auth/login?from=${encodeURIComponent(pathname || "/")}`);
          return;
        }

        if (result.code === "ACCOUNT_INACTIVE") {
          await getSupabaseClient().auth.signOut();
          setError("Your account is inactive. Contact admin.");
          setState("error");
          return;
        }

        setError(
          result.code === "MISSING_ROLE"
            ? "Your account exists but has no assigned role. Contact admin."
            : result.message
        );
        setState("error");
        return;
      }

      devLog("session found", { hasSession: true });
      devLog("role found", { role: result.role, source: result.source });
      if (!allowed.includes(result.role)) {
        const redirectRoute = getHomeRouteForRole(result.role);
        if (redirectRoute) {
          devLog("final redirect route", { to: redirectRoute, reason: "ROLE_NOT_ALLOWED" });
          router.replace(redirectRoute);
          return;
        }
        setError("Your role does not have a configured dashboard route.");
        setState("error");
        return;
      }

      setState("ready");
    };

    void enforceRole();
    return () => {
      isMounted = false;
    };
  }, [allowed, pathname, router]);

  if (state === "loading") {
    return <div className="p-6 text-sm text-slate-400">Checking account permissions...</div>;
  }

  if (state === "error") {
    return <div className="p-6 text-sm text-red-400">{error}</div>;
  }

  return <>{children}</>;
}
