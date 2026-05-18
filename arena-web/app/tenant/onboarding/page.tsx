'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, CheckCircle, AlertTriangle, Home } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import TenantModal from '@/components/tenant/TenantModal';

const TERMS_PLACEHOLDER = `Terms and Conditions (v1)

1. Rent is due on or before the 5th of each month.
2. Maintain the property in good condition and report damages promptly.
3. No sub-letting without written consent from Arena Homes.
4. Follow all house rules and community guidelines.
5. Provide accurate contact details and keep them up to date.`;

const HOUSE_RULES_PLACEHOLDER = `House Rules (v1)

1. Quiet hours are from 10:00 PM to 8:00 AM.
2. No illegal activities or substances on the premises.
3. Dispose of waste properly and keep shared areas clean.
4. Notify the caretaker of extended absences over 7 days.
5. Two months notice is required before vacating.`;

function formatEmergencyContact(name: string, phone: string): string | null {
  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  if (trimmedName && trimmedPhone) return `${trimmedName} - ${trimmedPhone}`;
  if (trimmedName) return trimmedName;
  if (trimmedPhone) return trimmedPhone;
  return null;
}

export default function TenantOnboarding() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [canOnboard, setCanOnboard] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace('/auth/login?redirect=/tenant/onboarding');
          return;
        }

        const { data: activeTenant, error: tenantError } = await supabase
          .from('tenants')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('status', 'ACTIVE')
          .maybeSingle();

        if (tenantError) {
          setError('Failed to check tenant status. Please refresh.');
          setIsLoading(false);
          return;
        }

        if (activeTenant) {
          router.replace('/tenant/dashboard');
          return;
        }

        const { data: applicationData, error: appError } = await supabase
          .from('tenant_applications')
          .select('id, has_set_password, has_completed_profile, has_accepted_agreement')
          .eq('converted_user_id', user.id)
          .eq('status', 'ACCEPTED')
          .eq('has_set_password', true)
          .order('created_at', { ascending: false })
          .maybeSingle();

        if (appError) {
          setError('Failed to load onboarding status. Please refresh.');
          setIsLoading(false);
          return;
        }

        const application = applicationData as {
          id: string;
          has_set_password: boolean;
          has_completed_profile: boolean;
          has_accepted_agreement: boolean;
        } | null;

        if (
          !application ||
          (application.has_completed_profile && application.has_accepted_agreement)
        ) {
          setError('No pending onboarding application found for this account.');
          setIsLoading(false);
          return;
        }

        setCanOnboard(true);
        setIsLoading(false);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to load onboarding status. Please refresh.';
        setError(message);
        setIsLoading(false);
      }
    }

    void checkStatus();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();

    if (!trimmedFirst || !trimmedLast) {
      setError('First name and last name are required.');
      return;
    }

    if (!phoneNumber.trim()) {
      setError('Phone number is required.');
      return;
    }

    if (!agreementAccepted) {
      setError('You must agree to the Terms and Conditions and the House Rules.');
      return;
    }

    setIsSubmitting(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = getSupabaseClient() as any;
      const emergencyContactCombined = formatEmergencyContact(
        emergencyContactName,
        emergencyContactPhone
      );

      const { data, error: rpcError } = await supabase.rpc('complete_tenant_onboarding', {
        p_full_name: fullName,
        p_phone_number: phoneNumber.trim(),
        p_whatsapp_number: whatsappNumber.trim() || null,
        p_emergency_contact: emergencyContactCombined,
        p_terms_version: 'v1',
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const result = data as { success: boolean; error?: string } | null;
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to complete onboarding');
      }

      router.replace('/tenant/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to complete onboarding. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const shellClass =
    'min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4';

  if (isLoading) {
    return (
      <div className={shellClass}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!canOnboard) {
    return (
      <div className={shellClass}>
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Onboarding Unavailable</h1>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-primary p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Home size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Complete Your Tenant Setup</h1>
              <p className="text-white/80 text-sm">
                Add your contact details and accept the house terms to access your dashboard.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Personal information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  First name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Last name *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Contact information
            </h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Phone number *
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+254..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                WhatsApp number
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="Same as phone if not different"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Emergency contact
            </h2>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Emergency contact <strong>(optional)</strong>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="Contact name"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="Contact phone"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </section>

          <section className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Agreement
            </h2>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreementAccepted}
                onChange={(e) => setAgreementAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                required
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="text-primary font-medium underline hover:no-underline"
                >
                  Terms and Conditions
                </button>{' '}
                and the{' '}
                <button
                  type="button"
                  onClick={() => setRulesOpen(true)}
                  className="text-primary font-medium underline hover:no-underline"
                >
                  House Rules
                </button>
                .
              </span>
            </label>
          </section>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Completing Setup...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Complete Setup & Access Dashboard
              </>
            )}
          </button>
        </form>
      </div>

      <TenantModal open={termsOpen} onClose={() => setTermsOpen(false)} title="Terms and Conditions">
        <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans">{TERMS_PLACEHOLDER}</pre>
      </TenantModal>
      <TenantModal open={rulesOpen} onClose={() => setRulesOpen(false)} title="House Rules">
        <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans">{HOUSE_RULES_PLACEHOLDER}</pre>
      </TenantModal>
    </div>
  );
}
