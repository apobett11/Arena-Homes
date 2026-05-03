// Tenant Dashboard Data Layer - Universal Database Contract
// Uses public.tenant_dashboard_view as primary data source

import { getSupabaseClient } from '@/lib/supabase/client';
import type {
  TenantDashboardData,
  TenantNotification,
  TenantAnnouncement,
  TenantPropertyRule,
  TenantPropertyFaq,
  TenantPropertyReview,
  TenantIssuePayload,
  TenantReviewPayload,
  TenantActivityItem,
  DashboardError,
} from './types';

// ============================================================================
// PRIMARY: Get tenant dashboard data from tenant_dashboard_view
// ============================================================================
export async function getTenantDashboardData(): Promise<{
  data: TenantDashboardData | null;
  error: DashboardError | null;
}> {
  // Cast to any to work with new views/tables not yet in Supabase types
  const supabase = getSupabaseClient() as any;
  
  try {
    // Get current auth user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
      return {
        data: null,
        error: {
          code: 'SUPABASE_ERROR',
          message: 'Not authenticated',
          details: authError?.message || 'No user session found',
        },
      };
    }
    
    const userId = authData.user.id;
    
    // PRIMARY: Query tenant_dashboard_view
    const { data: viewData, error: viewError } = await supabase
      .from('tenant_dashboard_view')
      .select('*')
      .eq('tenant_user_id', userId)
      .maybeSingle();
    
    if (viewError) {
      console.error('tenant_dashboard_view query failed:', viewError);
      // FALLBACK: Use direct table queries
      return await getTenantDashboardFallback(userId);
    }
    
    if (!viewData) {
      return {
        data: null,
        error: {
          code: 'NO_TENANT_ASSIGNMENT',
          message: 'No tenant assignment found for this account.',
          details: 'Your account is not assigned to any property. Contact admin.',
        },
      };
    }
    
    // Map view columns to our type
    const dashboardData: TenantDashboardData = {
      tenantId: viewData.tenant_id,
      tenantUserId: viewData.tenant_user_id,
      tenantFullName: viewData.tenant_full_name || 'Tenant',
      tenantPhoneNumber: viewData.tenant_phone_number,
      tenantWhatsappNumber: viewData.tenant_whatsapp_number,
      tenantRegistrationNumber: viewData.tenant_registration_number,
      tenantEmail: viewData.tenant_email,
      tenantLogoUrl: viewData.tenant_logo_url,
      tenantStatus: viewData.tenant_status,
      
      propertyId: viewData.property_id,
      propertyName: viewData.property_name,
      propertyLocation: viewData.property_location,
      propertyType: viewData.property_type,
      propertyLatitude: viewData.property_latitude,
      propertyLongitude: viewData.property_longitude,
      
      unitId: viewData.unit_id,
      roomNumber: viewData.room_number,
      roomType: viewData.room_type,
      roomPrice: viewData.room_price,
      
      caretakerEmployeeId: viewData.caretaker_employee_id,
      caretakerUserId: viewData.caretaker_user_id,
      caretakerFullName: viewData.caretaker_full_name,
      caretakerPhoneNumber: viewData.caretaker_phone_number,
      caretakerWhatsappNumber: viewData.caretaker_whatsapp_number,
      caretakerEmail: viewData.caretaker_email,
      caretakerStatus: viewData.caretaker_status || null,
      
      leaseId: viewData.lease_id,
      leaseNumber: viewData.lease_number,
      leaseStartDate: viewData.lease_start_date,
      leaseEndDate: viewData.lease_end_date,
      leaseStatus: viewData.lease_status,
      leasePdfUrl: viewData.lease_pdf_url,
      
      paidMonths: viewData.paid_months || 0,
      moveInDate: viewData.move_in_date,
      moveOutDate: viewData.move_out_date,
      
      pendingIssuesCount: viewData.pending_issues_count || 0,
      resolvedIssuesCount: viewData.resolved_issues_count || 0,
      pendingRepairsCount: viewData.pending_repairs_count || 0,
      solvedRepairsCount: viewData.solved_repairs_count || 0,
      notificationsCount: viewData.notifications_count || 0,
      announcementsCount: viewData.announcements_count || 0,
      
      averagePropertyRating: viewData.average_property_rating,
    };
    
    return { data: dashboardData, error: null };
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('getTenantDashboardData exception:', err);
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Failed to load tenant dashboard',
        details: errorMessage,
      },
    };
  }
}

