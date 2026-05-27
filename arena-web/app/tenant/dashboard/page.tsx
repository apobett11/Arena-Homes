'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';
import { CalendarClock, CreditCard, MapPin, ShieldAlert } from 'lucide-react';
import { MobileNav, DesktopSidebar, TopBar } from '@/components/tenant/Navigation';
import CompactTenantCard from '@/components/tenant/CompactTenantCard';
import LiveMap from '@/components/tenant/LiveMap';
import ActionGrid from '@/components/tenant/ActionGrid';
import RecentActivity, { TenantActivityItem } from '@/components/tenant/RecentActivity';
import PlotRules, { TenantRuleItem } from '@/components/tenant/PlotRules';
import TenantModal from '@/components/tenant/TenantModal';
import { Footer } from '@/components/Footer';
import {
  getTenantDashboardData,
  getTenantNotifications,
  markNotificationRead,
  getTenantAnnouncements,
  getTenantPropertyRules,
  getTenantPropertyFaqs,
  getTenantPropertyReviews,
  getTenantExistingReview,
  submitTenantIssue,
  submitTenantPropertyReview,
  getTenantActivityItems,
  logTenantActivity,
} from '@/lib/tenant/dashboard';
import type {
    TenantDashboardData,
    TenantNotification,
    TenantPropertyFaq,
    TenantPropertyReview,
    TenantAnnouncement,
} from '@/lib/tenant/types';

type ModalType = null | 'pay_dashboard' | 'pay_sidebar' | 'complaint' | 'lease' | 'announcements' | 'community' | 'feedback' | 'activity' | 'settings' | 'share' | 'notifications';

