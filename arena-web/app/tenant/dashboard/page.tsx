'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';
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
import type { TenantDashboardData, TenantPropertyReview } from '@/lib/tenant/types';

type ModalType = null | 'pay_dashboard' | 'pay_sidebar' | 'complaint' | 'lease' | 'announcements' | 'community' | 'feedback' | 'activity' | 'settings' | 'share';

export default function TenantDashboard() {
    const router = useRouter();
    const mainRef = useRef<HTMLDivElement>(null);
    
    // Unified dashboard data from tenant_dashboard_view
    const [dashboardData, setDashboardData] = useState<TenantDashboardData | null>(null);
    const [dashboardError, setDashboardError] = useState<string | null>(null);
    
    // Related data
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [rules, setRules] = useState<TenantRuleItem[]>([]);
    const [faqs, setFaqs] = useState<any[]>([]);
    const [reviews, setReviews] = useState<TenantPropertyReview[]>([]);
    const [existingReview, setExistingReview] = useState<TenantPropertyReview | null>(null);
    const [activities, setActivities] = useState<TenantActivityItem[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    
    // UI state
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [submittingComplaint, setSubmittingComplaint] = useState(false);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);
    const [shareCode, setShareCode] = useState<string | null>(null);
    const [globalMessage, setGlobalMessage] = useState<string>("");
    
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
        const diff = new Date(dashboardData.leaseEndDate).getTime() - Date.now();
        return diff >= 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
    }, [dashboardData?.leaseEndDate]);

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
        } catch (error: any) {
            setGlobalMessage(error?.message || 'Failed to submit complaint. Check your policy setup.');
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
        } catch (error: any) {
            setGlobalMessage(error?.message || 'Failed to submit feedback.');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const saveProfile = async () => {
        setSavingProfile(true);
        try {
            // Use direct Supabase for profile update
            const { getSupabaseClient } = await import('@/lib/supabase/client');
            const supabase = getSupabaseClient() as any;
            const { data: authData } = await supabase.auth.getUser();
            if (!authData.user) throw new Error('Session expired. Please log in again.');
            
            const { error } = await supabase.from('profiles').update({ 
                full_name: profileName.trim() || null, 
                phone_number: profilePhone.trim() || null 
            }).eq('user_id', authData.user.id);
            
            if (error) throw error;
            await logTenantActivity('PROFILE', 'Profile updated', 'Tenant profile details were updated.');
            setGlobalMessage('Profile updated.');
            setActiveModal(null);
        } catch (error: any) {
            setGlobalMessage(error?.message || 'Failed to update profile.');
        } finally {
            setSavingProfile(false);
        }
    };

    const generateShareCode = async () => {
        if (!dashboardData) return;
        
        setShareLoading(true);
        try {
            const { getSupabaseClient } = await import('@/lib/supabase/client');
            const supabase = getSupabaseClient() as any;
            const { data: authData } = await supabase.auth.getUser();
            if (!authData.user) throw new Error('Session expired. Please log in again.');
            
            const code = Math.random().toString(36).slice(2, 8).toUpperCase();
            const { error } = await supabase.from('location_share_codes').insert({
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
        } catch (error: any) {
            setGlobalMessage(error?.message || 'Unable to generate share code.');
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
        <div className="min-h-screen bg-gray-50 dark:bg-[#020617] text-gray-900 dark:text-gray-100 font-sans pb-20 md:pb-0">
            <TopBar />
            <DesktopSidebar onAction={handleAction} />
            <MobileNav onAction={handleAction} />

            <main ref={mainRef} className="pt-20 px-4 md:px-8 md:ml-64 max-w-7xl mx-auto transition-all duration-300">
                <div className="max-w-4xl mx-auto">
                    {globalMessage && <div className="mb-4 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800">{globalMessage}</div>}

                    {!loading && notifications.filter((n) => !n.readAt).length > 0 && (
                        <div className="mb-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/40 p-4">
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Notifications</h3>
                                <button
                                    type="button"
                                    onClick={() => router.push('/tenant/messages')}
                                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Open messages
                                </button>
                            </div>
                            <ul className="space-y-2">
                                {notifications.filter((n) => !n.readAt).slice(0, 3).map((n) => (
                                    <li key={n.id}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                void markNotificationRead(n.id, n.messageId);
                                                router.push('/tenant/messages');
                                            }}
                                            className="w-full text-left text-sm text-blue-900 dark:text-blue-100 hover:opacity-80"
                                        >
                                            <span className="font-medium">{n.title}</span>
                                            {n.body && (
                                                <span className="text-blue-700/80 dark:text-blue-300/80"> — {n.body}</span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-500 dark:text-gray-400">Loading your dashboard...</p>
                            </div>
                        </div>
                    ) : dashboardData ? (
                        <>
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
                            <h3 className="text-lg font-bold mb-4 px-1">Quick Actions</h3>
                            <ActionGrid onAction={handleAction} />
                            <RecentActivity activities={activities.slice(0, 8)} onViewAll={() => setActiveModal('activity')} />
                            <PlotRules rules={rules} loading={loading} />
                            
                            {/* Property Rating Section */}
                            {reviews.length > 0 && (
                                <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
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
                                    <h3 className="text-lg font-bold mb-4 px-1">Frequently Asked Questions</h3>
                                    <div className="space-y-2">
                                        {faqs.map((faq) => (
                                            <div key={faq.id} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <p className="font-medium text-sm">{faq.question}</p>
                                                {faq.answer && (
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{faq.answer}</p>
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
                                <p className="text-gray-500 dark:text-gray-400">No dashboard data available.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

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