// ============================================================================
// FALLBACK: Direct table queries if view is not available
// ============================================================================
async function getTenantDashboardFallback(userId: string): Promise<{
  data: TenantDashboardData | null;
  error: DashboardError | null;
}> {
  const supabase = getSupabaseClient() as any;
  
  try {
    console.log('[TenantDashboard] Using fallback direct queries for user:', userId);
    
    // 1. Get tenant record
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, user_id, full_name, phone_number, whatsapp_number, registration_number, email, logo_url, property_id, unit_id, room_number, caretaker_employee_id, caretaker_user_id, move_in_date, move_out_date')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (tenantError) {
      console.error('Tenant query failed:', tenantError);
      return {
        data: null,
        error: {
          code: 'SUPABASE_ERROR',
          message: 'Failed to load tenant data',
          details: tenantError.message,
        },
      };
    }
    
    if (!tenant) {
      return {
        data: null,
        error: {
          code: 'NO_TENANT_ASSIGNMENT',
          message: 'No tenant assignment found for this account.',
          details: 'Your account is not assigned to any property.',
        },
      };
    }
    
    // 2. Get property
    const { data: property } = await supabase
      .from('properties')
      .select('id, name, location, property_type, latitude, longitude')
      .eq('id', tenant.property_id)
      .maybeSingle();
    
    // 3. Get unit
    const { data: unit } = await supabase
      .from('units')
      .select('id, room_number, room_type, base_price')
      .eq('id', tenant.unit_id)
      .maybeSingle();
    
    // 4. Get caretaker
    let caretaker = null;
    if (tenant.caretaker_employee_id) {
      const { data: ct } = await supabase
        .from('employees')
        .select('id, user_id, full_name, phone_number, whatsapp_number, email, status')
        .eq('id', tenant.caretaker_employee_id)
        .maybeSingle();
      caretaker = ct;
    }
    
    // 5. Get active lease
    const { data: leases } = await supabase
      .from('leases')
      .select('id, lease_number, start_date, end_date, status, pdf_url')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });
    
    const activeLease = leases?.find((l: any) => l.status === 'ACTIVE') || leases?.[0] || null;
    
    // 6. Get counts
    const [{ count: pendingIssues }, { count: resolvedIssues }, { count: pendingRepairs }, { count: solvedRepairs }, { count: notifications }] = await Promise.all([
      supabase.from('issues').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('status', 'PENDING'),
      supabase.from('issues').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('status', 'RESOLVED'),
      supabase.from('repairs').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id).in('status', ['PENDING', 'IN_PROGRESS']),
      supabase.from('repairs').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('status', 'SOLVED'),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).is('read_at', null),
    ]);
    
    // 7. Get paid months from payments
    const { data: paymentsAgg } = await supabase
      .from('payments')
      .select('months_covered')
      .eq('tenant_id', tenant.id)
      .eq('status', 'SUCCESS');
    
    const paidMonths = paymentsAgg?.reduce((sum: number, p: any) => sum + (p.months_covered || 1), 0) || 0;
    
    const dashboardData: TenantDashboardData = {
      tenantId: tenant.id,
      tenantUserId: tenant.user_id,
      tenantFullName: tenant.full_name || 'Tenant',
      tenantPhoneNumber: tenant.phone_number,
      tenantWhatsappNumber: tenant.whatsapp_number,
      tenantRegistrationNumber: tenant.registration_number,
      tenantEmail: tenant.email,
      tenantLogoUrl: tenant.logo_url,
      tenantStatus: tenant.status,
      
      propertyId: tenant.property_id,
      propertyName: property?.name || null,
      propertyLocation: property?.location || null,
      propertyType: property?.property_type || null,
      propertyLatitude: property?.latitude || null,
      propertyLongitude: property?.longitude || null,
      
      unitId: tenant.unit_id,
      roomNumber: tenant.room_number || unit?.room_number || null,
      roomType: unit?.room_type || null,
      roomPrice: unit?.base_price || null,
      
      caretakerEmployeeId: tenant.caretaker_employee_id,
      caretakerUserId: tenant.caretaker_user_id,
      caretakerFullName: caretaker?.full_name || null,
      caretakerPhoneNumber: caretaker?.phone_number || null,
      caretakerWhatsappNumber: caretaker?.whatsapp_number || null,
      caretakerEmail: caretaker?.email || null,
      caretakerStatus: caretaker?.status || null,
      
      leaseId: activeLease?.id || null,
      leaseNumber: activeLease?.lease_number || null,
      leaseStartDate: activeLease?.start_date || null,
      leaseEndDate: activeLease?.end_date || null,
      leaseStatus: activeLease?.status || null,
      leasePdfUrl: activeLease?.pdf_url || null,
      
      paidMonths,
      moveInDate: tenant.move_in_date,
      moveOutDate: tenant.move_out_date,
      
      pendingIssuesCount: pendingIssues || 0,
      resolvedIssuesCount: resolvedIssues || 0,
      pendingRepairsCount: pendingRepairs || 0,
      solvedRepairsCount: solvedRepairs || 0,
      notificationsCount: notifications || 0,
      announcementsCount: 0, // Will be fetched separately
      
      averagePropertyRating: null, // Will be fetched separately
    };
    
    return { data: dashboardData, error: null };
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('getTenantDashboardFallback exception:', err);
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Failed to load tenant dashboard (fallback)',
        details: errorMessage,
      },
    };
  }
}

