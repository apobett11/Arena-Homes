import { getSupabaseClient } from '@/lib/supabase/client';

export const ROLE_HOME_ROUTES: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  ACCOUNTANT: '/accountant/dashboard',
  CARETAKER: '/caretaker/dashboard',
  IT_SUPPORT: '/it-support/dashboard',
  PROPERTY_MANAGER: '/admin/properties',
  TENANT: '/tenant/dashboard',
};

export type RoleResolutionErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'MISSING_ROLE'
  | 'ACCOUNT_INACTIVE'
  | 'UNKNOWN_ROLE'
  | 'PROFILE_LOOKUP_FAILED';

export type RoleProfileResult =
  | { ok: true; userId: string; role: string; source: 'profiles' | 'employees' }
  | { ok: false; code: RoleResolutionErrorCode; message: string; userId?: string };

export function normalizeRole(role: string | null | undefined): string | null {
  if (!role) return null;
  const canonical = role.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (!canonical) return null;
  if (canonical === 'SUPER_ADMIN') return 'ADMIN';
  return canonical;
}

export function getHomeRouteForRole(role: string | null | undefined): string | null {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return null;
  return ROLE_HOME_ROUTES[normalizedRole] ?? null;
}

function devLog(message: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'development') return;
  if (details) {
    console.log(`[auth-role] ${message}`, details);
    return;
  }
  console.log(`[auth-role] ${message}`);
}

export async function getCurrentUserRoleProfile(): Promise<RoleProfileResult> {
  const supabase = getSupabaseClient();
  const { data: authData, error: userError } = await supabase.auth.getUser();

  if (userError || !authData.user) {
    return { ok: false, code: 'NOT_AUTHENTICATED', message: 'No authenticated user session found.' };
  }

  const userId = authData.user.id;
  devLog('sign-in success user id', { userId });

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role_id, is_active')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileError) {
    return {
      ok: false,
      code: 'PROFILE_LOOKUP_FAILED',
      message: profileError.message,
      userId,
    };
  }

  const profileActive = (profile as { is_active?: boolean } | null)?.is_active;
  if (profileActive === false) {
    return {
      ok: false,
      code: 'ACCOUNT_INACTIVE',
      message: 'Your account is inactive. Contact admin.',
      userId,
    };
  }

  const profileRoleRaw = (profile as { role_id?: string } | null)?.role_id;
  const profileRole = normalizeRole(profileRoleRaw);
  devLog('profile role lookup', { userId, roleId: profileRole ?? null });

  if (profileRole) {
    if (!getHomeRouteForRole(profileRole)) {
      return {
        ok: false,
        code: 'UNKNOWN_ROLE',
        message: `Unsupported role "${profileRole}". Contact admin.`,
        userId,
      };
    }
    return { ok: true, userId, role: profileRole, source: 'profiles' };
  }

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('role_id, status')
    .eq('user_id', userId)
    .maybeSingle();

  if (employeeError) {
    return {
      ok: false,
      code: 'PROFILE_LOOKUP_FAILED',
      message: employeeError.message,
      userId,
    };
  }

  const employeeStatus = (employee as { status?: string } | null)?.status;
  devLog('employee role/status lookup', { userId, status: employeeStatus ?? null });
  if (employeeStatus && employeeStatus.toUpperCase() !== 'ACTIVE') {
    return {
      ok: false,
      code: 'ACCOUNT_INACTIVE',
      message: 'Your account is inactive. Contact admin.',
      userId,
    };
  }

  const employeeRoleRaw = (employee as { role_id?: string } | null)?.role_id;
  const employeeRole = normalizeRole(employeeRoleRaw);
  devLog('employee role lookup', { userId, roleId: employeeRole ?? null });

  if (!employeeRole) {
    return {
      ok: false,
      code: 'MISSING_ROLE',
      message: 'Your account exists but has no assigned role. Contact admin.',
      userId,
    };
  }

  if (!getHomeRouteForRole(employeeRole)) {
    return {
      ok: false,
      code: 'UNKNOWN_ROLE',
      message: `Unsupported role "${employeeRole}". Contact admin.`,
      userId,
    };
  }

  return { ok: true, userId, role: employeeRole, source: 'employees' };
}

export function redirectToRoleHome(role: string | null | undefined): string | null {
  const route = getHomeRouteForRole(role);
  if (process.env.NODE_ENV === 'development') {
    devLog('final redirect route', { role: normalizeRole(role), route });
  }
  return route;
}
