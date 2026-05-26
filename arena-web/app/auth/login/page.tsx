'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getCurrentUserRoleProfile, redirectToRoleHome } from '@/lib/auth/role-routing';
import { resolvePostLoginRoute } from '@/lib/auth/tenant-routing';
import { Home, ArrowRight, Eye, EyeOff, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isTenantError, setIsTenantError] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError('');
        setIsTenantError(false);

        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        try {
            await AuthApi.login(email, password);
            const roleResult = await getCurrentUserRoleProfile();

            if (!roleResult.ok) {
                if (roleResult.code === 'ACCOUNT_INACTIVE') {
                    await getSupabaseClient().auth.signOut();
                    setError('Your account is inactive. Contact admin.');
                    setLoading(false);
                    return;
                }
                if (roleResult.code === 'MISSING_ROLE') {
                    setError('Your account exists but has no assigned role. Contact admin.');
                    setLoading(false);
                    return;
                }
                setError(roleResult.message);
                setLoading(false);
                return;
            }

            const tenantRoute = await resolvePostLoginRoute(
                roleResult.userId,
                searchParams.get('redirect'),
                searchParams.get('from')
            );
            if (tenantRoute) {
                router.replace(tenantRoute);
                return;
            }

            const targetRoute = redirectToRoleHome(roleResult.role);
            if (!targetRoute) {
                setError('Your account role is not mapped to a dashboard route. Contact admin.');
                setLoading(false);
                return;
            }

            router.replace(targetRoute);
            return;
        } catch (err: any) {
            const errorMessage = err?.message ?? 'Login failed';
            if (errorMessage.includes('NOT_A_TENANT') || errorMessage.includes('need to be a tenant') || errorMessage.includes('apply')) {
                setIsTenantError(true);
                setError('You need to be a tenant to login. Apply for a property first!');
            } else {
                setError(errorMessage);
            }
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative">
                <Image
                    src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80"
                    alt="Student housing"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-slate-900/40" />
                <div className="absolute inset-0 flex flex-col justify-center p-12">
                    <Link href="/" className="flex items-center gap-2.5 mb-8">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm text-white">
                            <Home size={22} />
                        </div>
                        <span className="text-2xl font-bold text-white">
                            Arena<span className="text-primary">Homes</span>
                        </span>
                    </Link>
                    <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                        Welcome Back
                    </h2>
                    <p className="text-lg text-white/80 max-w-md">
                        Sign in to access your dashboard, manage your bookings, and find your perfect student home.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white dark:bg-slate-950">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8">
                        <Link href="/" className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-premium text-white">
                                <Home size={22} />
                            </div>
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                Arena<span className="text-primary">Homes</span>
                            </span>
                        </Link>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Sign In
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    {error && (
                        <div className={`mb-6 p-4 rounded-xl border text-sm ${isTenantError 
                            ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300' 
                            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                        }`}>
                            <div className="flex items-start gap-3">
                                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium">{error}</p>
                                    {isTenantError && (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs font-medium">How to become a tenant:</p>
                                            <ol className="text-xs space-y-1.5 list-decimal list-inside">
                                                <li>Go back to <Link href="/" className="underline font-semibold">homepage</Link> and find a property you like</li>
                                                <li>Click <strong>&quot;Apply / Show Interest&quot;</strong> on the property card</li>
                                                <li>Fill in your details and submit the application</li>
                                                <li>Wait for the caretaker to <strong>approve</strong> your application</li>
                                                <li>Once approved, you&apos;ll receive login credentials via email</li>
                                                <li>Complete your profile, change password, and accept the user agreement</li>
                                            </ol>
                                            <div className="pt-2">
                                                <Link 
                                                    href="/listings" 
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold underline hover:no-underline"
                                                >
                                                    <ArrowLeft size={12} />
                                                    Go to Listings to Apply
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Email Address
                            </label>
                            <input
                                name="email"
                                type="email"
                                required
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="Enter your password"
                                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                                <input type="checkbox" className="rounded border-slate-300" />
                                <span>Remember me</span>
                            </label>
                            <a href="#" className="text-primary hover:underline font-medium">
                                Forgot password?
                            </a>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full h-12 rounded-xl bg-gold-accent text-slate-900 font-bold transition-all shadow-lg shadow-gold-accent/35 hover:bg-[#f5c842] hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Sign In <ArrowRight size={18} />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
                        <p className="text-base font-medium leading-relaxed text-slate-800">
                            <strong className="font-bold text-slate-900">New here?</strong> You need to apply for a property first.
                        </p>
                        <Link 
                            href="/listings" 
                            className="mt-3 inline-flex items-center justify-center gap-2 text-base font-bold text-gold-accent hover:text-[#d4a017] underline-offset-4 hover:underline"
                        >
                            <Send size={18} className="text-gold-accent" />
                            Browse Properties & Apply
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
                    <p className="text-slate-600 dark:text-slate-400">Loading...</p>
                </div>
            }
        >
            <LoginPageContent />
        </Suspense>
    );
}
