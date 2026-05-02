'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, 
    Lock, 
    FileText, 
    CheckCircle, 
    ArrowRight, 
    ArrowLeft,
    Eye,
    EyeOff,
    AlertTriangle
} from 'lucide-react';
import { ApplicationApi } from '@/lib/api/domains/applications';

interface OnboardingStep {
    id: 'password' | 'profile' | 'agreement';
    title: string;
    description: string;
    icon: React.ElementType;
}

const steps: OnboardingStep[] = [
    {
        id: 'password',
        title: 'Change Password',
        description: 'Set a secure password for your account',
        icon: Lock,
    },
    {
        id: 'profile',
        title: 'Complete Profile',
        description: 'Add your personal details',
        icon: User,
    },
    {
        id: 'agreement',
        title: 'User Agreement',
        description: 'Review and accept the terms',
        icon: FileText,
    },
];

export default function TenantOnboarding() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    
    // Form data
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');
    const [agreementAccepted, setAgreementAccepted] = useState(false);

    useEffect(() => {
        async function checkStatus() {
            try {
                const status = await ApplicationApi.getMyOnboardingStatus();
                if (status.canAccess) {
                    router.replace('/tenant/dashboard');
                    return;
                }
                // If not onboarded, stay on this page
            } catch (err: any) {
                console.error('Onboarding status check failed:', err);
                setError(err?.message || 'Failed to load onboarding status. Please refresh the page.');
            } finally {
                setIsLoading(false);
            }
        }

        checkStatus();
    }, [router]);

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

    const handleNext = async () => {
        setError('');
        if (currentStep === 0) {
            // Validate password
            if (password.length < 8) {
                setError('Password must be at least 8 characters');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }
        }
        
        if (currentStep === 1) {
            // Validate profile
            if (!fullName.trim() || !phoneNumber.trim()) {
                setError('Please fill in all required fields');
                return;
            }
        }
        
        if (currentStep === 2) {
            // Validate agreement
            if (!agreementAccepted) {
                setError('You must accept the agreement to continue');
                return;
            }
        }

        setIsSubmitting(true);
        try {
            if (currentStep === 0) {
                await ApplicationApi.completeOnboardingStep({
                    step: 'password',
                    password,
                });
            } else if (currentStep === 1) {
                await ApplicationApi.completeOnboardingStep({
                    step: 'profile',
                    fullName,
                    phoneNumber,
                    emergencyContact,
                });
                // Continue to agreement step - don't redirect yet
            } else {
                const status = await ApplicationApi.completeOnboardingStep({
                    step: 'agreement',
                });
                if (status.canAccess) {
                    router.push('/tenant/dashboard');
                    return;
                }
            }
            setCurrentStep(prev => prev + 1);
        } catch (err: any) {
            setError(err?.message || 'Failed to save onboarding step');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
    };

    const CurrentStepIcon = steps[currentStep].icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden"
            >
                {/* Header */}
                <div className="bg-primary p-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <CurrentStepIcon size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Welcome, New Tenant!</h1>
                            <p className="text-white/80 text-sm">Complete your setup to access your dashboard</p>
                        </div>
                    </div>
                    
                    {/* Progress */}
                    <div className="flex gap-2">
                        {steps.map((step, index) => (
                            <div
                                key={step.id}
                                className={`flex-1 h-2 rounded-full transition-all ${
                                    index <= currentStep ? 'bg-white' : 'bg-white/30'
                                }`}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-white/70 mt-2 text-center">
                        Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
                    </p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                            {error}
                        </div>
                    )}
                    <AnimatePresence mode="wait">
                        {currentStep === 0 && (
                            <motion.div
                                key="password"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5" />
                                        <p className="text-sm text-amber-800 dark:text-amber-300">
                                            For security, please set a strong password for your account.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        New Password *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min 8 characters"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        Confirm Password *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter password"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 1 && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Your full name"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
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
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="agreement"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 max-h-64 overflow-y-auto text-sm text-slate-700 dark:text-slate-300 space-y-3">
                                    <h4 className="font-semibold text-slate-900 dark:text-white">Tenant Agreement</h4>
                                    <p>
                                        By accepting this agreement, you agree to the following terms and conditions:
                                    </p>
                                    <ol className="list-decimal list-inside space-y-2 text-xs">
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
                                    <p className="text-xs italic mt-4">
                                        Failure to comply with these terms may result in termination of tenancy.
                                    </p>
                                </div>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreementAccepted}
                                        onChange={(e) => setAgreementAccepted(e.target.checked)}
                                        className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">
                                        I have read and agree to the terms and conditions outlined above
                                    </span>
                                </label>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex gap-3 mt-8">
                        {currentStep > 0 && (
                            <button
                                onClick={handleBack}
                                className="px-6 py-3 rounded-xl border border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300 font-semibold hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-all flex items-center gap-2"
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            disabled={isSubmitting}
                            className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Completing Setup...
                                </>
                            ) : currentStep === steps.length - 1 ? (
                                <>
                                    <CheckCircle size={18} />
                                    Complete Setup
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