export default function TenantDashboard() {
    const router = useRouter();
    const mainRef = useRef<HTMLDivElement>(null);
    
    // Unified dashboard data from tenant_dashboard_view
    const [dashboardData, setDashboardData] = useState<TenantDashboardData | null>(null);
    const [dashboardError, setDashboardError] = useState<string | null>(null);
    
    // Related data
    const [announcements, setAnnouncements] = useState<TenantAnnouncement[]>([]);
    const [rules, setRules] = useState<TenantRuleItem[]>([]);
    const [faqs, setFaqs] = useState<TenantPropertyFaq[]>([]);
    const [reviews, setReviews] = useState<TenantPropertyReview[]>([]);
    const [existingReview, setExistingReview] = useState<TenantPropertyReview | null>(null);
    const [activities, setActivities] = useState<TenantActivityItem[]>([]);
    const [notifications, setNotifications] = useState<TenantNotification[]>([]);
    
    // UI state
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [submittingComplaint, setSubmittingComplaint] = useState(false);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);
    const [shareCode, setShareCode] = useState<string | null>(null);
    const [globalMessage, setGlobalMessage] = useState<string>("");
    const [nowTick, setNowTick] = useState(() => Date.now());
    
    // Form state
    const [issueHeading, setIssueHeading] = useState("");
    const [issueDescription, setIssueDescription] = useState("");
    const [issueTarget, setIssueTarget] = useState<'CARETAKER' | 'ADMIN'>('CARETAKER');
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [feedbackComment, setFeedbackComment] = useState("");
    const [profileName, setProfileName] = useState("");
    const [profilePhone, setProfilePhone] = useState("");

    // Derived memo values
    const monthsPaid = useMemo(() => dashboardData?.paidMonths || 0, [dashboardData?.paidMonths]);
    
    const daysRemaining = useMemo(() => {
        if (!dashboardData?.leaseEndDate) return null;
        const diff = new Date(dashboardData.leaseEndDate).getTime() - nowTick;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }, [dashboardData?.leaseEndDate, nowTick]);

    const unreadNotifications = useMemo(
        () => notifications.filter((n) => !n.readAt),
        [notifications]
    );

    useEffect(() => {
        const id = window.setInterval(() => setNowTick(Date.now()), 60000);
        return () => window.clearInterval(id);
    }, []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(mainRef.current, 
                { opacity: 0.3 }, 
                { opacity: 1, duration: 0.4, ease: 'power2.out' }
            );
        });

        async function load() {
            try {
                const supabaseClient = (await import('@/lib/supabase/client')).getSupabaseClient();
                const { data: { user } } = await supabaseClient.auth.getUser();

                if (!user) {
                    router.replace('/auth/login');
                    return;
                }

                const { data: activeTenant } = await supabaseClient
                    .from('tenants')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('status', 'ACTIVE')
                    .maybeSingle();

                if (!activeTenant) {
                    const { data: applicationData } = await supabaseClient
                        .from('tenant_applications')
                        .select('has_completed_profile, has_accepted_agreement')
                        .eq('converted_user_id', user.id)
                        .eq('status', 'ACCEPTED')
                        .eq('has_set_password', true)
                        .order('created_at', { ascending: false })
                        .maybeSingle();

                    const application = applicationData as {
                        has_completed_profile: boolean;
                        has_accepted_agreement: boolean;
                    } | null;

                    if (
                        application &&
                        (!application.has_completed_profile || !application.has_accepted_agreement)
                    ) {
                        router.replace('/tenant/onboarding');
                        return;
                    }

                    setDashboardError('NOT_A_TENANT');
                    setLoading(false);
                    return;
                }

                const { data: dashData, error: dashError } = await getTenantDashboardData();
                
                if (dashError) {
                    if (dashError.code === 'NO_TENANT_ASSIGNMENT' || 
                        dashError.message?.includes('No tenant assignment')) {
                        setDashboardError('NOT_A_TENANT');
                        setLoading(false);
                        return;
                    }
                    setDashboardError(dashError.message);
                    setLoading(false);
                    return;
                }
                
                if (!dashData) {
                    setDashboardError('NOT_A_TENANT');
                    setLoading(false);
                    return;
                }
                
                setDashboardData(dashData);
                setProfileName(dashData.tenantFullName || "");
                setProfilePhone(dashData.tenantPhoneNumber || "");
                
                // Load related data in parallel
                const [
                    announcementsData,
                    rulesData,
                    faqsData,
                    reviewsData,
                    existingReviewData,
                    activitiesData,
                    notificationsData,
                ] = await Promise.all([
                    getTenantAnnouncements(dashData.propertyId),
                    getTenantPropertyRules(dashData.propertyId),
                    getTenantPropertyFaqs(dashData.propertyId),
                    getTenantPropertyReviews(dashData.propertyId),
                    getTenantExistingReview(dashData.tenantId, dashData.propertyId || ''),
                    getTenantActivityItems(dashData.tenantId, dashData.propertyId),
                    getTenantNotifications(),
                ]);
                
                setAnnouncements(announcementsData);
                setRules(rulesData.map((r) => ({ id: r.id, title: r.title, desc: r.description || '' })));
                setFaqs(faqsData);
                setReviews(reviewsData);
                setExistingReview(existingReviewData);
                setActivities(activitiesData);
                setNotifications(notificationsData);
                
            } catch (err) {
                console.error('Tenant dashboard load error:', err);
                setDashboardError('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        }
        
        void load();
        return () => ctx.revert();
    }, [router]);

    const handleAction = (actionId: string) => {
        if (actionId === 'home') return;
        if (actionId === 'message_caretaker') {
            router.push('/tenant/chat');
            return;
        }
        if (actionId === 'pay') return setActiveModal('pay_dashboard');
        if (actionId === 'pay_sidebar') return setActiveModal('pay_sidebar');
        if (actionId === 'report') return setActiveModal('complaint');
        if (actionId === 'lease') return setActiveModal('lease');
        if (actionId === 'announcements') return setActiveModal('announcements');
        if (actionId === 'community') return setActiveModal('community');
        if (actionId === 'feedback') return setActiveModal('feedback');
        if (actionId === 'settings') return setActiveModal('settings');
    };

    const submitComplaint = async () => {
        if (!issueHeading.trim() || !issueDescription.trim()) return;
        if (!dashboardData) return;
        
        setSubmittingComplaint(true);
        try {
            await submitTenantIssue({
                tenantId: dashboardData.tenantId,
                tenantUserId: dashboardData.tenantUserId,
                propertyId: dashboardData.propertyId,
                unitId: dashboardData.unitId,
                caretakerEmployeeId: dashboardData.caretakerEmployeeId,
                targetRole: issueTarget,
                title: issueHeading.trim(),
                description: issueDescription.trim(),
                status: 'PENDING',
                priority: issueTarget === 'ADMIN' ? 'HIGH' : 'NORMAL',
            });
            
            await logTenantActivity('ISSUE', 'Complaint submitted', `Complaint sent to ${issueTarget.toLowerCase()}.`, { target: issueTarget });
            setIssueHeading('');
            setIssueDescription('');
            setGlobalMessage('Complaint submitted successfully.');
            setActiveModal(null);
        } catch (error: unknown) {
            setGlobalMessage(error instanceof Error ? error.message : 'Failed to submit complaint. Check your policy setup.');
        } finally {
            setSubmittingComplaint(false);
        }
    };

    const submitFeedback = async () => {
        if (!dashboardData) return;
        
        setSubmittingFeedback(true);
        try {
            if (!feedbackComment.trim()) throw new Error('Please add a feedback comment.');
            
            // Check if already rated
            if (existingReview) {
                throw new Error('You have already rated this property.');
            }
            
            await submitTenantPropertyReview({
                tenantId: dashboardData.tenantId,
                propertyId: dashboardData.propertyId || '',
                rating: feedbackRating,
                comment: feedbackComment.trim(),
            });
            
            await logTenantActivity('FEEDBACK', 'Feedback submitted', `You submitted a ${feedbackRating}/5 rating.`, { rating: feedbackRating });
            setFeedbackComment('');
            setGlobalMessage('Feedback submitted successfully.');
            setActiveModal(null);
            
            // Refresh existing review
            const review = await getTenantExistingReview(dashboardData.tenantId, dashboardData.propertyId || '');
            setExistingReview(review);
        } catch (error: unknown) {
            setGlobalMessage(error instanceof Error ? error.message : 'Failed to submit feedback.');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const saveProfile = async () => {
        setSavingProfile(true);
        try {
            // Use direct Supabase for profile update
            const { getSupabaseClient } = await import('@/lib/supabase/client');
            const supabase = getSupabaseClient();
            const { data: authData } = await supabase.auth.getUser();
            if (!authData.user) throw new Error('Session expired. Please log in again.');

            const profilesTable = supabase.from('profiles') as unknown as {
                update: (payload: { full_name: string | null; phone_number: string | null }) => {
                    eq: (column: string, value: string) => Promise<{ error: { message?: string } | null }>;
                };
            };
            const { error } = await profilesTable.update({
                full_name: profileName.trim() || null, 
                phone_number: profilePhone.trim() || null 
            }).eq('user_id', authData.user.id);
            
            if (error) throw error;
            await logTenantActivity('PROFILE', 'Profile updated', 'Tenant profile details were updated.');
            setGlobalMessage('Profile updated.');
            setActiveModal(null);
        } catch (error: unknown) {
            setGlobalMessage(error instanceof Error ? error.message : 'Failed to update profile.');
        } finally {
            setSavingProfile(false);
        }
    };

    const generateShareCode = async () => {
        if (!dashboardData) return;
        
        setShareLoading(true);
        try {
            const { getSupabaseClient } = await import('@/lib/supabase/client');
            const supabase = getSupabaseClient();
            const { data: authData } = await supabase.auth.getUser();
            if (!authData.user) throw new Error('Session expired. Please log in again.');
            
            const code = Math.random().toString(36).slice(2, 8).toUpperCase();
            const shareCodesTable = supabase.from('location_share_codes') as unknown as {
                insert: (payload: {
                    code: string;
                    tenant_user_id: string;
                    property_id: string | null;
                    unit_id: string | null;
                    expires_at: null;
                }) => Promise<{ error: { message?: string } | null }>;
            };
            const { error } = await shareCodesTable.insert({
                code,
                tenant_user_id: authData.user.id,
                property_id: dashboardData.propertyId,
                unit_id: dashboardData.unitId,
                expires_at: null,
            });
            
            if (error) throw error;
            await logTenantActivity('LOCATION_SHARE', 'Location code generated', `Share code ${code} created.`, { code });
            setShareCode(code);
            setActiveModal('share');
        } catch (error: unknown) {
            setGlobalMessage(error instanceof Error ? error.message : 'Unable to generate share code.');
        } finally {
            setShareLoading(false);
        }
    };

    // Error state - Special handling for non-tenant users
    if (dashboardError) {
        const isNotTenant = dashboardError === 'NOT_A_TENANT';
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#020617] flex items-center justify-center p-4">
                <div className={`max-w-md w-full bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border ${isNotTenant ? 'border-amber-200 dark:border-amber-800' : 'border-red-200 dark:border-red-800'}`}>
                    <h2 className={`text-xl font-bold mb-2 ${isNotTenant ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isNotTenant ? 'Not a Tenant Yet' : 'Dashboard Error'}
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {isNotTenant 
                            ? "Your account doesn't have an active tenant assignment. You need to apply for a property first."
                            : dashboardError
                        }
                    </p>
                    {isNotTenant ? (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                To become a tenant:
                            </p>
                            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 list-decimal list-inside">
                                <li>Browse available properties</li>
                                <li>Click &quot;Apply / Show Interest&quot;</li>
                                <li>Wait for caretaker approval</li>
                                <li>Complete onboarding when approved</li>
                            </ol>
                            <div className="pt-3 flex gap-3">
                                <button 
                                    onClick={() => router.push('/listings')} 
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                                >
                                    Browse Properties
                                </button>
                                <button 
                                    onClick={() => router.push('/auth/login')} 
                                    className="flex-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700 py-2 rounded-lg"
                                >
                                    Back to Login
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => window.location.reload()} 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                        >
                            Retry
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0e172a] via-[#0b1426] to-[#131c2f] text-[#e8eef9] font-sans pb-20 md:pb-0">
            <TopBar unreadCount={unreadNotifications.length} onOpenNotifications={() => setActiveModal('notifications')} />
            <DesktopSidebar onAction={handleAction} />
            <MobileNav onAction={handleAction} />

            <main ref={mainRef} className="pt-20 px-4 md:px-8 md:ml-72 max-w-7xl mx-auto transition-all duration-300">
                <div className="max-w-5xl mx-auto space-y-6">
                    {globalMessage && <div className="rounded-xl border border-[#395784] bg-[#162847] px-4 py-3 text-sm text-[#d7e3f7]">{globalMessage}</div>}

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="w-8 h-8 border-4 border-[#4978b2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-[#95a6c0]">Loading your dashboard...</p>
                            </div>
                        </div>
                    ) : dashboardData ? (
                        <>
                            <section>
                            <CompactTenantCard
                                tenantName={dashboardData.tenantFullName || dashboardData.tenantEmail?.split('@')[0] || "Tenant"}
                                propertyName={dashboardData.propertyName || "Not assigned yet"}
                                roomNumber={dashboardData.roomNumber || "Not assigned yet"}
                                leaseStart={dashboardData.leaseStartDate || "Not assigned yet"}
                                leaseEnd={dashboardData.leaseEndDate || "Not assigned yet"}
                                monthsPaid={monthsPaid}
                                daysRemaining={daysRemaining}
                                caretakerName={dashboardData.caretakerFullName || 'Not assigned yet'}
                                caretakerPhone={dashboardData.caretakerPhoneNumber || 'Not assigned yet'}
                                caretakerStatus={dashboardData.caretakerStatus}
                                avatarUrl={dashboardData.tenantLogoUrl}
                                onPayRent={() => handleAction("pay")}
                                onReportIssue={() => handleAction("report")}
                                onMessageCaretaker={() => router.push('/tenant/chat')}
                            />
                            </section>
                            <section className="rounded-[24px] border border-[#2b4063] bg-gradient-to-br from-[#141f35] via-[#111b31] to-[#10192e] p-5 md:p-6 shadow-[0_20px_50px_rgba(4,11,22,0.45)]">
                                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.24em] text-[#f5c978]">Tenant Status</p>
                                        <h3 className="text-xl font-semibold mt-2 text-[#f4f7fd]">Lease and Payment Health</h3>
                                        <p className="text-sm text-[#a7b7ce] mt-1">Track due date urgency, payment readiness, and lease progress.</p>
                                    </div>
                                    <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${daysRemaining === null ? 'border-[#365276] bg-[#15233b] text-[#c9d7ea]' : daysRemaining > 10 ? 'border-[#896a32] bg-[#2a2418] text-[#f6dcae]' : daysRemaining > 0 ? 'border-[#7a5324] bg-[#302414] text-[#f0bf7b]' : 'border-[#7a3240] bg-[#311621] text-[#f2bcc8]'}`}>
                                        <CalendarClock size={16} />
                                        {daysRemaining === null ? 'Due date unavailable' : daysRemaining > 0 ? `${daysRemaining} days remaining` : `${Math.abs(daysRemaining)} days overdue`}
                                    </div>
                                </div>
                                <div className="mt-5 grid gap-3 md:grid-cols-4">
                                    <StatusItem label="Lease status" value={dashboardData.leaseStatus || 'Active'} />
                                    <StatusItem label="Paid months" value={`${monthsPaid} month(s)`} />
                                    <StatusItem label="Due amount" value={dashboardData.roomPrice ? `KES ${dashboardData.roomPrice.toLocaleString()}` : 'Pending'} />
                                    <StatusItem label="Due date" value={dashboardData.leaseEndDate || 'Unavailable'} />
                                </div>
                                <div className="mt-5 flex flex-wrap gap-3">
                                    <button onClick={() => handleAction('pay')} className="inline-flex items-center gap-2 rounded-xl border border-[#4b72a8] bg-gradient-to-r from-[#2b5f9c] to-[#214a79] px-5 py-2.5 text-sm font-semibold text-[#f3f7ff] shadow-[0_14px_28px_rgba(11,38,72,0.38)] transition hover:-translate-y-0.5">
                                        <CreditCard size={16} />
                                        Pay Rent
                                    </button>
                                    <button onClick={() => handleAction('report')} className="inline-flex items-center gap-2 rounded-xl border border-[#3f5477] bg-[#182741] px-5 py-2.5 text-sm font-semibold text-[#dce6f5] transition hover:bg-[#213557]">
                                        <ShieldAlert size={16} />
                                        Report Issue
                                    </button>
                                </div>
                            </section>
                            <section>
                                <h3 className="text-lg font-semibold mb-3 px-1 text-[#edf2fb]">Quick Actions</h3>
                                <ActionGrid
                                    onAction={handleAction}
                                    notificationCounts={{
                                        announcements: dashboardData.announcementsCount || 0,
                                        report: dashboardData.pendingIssuesCount || 0,
                                        community: unreadNotifications.length,
                                    }}
                                />
                            </section>
                            <section className="rounded-[24px] border border-[#2b4063] bg-[#101a2f]/95 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-[#edf2fb]">Property Map</h3>
                                    <span className="inline-flex items-center gap-1 text-xs text-[#9fb0c9]"><MapPin size={12} /> Navigation & sharing</span>
                                </div>
                            <LiveMap
                                gateLabel="School gate"
                                plotLabel={dashboardData.propertyName || 'Property'}
                                gateLat={dashboardData.propertyLatitude ?? null}
                                gateLng={dashboardData.propertyLongitude ?? null}
                                houseLat={dashboardData.propertyLatitude ?? null}
                                houseLng={dashboardData.propertyLongitude ?? null}
                                onShareLocation={generateShareCode}
                                sharing={shareLoading}
                            />
                            </section>
                            <RecentActivity activities={activities.slice(0, 8)} onViewAll={() => setActiveModal('activity')} />
                            <section className="rounded-[24px] border border-[#2b4063] bg-[#101a2f]/95 p-5">
                                <PlotRules rules={rules} loading={loading} />
                            </section>
                            
                            {/* Property Rating Section */}
                            {reviews.length > 0 && (
                                <div className="mt-6 p-4 bg-[#101a2f] rounded-xl border border-[#2b4063]">
                                    <h4 className="font-semibold mb-2">Property Rating</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-yellow-500">
                                            {dashboardData.averagePropertyRating?.toFixed(1) || 'N/A'}
                                        </span>
                                        <span className="text-sm text-slate-500">({reviews.length} reviews)</span>
                                    </div>
                                </div>
                            )}
                            
                            {/* FAQ Section */}
                            {faqs.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold mb-4 px-1 text-[#edf2fb]">Frequently Asked Questions</h3>
                                    <div className="space-y-2">
                                        {faqs.map((faq) => (
                                            <div key={faq.id} className="p-4 bg-[#121f35] rounded-xl border border-[#2d4365]">
                                                <p className="font-medium text-sm text-[#e7eefb]">{faq.question}</p>
                                                {faq.answer && (
                                                    <p className="text-sm text-[#a8b9d0] mt-2">{faq.answer}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <p className="text-[#95a6c0]">No dashboard data available.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <TenantModal open={activeModal === 'notifications'} onClose={() => setActiveModal(null)} title="Notifications">
                {unreadNotifications.length === 0 ? (
                    <p className="text-sm text-slate-300">No unread notifications right now.</p>
                ) : (
                    <div className="space-y-3">
                        {unreadNotifications.map((n) => (
                            <button
                                type="button"
                                key={n.id}
                                onClick={() => {
                                    void markNotificationRead(n.id, n.messageId);
                                    if (/announcement|notice|rule|faq/i.test(`${n.title} ${n.body || ''}`)) {
                                        setActiveModal('announcements');
                                        return;
                                    }
                                    setActiveModal(null);
                                    router.push('/tenant/messages');
                                }}
                                className="w-full rounded-xl border border-[#2f4567] bg-[#121f35] p-3 text-left hover:bg-[#172845] transition"
                            >
                                <p className="text-sm font-semibold text-[#e7eefb]">{n.title}</p>
                                {n.body ? <p className="text-xs text-[#a9b7cb] mt-1">{n.body}</p> : null}
                            </button>
                        ))}
                    </div>
                )}
            </TenantModal>

            <TenantModal open={activeModal === 'pay_dashboard'} onClose={() => setActiveModal(null)} title="Pay Rent">
                <p className="text-sm">Use the payment method given by Arena Homes.</p>
                <p className="mt-2 text-sm text-slate-300">Online payments are coming soon.</p>
            </TenantModal>
            <TenantModal open={activeModal === 'pay_sidebar'} onClose={() => setActiveModal(null)} title="Pay">
                <p className="text-sm">Online payment is currently under development, coming soon.</p>
            </TenantModal>
            <TenantModal open={activeModal === 'community'} onClose={() => setActiveModal(null)} title="Community">
                <p className="text-sm">Community coming soon.</p>
            </TenantModal>
            <TenantModal open={activeModal === 'complaint'} onClose={() => setActiveModal(null)} title="File Complaint">
                <div className="space-y-4">
                    <div><label className="block text-sm mb-1">What is the issue about?</label><input value={issueHeading} onChange={(e) => setIssueHeading(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm" /></div>
                    <div><label className="block text-sm mb-1">Explain the issue</label><textarea value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} rows={4} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm" /></div>
                    <div>
                        <label className="block text-sm mb-2">Destination</label>
                        <div className="flex gap-3">
                            <button onClick={() => setIssueTarget('CARETAKER')} className={`rounded-lg px-3 py-2 text-sm border ${issueTarget === 'CARETAKER' ? 'border-blue-400 bg-blue-500/20' : 'border-slate-600'}`}>Send to caretaker</button>
                            <button onClick={() => setIssueTarget('ADMIN')} className={`rounded-lg px-3 py-2 text-sm border ${issueTarget === 'ADMIN' ? 'border-blue-400 bg-blue-500/20' : 'border-slate-600'}`}>Send directly to admin</button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveModal(null)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm">Cancel</button>
                        <button disabled={submittingComplaint} onClick={submitComplaint} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-60">{submittingComplaint ? 'Submitting...' : 'Submit'}</button>
                    </div>
                </div>
            </TenantModal>
            <TenantModal open={activeModal === 'lease'} onClose={() => setActiveModal(null)} title="Lease Document" fullScreen>
                {dashboardData?.leasePdfUrl ? (
                    <div className="space-y-3 h-full">
                        <a href={dashboardData.leasePdfUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Download PDF</a>
                        <iframe src={dashboardData.leasePdfUrl} className="w-full h-[78vh] rounded-lg border border-slate-700" />
                    </div>
                ) : (
                    <p className="text-sm">No lease document has been uploaded yet.</p>
                )}
            </TenantModal>
            <TenantModal open={activeModal === 'announcements'} onClose={() => setActiveModal(null)} title="Announcements">
                {announcements.length === 0 ? <p className="text-sm text-slate-300">No announcements yet.</p> : (
                    <div className="space-y-3">
                        {announcements.map((announcement) => (
                            <div key={announcement.id} className="rounded-lg border border-slate-700 p-3">
                                <h4 className="font-semibold">{announcement.title}</h4>
                                <p className="text-sm text-slate-300 mt-1">{announcement.body}</p>
                                <p className="text-xs text-slate-400 mt-2">{announcement.targetRole || 'General'} • {new Date(announcement.createdAt).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </TenantModal>
            <TenantModal open={activeModal === 'feedback'} onClose={() => setActiveModal(null)} title="Feedback">
                <div className="space-y-4">
                    <div><label className="block text-sm mb-1">Rating (1-5)</label><input type="number" min={1} max={5} value={feedbackRating} onChange={(e) => setFeedbackRating(Number(e.target.value) || 1)} className="w-32 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm" /></div>
                    <div><label className="block text-sm mb-1">Comment</label><textarea rows={4} value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm" /></div>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveModal(null)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm">Cancel</button>
                        <button disabled={submittingFeedback} onClick={submitFeedback} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-60">{submittingFeedback ? 'Submitting...' : 'Submit'}</button>
                    </div>
                </div>
            </TenantModal>
            <TenantModal open={activeModal === 'activity'} onClose={() => setActiveModal(null)} title="All Activities" fullScreen>
                {activities.length === 0 ? <p className="text-sm text-slate-300">No recent activity yet.</p> : (
                    <div className="space-y-3">
                        {activities.map((item) => (
                            <div key={item.id} className="rounded-lg border border-slate-700 p-3">
                                <h4 className="font-semibold">{item.title}</h4>
                                {item.amount && <p className="text-sm text-slate-200">{item.amount}</p>}
                                {item.desc && <p className="text-sm text-slate-300 mt-1">{item.desc}</p>}
                                <p className="text-xs text-slate-400 mt-2">{item.date}</p>
                            </div>
                        ))}
                    </div>
                )}
            </TenantModal>
            <TenantModal open={activeModal === 'settings'} onClose={() => setActiveModal(null)} title="Edit Profile">
                <div className="space-y-4">
                    <div><label className="block text-sm mb-1">Full Name</label><input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm" /></div>
                    <div><label className="block text-sm mb-1">Phone Number</label><input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm" /></div>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveModal(null)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm">Cancel</button>
                        <button disabled={savingProfile} onClick={saveProfile} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-60">{savingProfile ? 'Saving...' : 'Save'}</button>
                    </div>
                    <p className="text-sm text-slate-300">We are working on more settings.</p>
                </div>
            </TenantModal>
            <TenantModal open={activeModal === 'share'} onClose={() => setActiveModal(null)} title="Share Location">
                <div className="space-y-3">
                    <p className="text-sm">Share code: <span className="font-semibold">{shareCode || 'Not generated yet'}</span></p>
                    <ol className="list-decimal list-inside text-sm text-slate-300 space-y-1">
                        <li>Send the code to the guest/visitor.</li>
                        <li>The guest goes to the listings page and searches the code.</li>
                        <li>They follow the pin and arrive safely.</li>
                    </ol>
                </div>
            </TenantModal>

            {/* Footer */}
            <div className="md:ml-64">
                <Footer />
            </div>
        </div>
    );
}

function StatusItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-[#304663] bg-[#12213a] p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#93a7c3]">{label}</p>
            <p className="text-sm font-semibold text-[#edf2fb] mt-1">{value}</p>
        </div>
    );
}