// ============================================================================
// Notifications
// ============================================================================
export async function getTenantNotifications(): Promise<TenantNotification[]> {
  const supabase = getSupabaseClient() as any;
  
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return [];
  
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, title, body, read_at, created_at')
    .eq('user_id', authData.user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error('getTenantNotifications error:', error);
    return [];
  }
  
  return (data || []).map((n: any) => ({
    id: n.id,
    userId: n.user_id,
    title: n.title,
    body: n.body,
    readAt: n.read_at,
    createdAt: n.created_at,
  }));
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = getSupabaseClient() as any;
  
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);
  
  if (error) {
    console.error('markNotificationRead error:', error);
    throw error;
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = getSupabaseClient() as any;
  
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return;
  
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', authData.user.id)
    .is('read_at', null);
  
  if (error) {
    console.error('markAllNotificationsRead error:', error);
    throw error;
  }
}

// ============================================================================
// Announcements
// ============================================================================
export async function getTenantAnnouncements(propertyId: string | null): Promise<TenantAnnouncement[]> {
  const supabase = getSupabaseClient() as any;
  
  let query = supabase
    .from('announcements')
    .select('id, title, body, target_role, property_id, is_global, sender_user_id, sender_employee_id, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(20);
  
  // Filter for tenant-relevant announcements
  if (propertyId) {
    query = query.or(`is_global.eq.true,property_id.eq.${propertyId},target_role.eq.TENANT`);
  } else {
    query = query.or('is_global.eq.true,target_role.eq.TENANT');
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('getTenantAnnouncements error:', error);
    return [];
  }
  
  return (data || []).map((a: any) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    targetRole: a.target_role,
    propertyId: a.property_id,
    isGlobal: a.is_global,
    senderUserId: a.sender_user_id,
    senderEmployeeId: a.sender_employee_id,
    createdAt: a.created_at,
  }));
}

