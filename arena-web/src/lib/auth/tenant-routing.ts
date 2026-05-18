import { getSupabaseClient } from '@/lib/supabase/client';
import { getLoginRedirectTarget, isSafeInternalRedirect } from '@/lib/auth/safe-redirect';

export async function resolvePostLoginRoute(
  userId: string,
  redirect: string | null | undefined,
  from: string | null | undefined
): Promise<string | null> {
  const explicit = getLoginRedirectTarget(redirect, from);
  if (explicit) return explicit;

  const supabase = getSupabaseClient();

  const { data: activeTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (activeTenant) {
    return '/tenant/dashboard';
  }

  const { data: applicationData } = await supabase
    .from('tenant_applications')
    .select('has_completed_profile, has_accepted_agreement')
    .eq('converted_user_id', userId)
    .eq('status', 'ACCEPTED')
    .eq('has_set_password', true)
    .maybeSingle();

  const application = applicationData as {
    has_completed_profile: boolean;
    has_accepted_agreement: boolean;
  } | null;

  if (
    application &&
    (!application.has_completed_profile || !application.has_accepted_agreement)
  ) {
    return '/tenant/onboarding';
  }

  return null;
}

export { isSafeInternalRedirect };
