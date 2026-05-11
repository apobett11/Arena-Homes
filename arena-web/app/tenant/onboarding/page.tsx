'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, FileText, CheckCircle, AlertTriangle, Home } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function TenantOnboarding() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    // Form data
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');
    const [agreementAccepted, setAgreementAccepted] = useState(false);

    useEffect(() => {
        async function checkStatus() {
            try {
                const supabase = getSupabaseClient() as any;
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.replace('/auth/login?from=/tenant/onboarding');
                    return;
                }

                // Check tenant and application status
                const { data: tenantData, error: tenantError } = await supabase
                    .from('tenants')
                    .select('id, status, user_id, email')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .maybeSingle();

                if (tenantError) {
                    console.error('Error checking tenant status:', tenantError);
                    setError('Failed to check tenant status. Please refresh.');
                    setIsLoading(false);
                    return;
                }

                if (!tenantData) {
                    setError('No tenant record found. Please contact support.');
                    setIsLoading(false);
                    return;
                }

                const tenant = tenantData as { id: string; status: string; user_id: string; email: string };

                // Check tenant_applications for onboarding flags
                const { data: appData, error: appError } = await supabase
                    .from('tenant_applications')
                    .select('has_set_password, has_completed_profile, has_accepted_agreement, conversion_status')
                    .eq('converted_user_id', user.id)
                    .or(`converted_tenant_id.eq.${tenant.id}`)
                    .order('created_at', { ascending: false })
                    .maybeSingle();

                const application = appData as {
                    has_set_password: boolean;
                    has_completed_profile: boolean;
                    has_accepted_agreement: boolean;
                    conversion_status: string;
                } | null;

                if (appError) {
                    console.error('Error checking application status:', appError);
                }

                // If already ACTIVE and all flags true, go to dashboard
                if (tenant.status === 'ACTIVE') {
                    if (application?.has_set_password && application?.has_completed_profile && application?.has_accepted_agreement) {
                        router.replace('/tenant/dashboard');
                        return;
                    }
                }

                // If has_set_password is false, redirect to setup
                if (application && !application.has_set_password) {
                    setError('Please set your password first. Check your email for the setup link.');
                    setIsLoading(false);
                    return;
                }

                // Pre-fill email-based tenant info if available
                if (tenant.email && !fullName) {
                    // Try to extract name from email or leave blank for user to fill
                }

                setIsLoading(false);
            } catch (err: any) {
                console.error('Onboarding status check failed:', err);
                setError(err?.message || 'Failed to load onboarding status. Please refresh the page.');
                setIsLoading(false);
            }
        }

        checkStatus();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!fullName.trim() || !phoneNumber.trim()) {
            setError('Please fill in all required fields (Full Name and Phone Number)');
            return;
        }

        if (!agreementAccepted) {
            setError('You must accept the terms and conditions to continue');
            return;
        }

        setIsSubmitting(true);

        try {
            const supabase = getSupabaseClient() as any;

            // Call the complete_tenant_onboarding RPC
            const { data, error: rpcError } = await supabase.rpc('complete_tenant_onboarding', {
                p_full_name: fullName.trim(),
                p_phone_number: phoneNumber.trim(),
                p_whatsapp_number: whatsappNumber.trim() || null,
                p_emergency_contact: emergencyContact.trim() || null,
                p_terms_version: 'v1',
            });

            if (rpcError) {
                throw new Error(rpcError.message);
            }

            const result = data as {
                success: boolean;
                error?: string;
                tenant_id?: string;
                user_id?: string;
                tenant_status?: string;
                lease_status?: string;
            } | null;

            if (!result?.success) {
                throw new Error(result?.error || 'Failed to complete onboarding');
            }

            // Success - show completion state
            setIsComplete(true);

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                router.replace('/tenant/dashboard');
            }, 2000);
        } catch (err: any) {
            console.error('Onboarding error:', err);
            setError(err?.message || 'Failed to complete onboarding. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show loading spinner while checking status
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Success state
    if (isComplete) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center"
                >
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome to Arena Homes!</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Your onboarding is complete. Redirecting to your dashboard...
                    </p>
                    <div className="animate-pulse text-sm text-slate-500">Please wait</div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden"
            >
                {/* Header */}
                <div className="bg-primary p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <Home size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Complete Your Profile</h1>
                            <p className="text-white/80 text-sm">Finalize your tenant account setup</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-emerald-800 dark:text-emerald-300">
                                Your password has been set! Complete your profile below to access your tenant dashboard.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Full Name *
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Your full name"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Phone Number *
                        </label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+254..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            WhatsApp Number
                        </label>
                        <input
                            type="tel"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            placeholder="Same as phone if not different"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Emergency Contact
                        </label>
                        <input
                            type="text"
                            value={emergencyContact}
                            onChange={(e) => setEmergencyContact(e.target.value)}
                            placeholder="Name and phone number"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            This will be used in case of emergencies
                        </p>
                    </div>

                    {/* Terms Agreement */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 max-h-48 overflow-y-auto text-sm text-slate-700 dark:text-slate-300 space-y-2 mb-4">
                            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Tenant Agreement
                            </h4>
                            <p className="text-xs">
                                By accepting this agreement, you agree to the following terms:
                            </p>
                            <ol className="list-decimal list-inside space-y-1 text-xs">
                                <li>Rent must be paid on or before the 5th of each month</li>
                                <li>Maintain the property in good condition and report damages promptly</li>
                                <li>No sub-letting or transfer of tenancy without written consent</li>
                                <li>Observe quiet hours between 10:00 PM and 8:00 AM</li>
                                <li>No illegal activities or substances on the premises</li>
                                <li>Proper waste disposal and cleanliness maintenance</li>
                                <li>Notify caretaker of any extended absences exceeding 7 days</li>
                                <li>Two months notice required before vacating the premises</li>
                                <li>The caretaker reserves the right to inspect the property with 24-hour notice</li>
                            </ol>
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={agreementAccepted}
                                onChange={(e) => setAgreementAccepted(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                I have read and agree to the terms and conditions outlined above *
                            </span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
            </motion.div>
        </div>
    );
}