// ============================================================================
// Property Rules
// ============================================================================
export async function getTenantPropertyRules(propertyId: string | null): Promise<TenantPropertyRule[]> {
  if (!propertyId) return [];
  
  const supabase = getSupabaseClient() as any;
  
  const { data, error } = await supabase
    .from('property_rules')
    .select('id, property_id, title, description, sort_order, is_active')
    .eq('property_id', propertyId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(50);
  
  if (error) {
    console.error('getTenantPropertyRules error:', error);
    return [];
  }
  
  return (data || []).map((r: any) => ({
    id: r.id,
    propertyId: r.property_id,
    title: r.title,
    description: r.description,
    sortOrder: r.sort_order,
    isActive: r.is_active,
  }));
}

// ============================================================================
// Property FAQs
// ============================================================================
export async function getTenantPropertyFaqs(propertyId: string | null): Promise<TenantPropertyFaq[]> {
  if (!propertyId) return [];
  
  const supabase = getSupabaseClient() as any;
  
  const { data, error } = await supabase
    .from('property_faqs')
    .select('id, property_id, question, answer, sort_order, is_active')
    .eq('property_id', propertyId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(50);
  
  if (error) {
    console.error('getTenantPropertyFaqs error:', error);
    return [];
  }
  
  return (data || []).map((f: any) => ({
    id: f.id,
    propertyId: f.property_id,
    question: f.question,
    answer: f.answer,
    sortOrder: f.sort_order,
    isActive: f.is_active,
  }));
}

// ============================================================================
// Property Reviews
// ============================================================================
export async function getTenantPropertyReviews(propertyId: string | null): Promise<TenantPropertyReview[]> {
  if (!propertyId) return [];
  
  const supabase = getSupabaseClient() as any;
  
  const { data, error } = await supabase
    .from('property_reviews')
    .select('id, tenant_id, property_id, rating, comment, created_at')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('getTenantPropertyReviews error:', error);
    return [];
  }
  
  return (data || []).map((r: any) => ({
    id: r.id,
    tenantId: r.tenant_id,
    propertyId: r.property_id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
  }));
}

export async function getTenantExistingReview(tenantId: string, propertyId: string): Promise<TenantPropertyReview | null> {
  const supabase = getSupabaseClient() as any;
  
  const { data, error } = await supabase
    .from('property_reviews')
    .select('id, tenant_id, property_id, rating, comment, created_at')
    .eq('tenant_id', tenantId)
    .eq('property_id', propertyId)
    .maybeSingle();
  
  if (error) {
    console.error('getTenantExistingReview error:', error);
    return null;
  }
  
  if (!data) return null;
  
  return {
    id: data.id,
    tenantId: data.tenant_id,
    propertyId: data.property_id,
    rating: data.rating,
    comment: data.comment,
    createdAt: data.created_at,
  };
}

export async function submitTenantPropertyReview(payload: TenantReviewPayload): Promise<void> {
  const supabase = getSupabaseClient() as any;
  
  // Validate rating
  if (payload.rating < 1 || payload.rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  
  const { error } = await supabase
    .from('property_reviews')
    .insert({
      tenant_id: payload.tenantId,
      property_id: payload.propertyId,
      rating: payload.rating,
      comment: payload.comment,
    });
  
  if (error) {
    console.error('submitTenantPropertyReview error:', error);
    // Check for unique constraint violation
    if (error.code === '23505') {
      throw new Error('You have already rated this property.');
    }
    throw error;
  }
}

// ============================================================================
// Submit Issue
// ============================================================================
export async function submitTenantIssue(payload: TenantIssuePayload): Promise<void> {
  const supabase = getSupabaseClient() as any;
  
  const { error } = await supabase
    .from('issues')
    .insert({
      tenant_id: payload.tenantId,
      tenant_user_id: payload.tenantUserId,
      property_id: payload.propertyId,
      unit_id: payload.unitId,
      caretaker_employee_id: payload.caretakerEmployeeId,
      target_role: payload.targetRole,
      title: payload.title,
      description: payload.description,
      status: payload.status,
      priority: payload.priority,
    });
  
  if (error) {
    console.error('submitTenantIssue error:', error);
    throw error;
  }
}

// ============================================================================
// Activity Items
// ============================================================================
export async function getTenantActivityItems(tenantId: string, propertyId: string | null): Promise<TenantActivityItem[]> {
  const supabase = getSupabaseClient() as any;
  
  // Fetch recent items from multiple sources
  const [
    { data: payments },
    { data: issues },
    { data: repairs },
    { data: announcements },
  ] = await Promise.all([
    supabase.from('payments').select('id, status, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(5),
    supabase.from('issues').select('id, title, status, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(5),
    supabase.from('repairs').select('id, title, status, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(5),
    propertyId 
      ? supabase.from('announcements').select('id, title, created_at').eq('is_published', true).or(`is_global.eq.true,property_id.eq.${propertyId}`).order('created_at', { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
  ]);
  
  const activities: TenantActivityItem[] = [
    ...(payments || []).map((p: any) => ({
      id: `payment-${p.id}`,
      type: 'payment' as const,
      title: `Payment ${p.status}`,
      date: new Date(p.created_at).toLocaleString(),
    })),
    ...(issues || []).map((i: any) => ({
      id: `issue-${i.id}`,
      type: 'maintenance' as const,
      title: i.title,
      desc: `Status: ${i.status}`,
      date: new Date(i.created_at).toLocaleString(),
    })),
    ...(repairs || []).map((r: any) => ({
      id: `repair-${r.id}`,
      type: 'maintenance' as const,
      title: r.title,
      desc: `Status: ${r.status}`,
      date: new Date(r.created_at).toLocaleString(),
    })),
    ...(announcements || []).map((a: any) => ({
      id: `announcement-${a.id}`,
      type: 'announcement' as const,
      title: a.title,
      date: new Date(a.created_at).toLocaleString(),
    })),
  ];
  
  // Sort by date descending
  return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);
}

// ============================================================================
// Log Activity
// ============================================================================
export async function logTenantActivity(
  activityType: string,
  title: string,
  description: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const supabase = getSupabaseClient() as any;
  
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return;
  
  // Try to log to tenant_activity_logs if table exists
  try {
    await supabase.from('tenant_activity_logs').insert({
      tenant_user_id: authData.user.id,
      activity_type: activityType,
      title,
      description,
      metadata,
    });
  } catch (err) {
    // Silently fail if table doesn't exist
    console.log('Activity logging not available');
  }
}
