'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';
import { MobileNav, DesktopSidebar, TopBar } from '@/components/tenant/Navigation';
import TenantIdentityCard from '@/components/tenant/TenantIdentityCard';
import LiveMap from '@/components/tenant/LiveMap';
import ActionGrid from '@/components/tenant/ActionGrid';
import RecentActivity, { TenantActivityItem } from '@/components/tenant/RecentActivity';
import PlotRules, { TenantRuleItem } from '@/components/tenant/PlotRules';
import TenantModal from '@/components/tenant/TenantModal';
import { Footer } from '@/components/Footer';
import { getSupabaseClient } from '@/lib/supabase/client';

type ModalType = null | 'pay_dashboard' | 'pay_sidebar' | 'complaint' | 'lease' | 'announcements' | 'community' | 'feedback' | 'activity' | 'settings' | 'share';

export default function TenantDashboard() {
    const router = useRouter();
    const mainRef = useRef<HTMLDivElement>(null);
    const [profile, setProfile] = useState<any>(null);
    const [tenant, setTenant] = useState<any>(null);
    const [lease, setLease] = useState<any>(null);
    const [unit, setUnit] = useState<any>(null);
    const [property, setProperty] = useState<any>(null);
    const [caretaker, setCaretaker] = useState<{ name: string; phone: string }>({ name: 'Not assigned yet', phone: 'Not assigned yet' });
    const [payments, setPayments] = useState<any[]>([]);
    const [leaseDocumentUrl, setLeaseDocumentUrl] = useState<string | null>(null);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [rules, setRules] = useState<TenantRuleItem[]>([]);
    const [rulesLoading, setRulesLoading] = useState(true);
    const [activities, setActivities] = useState<TenantActivityItem[]>([]);
    const [mapLocation, setMapLocation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [submittingComplaint, setSubmittingComplaint] = useState(false);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);
    const [shareCode, setShareCode] = useState<string | null>(null);
    const [globalMessage, setGlobalMessage] = useState<string>("");
    const [issueHeading, setIssueHeading] = useState("");
    const [issueDescription, setIssueDescription] = useState("");
    const [issueTarget, setIssueTarget] = useState<'CARETAKER' | 'ADMIN'>('CARETAKER');
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [feedbackComment, setFeedbackComment] = useState("");
    const [profileName, setProfileName] = useState("");
    const [profilePhone, setProfilePhone] = useState("");

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Fade in content smoothly without hiding it initially
            gsap.fromTo(mainRef.current, 
                { opacity: 0.3 }, 
                { opacity: 1, duration: 0.4, ease: 'power2.out' }
            );
        });

        async function load() {
            const supabase: any = getSupabaseClient();
            try {
                const { data: authData } = await supabase.auth.getUser();
                if (!authData.user) {
                    router.replace('/auth/login');
                    return;
                }

                const { data: userProfileRaw } = await supabase.from('profiles').select('user_id, full_name, email, phone_number').eq('user_id', authData.user.id).maybeSingle();
                const userProfile = userProfileRaw as any;
                setProfile(userProfile);
                setProfileName(userProfile?.full_name || "");
                setProfilePhone(userProfile?.phone_number || "");

                // Fetch tenant with relationship columns
                const { data: tenantRecordRaw } = await supabase
                    .from('tenants')
                    .select('id, user_id, total_months_paid, property_id, unit_id, caretaker_user_id, caretaker_employee_id, room_number')
                    .eq('user_id', authData.user.id)
                    .maybeSingle();
                const tenantRecord = tenantRecordRaw as any;
                setTenant(tenantRecord);
                if (!tenantRecord?.id) return;

                // Get lease for this tenant
                const { data: leaseRowsRaw } = await supabase
                    .from('leases')
                    .select('id, tenant_id, unit_id, start_date, end_date, status, pdf_url')
                    .eq('tenant_id', tenantRecord.id)
                    .order('created_at', { ascending: false });
                const leaseRows = (leaseRowsRaw ?? []) as any[];
                const activeLease = leaseRows?.find((row) => row.status === 'ACTIVE') ?? leaseRows?.[0] ?? null;
                setLease(activeLease);
                setLeaseDocumentUrl(activeLease?.pdf_url ?? null);

                if (activeLease?.id) {
                    const { data: docsRaw } = await supabase.from('tenant_lease_documents').select('file_url').eq('lease_id', activeLease.id).order('created_at', { ascending: false }).limit(1);
                    const docs = (docsRaw ?? []) as any[];
                    if (docs?.[0]?.file_url) setLeaseDocumentUrl(docs[0].file_url);
                }

                // Use tenant relationship columns for property and unit
                let propertyId: string | null = tenantRecord?.property_id || null;
                let unitId: string | null = tenantRecord?.unit_id || activeLease?.unit_id || null;

                // Fetch property using tenant's assigned property_id
                if (propertyId) {
                    const { data: propertyRecordRaw } = await supabase
                        .from('properties')
                        .select('id, name, logo_url, caretaker_id, caretaker_user_id, caretaker_employee_id')
                        .eq('id', propertyId)
                        .maybeSingle();
                    const propertyRecord = propertyRecordRaw as any;
                    setProperty(propertyRecord);
                    
                    // Fetch map location for property
                    const { data: mapRaw } = await supabase
                        .from('house_map_locations')
                        .select('gate_label, plot_label, gate_lat, gate_lng, house_lat, house_lng')
                        .eq('property_id', propertyId)
                        .maybeSingle();
                    const map = mapRaw as any;
                    setMapLocation(map);
                }

                // Fetch unit using tenant's assigned unit_id
                if (unitId) {
                    const { data: unitRecordRaw } = await supabase
                        .from('units')
                        .select('id, property_id, type, room_number')
                        .eq('id', unitId)
                        .maybeSingle();
                    const unitRecord = unitRecordRaw as any;
                    setUnit(unitRecord);
                    // Override property ID if unit has different property
                    if (unitRecord?.property_id && !propertyId) {
                        propertyId = unitRecord.property_id;
                    }
                }

                // Fetch caretaker using tenant's assigned caretaker IDs
                const tenantCaretakerUserId = tenantRecord?.caretaker_user_id;
                const tenantCaretakerEmployeeId = tenantRecord?.caretaker_employee_id;
                
                if (tenantCaretakerEmployeeId || tenantCaretakerUserId) {
                    // Try employee lookup first (preferred)
                    let caretakerData: any = null;
                    
                    if (tenantCaretakerEmployeeId) {
                        const { data: empData } = await supabase
                            .from('employees')
                            .select('full_name, phone_number, email')
                            .eq('id', tenantCaretakerEmployeeId)
                            .maybeSingle();
                        if (empData) caretakerData = empData;
                    }
                    
                    // Fallback to profile lookup
                    if (!caretakerData && tenantCaretakerUserId) {
                        const { data: profileData } = await supabase
                            .from('profiles')
                            .select('full_name, phone_number')
                            .eq('user_id', tenantCaretakerUserId)
                            .maybeSingle();
                        if (profileData) caretakerData = profileData;
                    }
                    
                    // Use property caretaker as last resort
                    if (!caretakerData && property?.caretaker_id) {
                        const [{ data: caretakerProfileRaw }, { data: caretakerEmployeeRaw }] = await Promise.all([
                            supabase.from('profiles').select('full_name, phone_number').eq('user_id', property.caretaker_id).maybeSingle(),
                            supabase.from('employees').select('full_name, phone_number').eq('user_id', property.caretaker_id).maybeSingle(),
                        ]);
                        caretakerData = caretakerEmployeeRaw || caretakerProfileRaw;
                    }
                    
                    if (caretakerData) {
                        setCaretaker({
                            name: caretakerData?.full_name || 'Not assigned yet',
                            phone: caretakerData?.phone_number || 'Not assigned yet',
                        });
                    }
                }

                // Fetch property-specific data. If property_id is available, filter by it
                const [{ data: paymentRowsRaw }, { data: announcementsRowsRaw }, { data: issueRowsRaw }, { data: commentRowsRaw }, { data: ruleRowsRaw }] = await Promise.all([
                    supabase.from('payments').select('id, amount, status, created_at').eq('tenant_id', tenantRecord.id).order('created_at', { ascending: false }),
                    // Fetch announcements for tenant's property or global ones (null property_id)
                    supabase.from('announcements')
                        .select('id, title, content, target_role, property_id, created_at')
                        .eq('is_active', true)
                        .or(`property_id.eq.${propertyId},property_id.is.null`)
                        .order('created_at', { ascending: false })
                        .limit(20),
                    supabase.from('issues').select('id, title, description, created_at').eq('reporter_id', authData.user.id).order('created_at', { ascending: false }).limit(20),
                    supabase.from('tenant_comments').select('id, comment_text, rating, created_at').eq('tenant_id', tenantRecord.id).order('created_at', { ascending: false }).limit(20),
                    // Fetch property-specific rules from property_rules table
                    propertyId
                        ? supabase.from('property_rules').select('id, title, details').eq('property_id', propertyId).eq('is_active', true).order('sort_order', { ascending: true }).limit(50)
                        : Promise.resolve({ data: [] }),
                ]);
                const paymentRows = (paymentRowsRaw ?? []) as any[];
                const announcementsRows = (announcementsRowsRaw ?? []) as any[];
                const issueRows = (issueRowsRaw ?? []) as any[];
                const commentRows = (commentRowsRaw ?? []) as any[];
                const ruleRows = (ruleRowsRaw ?? []) as any[];

                setPayments(paymentRows);
                setAnnouncements(announcementsRows.filter((item) => !item.target_role || item.target_role === 'TENANT' || item.target_role === 'PUBLIC'));
                setRules(ruleRows.map((row: any) => ({ id: row.id, title: row.title, desc: row.description })));
                setRulesLoading(false);

                const { data: logRows } = await supabase.from('tenant_activity_logs').select('id, activity_type, title, description, created_at').eq('tenant_user_id', authData.user.id).order('created_at', { ascending: false }).limit(50);
                const dbActivities: TenantActivityItem[] = (logRows ?? []).map((row: any) => ({
                    id: row.id,
                    type: row.activity_type?.toLowerCase() || 'info',
                    title: row.title,
                    desc: row.description || '',
                    date: new Date(row.created_at).toLocaleString(),
                }));
                const fallbackActivities: TenantActivityItem[] = [
                    ...paymentRows.slice(0, 6).map((p: any) => ({ id: `payment-${p.id}`, type: 'payment', title: `Rent payment ${p.status}`, amount: `KES ${Number(p.amount || 0).toLocaleString()}`, date: new Date(p.created_at).toLocaleString() })),
                    ...issueRows.slice(0, 6).map((i: any) => ({ id: `issue-${i.id}`, type: 'maintenance', title: i.title, desc: i.description || '', date: new Date(i.created_at).toLocaleString() })),
                    ...commentRows.slice(0, 6).map((c: any) => ({ id: `feedback-${c.id}`, type: 'feedback', title: `Feedback submitted (${c.rating}/5)`, desc: c.comment_text || '', date: new Date(c.created_at).toLocaleString() })),
                    ...announcementsRows.slice(0, 6).map((a: any) => ({ id: `announcement-${a.id}`, type: 'announcement', title: a.title, desc: a.content, date: new Date(a.created_at).toLocaleString() })),
                ];
                setActivities([...dbActivities, ...fallbackActivities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20));
            } catch (e) {
                console.error(e);
                setRulesLoading(false);
            } finally {
                setLoading(false);
            }
        }
        void load();
        return () => ctx.revert();
    }, [router]);

    const monthsPaid = useMemo(() => {
        const tenantMonths = Number(tenant?.total_months_paid ?? 0);
        if (tenantMonths > 0) return tenantMonths;
        return payments.filter((payment) => payment.status === 'COMPLETED').length;
    }, [payments, tenant?.total_months_paid]);

    const daysRemaining = useMemo(() => {
        if (!lease?.end_date) return null;
        const diff = new Date(lease.end_date).getTime() - Date.now();
        return diff >= 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
    }, [lease?.end_date]);

    const logActivity = async (activityType: string, title: string, description: string, metadata: Record<string, unknown> = {}) => {
        const supabase: any = getSupabaseClient();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) return;
        await supabase.from('tenant_activity_logs').insert({
            tenant_user_id: authData.user.id,
            activity_type: activityType,
            title,
            description,
            metadata,
        });
    };

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
        const supabase: any = getSupabaseClient();
        setSubmittingComplaint(true);
        try {
            const { data: authData } = await supabase.auth.getUser();
            if (!authData.user) throw new Error('Session expired. Please log in again.');
            const { error } = await supabase.from('issues').insert({
                reporter_id: authData.user.id,
                unit_id: lease?.unit_id ?? null,
                type: 'TENANT_COMPLAINT',
                title: issueHeading.trim(),
                description: issueDescription.trim(),
                status: 'OPEN',
                priority: issueTarget === 'ADMIN' ? 'MEDIUM' : 'LOW',
                assigned_to_id: issueTarget === 'CARETAKER' ? property?.caretaker_id ?? null : null,
                target_audience: issueTarget,
                tenant_id: tenant?.id ?? null,
                property_id: property?.id ?? null,
                lease_id: lease?.id ?? null,
            });
            if (error) throw error;
            await logActivity('ISSUE', 'Complaint submitted', `Complaint sent to ${issueTarget.toLowerCase()}.`, { target: issueTarget });
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
        const supabase: any = getSupabaseClient();
        setSubmittingFeedback(true);
        try {
            if (!feedbackComment.trim()) throw new Error('Please add a feedback comment.');
            const { error } = await supabase.from('tenant_comments').insert({
                tenant_id: tenant?.id ?? null,
                property_id: property?.id ?? null,
                unit_id: unit?.id ?? null,
                rating: feedbackRating,
                comment_text: feedbackComment.trim(),
                is_public: false,
            });
            if (error) throw error;
            await logActivity('FEEDBACK', 'Feedback submitted', `You submitted a ${feedbackRating}/5 rating.`, { rating: feedbackRating });
            setFeedbackComment('');
            setGlobalMessage('Feedback submitted successfully.');
            setActiveModal(null);
        } catch (error: any) {
            setGlobalMessage(error?.message || 'Failed to submit feedback.');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const saveProfile = async () => {
        const supabase: any = getSupabaseClient();
        setSavingProfile(true);
        try {
            const { data: authData } = await supabase.auth.getUser();
            if (!authData.user) throw new Error('Session expired. Please log in again.');
            const { error } = await supabase.from('profiles').update({ full_name: profileName.trim() || null, phone_number: profilePhone.trim() || null }).eq('user_id', authData.user.id);
            if (error) throw error;
            await logActivity('PROFILE', 'Profile updated', 'Tenant profile details were updated.');
            setProfile((prev: any) => ({ ...prev, full_name: profileName.trim(), phone_number: profilePhone.trim() }));
            setGlobalMessage('Profile updated.');
            setActiveModal(null);
        } catch (error: any) {
            setGlobalMessage(error?.message || 'Failed to update profile.');
        } finally {
            setSavingProfile(false);
        }
    };

    const generateShareCode = async () => {
        const supabase: any = getSupabaseClient();
        setShareLoading(true);
        try {
            const { data: authData } = await supabase.auth.getUser();
            if (!authData.user) throw new Error('Session expired. Please log in again.');
            const code = Math.random().toString(36).slice(2, 8).toUpperCase();
            const { error } = await supabase.from('location_share_codes').insert({
                code,
                tenant_user_id: authData.user.id,
                property_id: property?.id ?? null,
                unit_id: unit?.id ?? null,
                expires_at: null,
            });
            if (error) throw error;
            await logActivity('LOCATION_SHARE', 'Location code generated', `Share code ${code} created.`, { code });
            setShareCode(code);
            setActiveModal('share');
        } catch (error: any) {
            setGlobalMessage(error?.message || 'Unable to generate share code.');
        } finally {
            setShareLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#020617] text-gray-900 dark:text-gray-100 font-sans pb-20 md:pb-0">
            <TopBar />
            <DesktopSidebar onAction={handleAction} />
            <MobileNav onAction={handleAction} />

            <main ref={mainRef} className="pt-20 px-4 md:px-8 md:ml-64 max-w-7xl mx-auto transition-all duration-300">
                <div className="max-w-4xl mx-auto">
                    {globalMessage && <div className="mb-4 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800">{globalMessage}</div>}
                    <TenantIdentityCard
                        tenantName={profile?.full_name || profile?.email?.split('@')[0] || "Tenant"}
                        propertyName={property?.name || "Not assigned yet"}
                        roomNumber={unit?.type || "Not assigned yet"}
                        leaseStart={lease?.start_date || "Not assigned yet"}
                        leaseEnd={lease?.end_date || "Not assigned yet"}
                        monthsPaid={loading ? 0 : monthsPaid}
                        daysRemaining={daysRemaining}
                        caretakerName={caretaker.name}
                        caretakerPhone={caretaker.phone}
                        avatarUrl={property?.logo_url || null}
                        onPayRent={() => handleAction("pay")}
                        onReportIssue={() => handleAction("report")}
                        onMessageCaretaker={() => router.push('/tenant/chat')}
                    />
                    <LiveMap
                        gateLabel={mapLocation?.gate_label || 'School gate'}
                        plotLabel={mapLocation?.plot_label || (property?.name || 'House')}
                        gateLat={mapLocation?.gate_lat ?? null}
                        gateLng={mapLocation?.gate_lng ?? null}
                        houseLat={mapLocation?.house_lat ?? null}
                        houseLng={mapLocation?.house_lng ?? null}
                        onShareLocation={generateShareCode}
                        sharing={shareLoading}
                    />
                    <h3 className="text-lg font-bold mb-4 px-1">Quick Actions</h3>
                    <ActionGrid onAction={handleAction} />
                    <RecentActivity activities={activities.slice(0, 8)} onViewAll={() => setActiveModal('activity')} />
                    <PlotRules rules={rules} loading={rulesLoading} />
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
                {leaseDocumentUrl ? (
                    <div className="space-y-3 h-full">
                        <a href={leaseDocumentUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Download PDF</a>
                        <iframe src={leaseDocumentUrl} className="w-full h-[78vh] rounded-lg border border-slate-700" />
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
                                <p className="text-sm text-slate-300 mt-1">{announcement.content}</p>
                                <p className="text-xs text-slate-400 mt-2">{announcement.target_role || 'General'} • {new Date(announcement.created_at).toLocaleString()}</p>
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
