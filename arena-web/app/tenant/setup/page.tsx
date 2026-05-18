'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, ArrowRight, Home } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SetupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';

  const [tokenChecked, setTokenChecked] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setTokenChecked(true);
    setHasValidToken(Boolean(token));
  }, [token]);

  const goToLogin = () => {
    router.replace('/auth/login?redirect=/tenant/onboarding');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!password) {
      setSubmitError('Password is required');
      return;
    }

    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match');
      return;
    }

    if (!token) {
      setSubmitError('Invalid setup link. Please request a new setup email.');
      return;
    }

    setIsSubmitting(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = getSupabaseClient() as any;

      const { data, error } = await supabase.rpc('verify_setup_token_and_set_password', {
        p_raw_token: token,
        p_new_password: password,
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data as { success: boolean; error?: string; email?: string } | null;
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to set password');
      }

      if (result.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: result.email,
          password,
        });
        if (!signInError) {
          router.replace('/tenant/onboarding');
          return;
        }
      }

      setIsSuccess(true);
      setTimeout(goToLogin, 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tokenChecked) {
    return (
      <Panel className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </Panel>
    );
  }

  if (!hasValidToken) {
    return (
      <Panel className="p-8 text-center">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Invalid Setup Link</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Invalid setup link. Please request a new setup email.
        </p>
      </Panel>
    );
  }

  if (isSuccess) {
    return (
      <Panel className="p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Password Set Successfully</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Password set successfully. Please sign in to complete your tenant onboarding.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Redirecting to sign in...</p>
        <button
          type="button"
          onClick={goToLogin}
          className="w-full py-3 px-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all flex items-center justify-center gap-2"
        >
          Sign In
          <ArrowRight className="w-4 h-4" />
        </button>
      </Panel>
    );
  }

  return (
    <Panel className="overflow-hidden">
      <div className="bg-primary p-6 text-white text-center">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Home className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold">Welcome to Arena Homes</h1>
        <p className="text-white/80 text-sm">Set your password to continue onboarding</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {submitError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Confirm Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? 'Setting Password...' : 'Set Password'}
          {!isSubmitting && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
    </Panel>
  );
}

export default function TenantSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
          <Panel className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          </Panel>
        </div>
      }
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <SetupPageContent />
      </div>
    </Suspense>
  );
}
