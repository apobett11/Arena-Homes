// Admin Dashboard Data Layer - Universal Database Contract
// All operations use Supabase client directly - no backend API

import { getSupabaseClient } from '@/lib/supabase/client';
import type {
  AdminEmployee,
  AdminProperty,
  AdminIssue,
  AdminAnnouncement,
  AdminDashboardStats,
  AdminWarningPayload,
  CreateUnitPayload,
  PropertyStats,
  EmployeeStatus,
  IssueStatus,
  IssuePriority,
  Message,
  SendMessagePayload,
  SendBroadcastPayload,
  SuspendUserPayload,
  Suspension,
} from './types';

const getClient = (): any => getSupabaseClient() as any;

// ============================================================================
// AUTH HELPERS
// ============================================================================

async function getCurrentUserId(): Promise<string | null> {
  const supabase = getClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ============================================================================
// EMPLOYEE MANAGEMENT
// ============================================================================

export async function getAllEmployees(): Promise<AdminEmployee[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      assigned_property:properties!employees_assigned_property_id_fkey (
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }

  return (data || []).map((e: any) => ({
    ...e,
    assigned_property_name: e.assigned_property?.name || null,
  })) as AdminEmployee[];
}

export async function updateEmployeeStatus(
  employeeId: string,
  status: EmployeeStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();

  const { error } = await supabase
    .from('employees')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', employeeId);

  if (error) {
    console.error('Error updating employee status:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function suspendEmployee(employeeId: string): Promise<{ success: boolean; error?: string }> {
  return updateEmployeeStatus(employeeId, 'SUSPENDED');
}

export async function restoreEmployee(employeeId: string): Promise<{ success: boolean; error?: string }> {
  return updateEmployeeStatus(employeeId, 'ACTIVE');
}

export async function revokeEmployeeAccess(employeeId: string): Promise<{ success: boolean; error?: string }> {
  return updateEmployeeStatus(employeeId, 'INACTIVE');
}

export async function sendWarningToEmployee(
  payload: AdminWarningPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();
  const adminUserId = await getCurrentUserId();

  // Insert into notifications table
  const { error } = await supabase.from('notifications').insert({
    user_id: payload.user_id,
    title: payload.title,
    body: payload.message,
    type: 'WARNING',
    metadata: {
      employee_id: payload.employee_id,
      sent_by_admin_user_id: adminUserId,
      severity: payload.severity || 'MEDIUM',
    },
    read_at: null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Error sending warning:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Safe password reset - creates notification only, no direct auth password change
export async function requestPasswordReset(
  employeeUserId: string,
  employeeName: string
): Promise<{ success: boolean; message: string; error?: string }> {
  const supabase = getClient();
  const adminUserId = await getCurrentUserId();

  // Create notification to employee asking them to reset password
  const { error: notifError } = await supabase.from('notifications').insert({
    user_id: employeeUserId,
    title: 'Password Reset Requested',
    body: 'An admin has requested you reset your password. Please use the "Forgot Password" feature on the login page.',
    type: 'PASSWORD_RESET',
    metadata: {
      requested_by_admin_user_id: adminUserId,
      action_required: true,
    },
    read_at: null,
    created_at: new Date().toISOString(),
  });

  if (notifError) {
    console.error('Error creating password reset notification:', notifError);
    return { success: false, message: '', error: notifError.message };
  }

  return {
    success: true,
    message: `Password reset notification sent to ${employeeName}. The user must use the "Forgot Password" feature to complete the reset securely.`,
  };
}

// ============================================================================
// PROPERTY MANAGEMENT
// ============================================================================

export async function getAllProperties(): Promise<AdminProperty[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      caretaker:employees!properties_caretaker_employee_id_fkey (
        id,
        user_id,
        full_name,
        email,
        phone_number,
        status
      )
    `)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching properties:', error);
    return [];
  }

  // Get unit counts
  const { data: units } = await supabase.from('units').select('property_id, status');
  const unitCounts = new Map<string, { total: number; occupied: number; vacant: number }>();

  for (const unit of units || []) {
    const counts = unitCounts.get(unit.property_id) || { total: 0, occupied: 0, vacant: 0 };
    counts.total++;
    if (unit.status === 'TAKEN' || unit.status === 'OCCUPIED') {
      counts.occupied++;
    } else {
      counts.vacant++;
    }
    unitCounts.set(unit.property_id, counts);
  }

  // Get tenant counts
  const { data: tenants } = await supabase.from('tenants').select('property_id');
  const tenantCounts = new Map<string, number>();
  for (const tenant of tenants || []) {
    tenantCounts.set(tenant.property_id, (tenantCounts.get(tenant.property_id) || 0) + 1);
  }

  // Get issue counts
  const { data: issues } = await supabase.from('issues').select('property_id');
  const issueCounts = new Map<string, number>();
  for (const issue of issues || []) {
    issueCounts.set(issue.property_id, (issueCounts.get(issue.property_id) || 0) + 1);
  }

  return (data || []).map((p: any) => {
    const counts = unitCounts.get(p.id) || { total: 0, occupied: 0, vacant: 0 };
    return {
      id: p.id,
      name: p.name,
      location: p.location,
      logo_url: p.logo_url,
      property_type: p.property_type,
      verification_status: p.verification_status,
      caretaker_employee_id: p.caretaker_employee_id,
      caretaker_user_id: p.caretaker_user_id,
      caretaker_name: p.caretaker?.full_name || null,
      caretaker_email: p.caretaker?.email || null,
      caretaker_phone: p.caretaker?.phone_number || null,
      caretaker_status: p.caretaker?.status || null,
      caretaker_password: p.caretaker_password || null,
      total_units: counts.total,
      occupied_units: counts.occupied,
      vacant_units: counts.vacant,
      tenant_count: tenantCounts.get(p.id) || 0,
      issues_count: issueCounts.get(p.id) || 0,
      created_at: p.created_at,
    };
  }) as AdminProperty[];
}

export async function removeCaretakerFromProperty(
  propertyId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();

  // Get current caretaker to clear their assignment
  const { data: property } = await supabase
    .from('properties')
    .select('caretaker_employee_id')
    .eq('id', propertyId)
    .maybeSingle();

  const caretakerId = property?.caretaker_employee_id;

  // Start a batch update
  const updates = [];

  // Clear property caretaker fields
  updates.push(
    supabase
      .from('properties')
      .update({
        caretaker_employee_id: null,
        caretaker_user_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', propertyId)
  );

  // Clear caretaker's assigned_property_id
  if (caretakerId) {
    updates.push(
      supabase
        .from('employees')
        .update({
          assigned_property_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', caretakerId)
    );
  }

  // Execute all updates
  const results = await Promise.all(updates);

  for (const result of results) {
    if (result.error) {
      console.error('Error removing caretaker:', result.error);
      return { success: false, error: result.error.message };
    }
  }

  return { success: true };
}

export async function assignCaretakerToProperty(
  propertyId: string,
  caretakerEmployeeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();

  // Get caretaker details
  const { data: caretaker, error: caretakerError } = await supabase
    .from('employees')
    .select('user_id, assigned_property_id')
    .eq('id', caretakerEmployeeId)
    .maybeSingle();

  if (caretakerError || !caretaker) {
    return { success: false, error: 'Caretaker not found' };
  }

  // Check if caretaker is already assigned elsewhere
  if (caretaker.assigned_property_id && caretaker.assigned_property_id !== propertyId) {
    return { success: false, error: 'Caretaker is already assigned to another property' };
  }

  // Update property with caretaker
  const { error: propertyError } = await supabase
    .from('properties')
    .update({
      caretaker_employee_id: caretakerEmployeeId,
      caretaker_user_id: caretaker.user_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId);

  if (propertyError) {
    return { success: false, error: propertyError.message };
  }

  // Update caretaker with property assignment
  const { error: employeeError } = await supabase
    .from('employees')
    .update({
      assigned_property_id: propertyId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', caretakerEmployeeId);

  if (employeeError) {
    return { success: false, error: employeeError.message };
  }

  return { success: true };
}

export async function getAvailableCaretakers(): Promise<AdminEmployee[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('role_id', 'CARETAKER')
    .eq('status', 'ACTIVE')
    .is('assigned_property_id', null)
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching available caretakers:', error);
    return [];
  }

  return (data || []) as AdminEmployee[];
}

export async function addUnitToProperty(
  payload: CreateUnitPayload
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('units')
    .insert({
      property_id: payload.property_id,
      room_number: payload.room_number,
      room_type: payload.room_type,
      base_price: payload.base_price,
      description: payload.description || null,
      amenities: payload.amenities || null,
      status: 'VACANT',
      availability_status: 'AVAILABLE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error adding unit:', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

export async function getPropertyStats(propertyId: string): Promise<PropertyStats | null> {
  const supabase = getClient();

  const [unitsResult, tenantsResult, issuesResult, leasesResult, reviewsResult] = await Promise.all([
    supabase.from('units').select('status').eq('property_id', propertyId),
    supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('property_id', propertyId),
    supabase.from('issues').select('status').eq('property_id', propertyId),
    supabase.from('leases').select('*', { count: 'exact', head: true }).eq('property_id', propertyId),
    supabase.from('property_reviews').select('rating').eq('property_id', propertyId),
  ]);

  const units = unitsResult.data || [];
  const issues = issuesResult.data || [];
  const reviews = reviewsResult.data || [];

  const totalUnits = units.length;
  const occupiedUnits = units.filter((u: any) => u.status === 'TAKEN' || u.status === 'OCCUPIED').length;
  const vacantUnits = units.filter((u: any) => u.status === 'VACANT').length;
  const reservedUnits = units.filter((u: any) => u.status === 'RESERVED').length;
  const maintenanceUnits = units.filter((u: any) => u.status === 'UNDER_MAINTENANCE').length;

  const pendingIssues = issues.filter((i: any) => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
  const resolvedIssues = issues.filter((i: any) => i.status === 'RESOLVED' || i.status === 'CLOSED').length;

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
    : null;

  return {
    property_id: propertyId,
    total_units: totalUnits,
    occupied_units: occupiedUnits,
    vacant_units: vacantUnits,
    reserved_units: reservedUnits,
    maintenance_units: maintenanceUnits,
    tenant_count: tenantsResult.count || 0,
    issues_count: issues.length,
    pending_issues: pendingIssues,
    resolved_issues: resolvedIssues,
    leases_count: leasesResult.count || 0,
    average_rating: averageRating,
    review_count: reviews.length,
  };
}

// ============================================================================
// ISSUES / REPORTS MANAGEMENT
// ============================================================================

export async function getAllIssues(filters?: {
  status?: IssueStatus | 'ALL';
  source?: 'TENANT' | 'CARETAKER' | 'ADMIN' | 'ALL';
  priority?: IssuePriority | 'ALL';
}): Promise<AdminIssue[]> {
  const supabase = getClient();

  let query = supabase
    .from('issues')
    .select(`
      *,
      property:properties!issues_property_id_fkey (
        name
      ),
      tenant:tenants!issues_tenant_id_fkey (
        full_name,
        user_id
      ),
      unit:units!issues_unit_id_fkey (
        room_number
      ),
      caretaker:employees!issues_caretaker_employee_id_fkey (
        full_name
      )
    `)
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'ALL') {
    query = query.eq('status', filters.status);
  }

  if (filters?.source && filters.source !== 'ALL') {
    query = query.eq('source', filters.source);
  }

  if (filters?.priority && filters.priority !== 'ALL') {
    query = query.eq('priority', filters.priority);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching issues:', error);
    return [];
  }

  const now = Date.now();

  return (data || []).map((i: any) => {
    const createdAt = new Date(i.created_at).getTime();
    const resolvedAt = i.resolved_at ? new Date(i.resolved_at).getTime() : null;
    const timePendingMs = resolvedAt
      ? resolvedAt - createdAt
      : now - createdAt;

    return {
      id: i.id,
      title: i.title,
      description: i.description,
      status: i.status,
      priority: i.priority,
      property_id: i.property_id,
      property_name: i.property?.name || null,
      unit_id: i.unit_id,
      room_number: i.unit?.room_number || null,
      tenant_id: i.tenant_id,
      tenant_name: i.tenant?.full_name || null,
      tenant_user_id: i.tenant?.user_id || null,
      caretaker_employee_id: i.caretaker_employee_id,
      caretaker_name: i.caretaker?.full_name || null,
      source: i.source || 'TENANT',
      target_role: i.target_role,
      created_at: i.created_at,
      resolved_at: i.resolved_at,
      time_pending_ms: timePendingMs,
    };
  }) as AdminIssue[];
}

export async function updateIssueStatus(
  issueId: string,
  status: IssueStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();

  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'RESOLVED' || status === 'CLOSED') {
    updates.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('issues')
    .update(updates)
    .eq('id', issueId);

  if (error) {
    console.error('Error updating issue status:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function resolveIssue(issueId: string): Promise<{ success: boolean; error?: string }> {
  return updateIssueStatus(issueId, 'RESOLVED');
}

// ============================================================================
// ANNOUNCEMENTS / BROADCAST
// ============================================================================

export async function getAllAnnouncements(): Promise<AdminAnnouncement[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }

  return (data || []) as AdminAnnouncement[];
}

export async function createAnnouncement(payload: {
  title: string;
  body: string;
  target_role: string;
  property_id?: string | null;
  is_global?: boolean;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getClient();
  const adminUserId = await getCurrentUserId();

  // Get admin employee id if available
  const { data: adminEmployee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', adminUserId)
    .maybeSingle();

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title: payload.title,
      body: payload.body,
      target_role: payload.target_role,
      property_id: payload.property_id || null,
      is_global: payload.is_global || false,
      is_published: true,
      sender_user_id: adminUserId,
      sender_employee_id: adminEmployee?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating announcement:', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = getClient();

  const [
    propertiesResult,
    unitsResult,
    tenantsResult,
    employeesResult,
    issuesResult,
    applicationsResult,
  ] = await Promise.all([
    supabase.from('properties').select('*', { count: 'exact', head: true }),
    supabase.from('units').select('status'),
    supabase.from('tenants').select('status'),
    supabase.from('employees').select('status'),
    supabase.from('issues').select('status'),
    supabase.from('tenant_applications').select('status').eq('status', 'PENDING'),
  ]);

  const units = unitsResult.data || [];
  const tenants = tenantsResult.data || [];
  const employees = employeesResult.data || [];
  const issues = issuesResult.data || [];

  const totalUnits = units.length;
  const occupiedUnits = units.filter((u: any) => u.status === 'TAKEN' || u.status === 'OCCUPIED').length;
  const vacantUnits = totalUnits - occupiedUnits;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const activeTenants = tenants.filter((t: any) => t.status === 'ACTIVE').length;
  const pendingTenants = tenants.filter((t: any) => t.status === 'PENDING').length;
  const inactiveTenants = tenants.filter((t: any) => t.status === 'INACTIVE' || t.status === 'SUSPENDED' || t.status === 'MOVED_OUT').length;

  const activeEmployees = employees.filter((e: any) => e.status === 'ACTIVE').length;
  const suspendedEmployees = employees.filter((e: any) => e.status === 'SUSPENDED').length;

  const unresolvedIssues = issues.filter((i: any) => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
  const resolvedIssues = issues.filter((i: any) => i.status === 'RESOLVED' || i.status === 'CLOSED').length;

  return {
    totalProperties: propertiesResult.count || 0,
    totalUnits,
    totalTenants: tenants.length,
    activeTenants,
    pendingTenants,
    inactiveTenants,
    occupancyRate,
    totalStaff: employees.length,
    activeEmployees,
    suspendedEmployees,
    escalatedComplaints: issues.length,
    unresolvedComplaints: unresolvedIssues,
    resolvedComplaints: resolvedIssues,
    pendingApprovals: applicationsResult.count || 0,
    vacantUnits,
    occupiedUnits,
  };
}

// ============================================================================
// MESSAGING FUNCTIONS
// ============================================================================

export async function sendMessage(payload: SendMessagePayload): Promise<{ success: boolean; error?: string; data?: any }> {
  const supabase = getClient();
  
  try {
    const { data, error } = await supabase.rpc('send_private_message', {
      p_to_user_id: payload.to_user_id,
      p_message_head: payload.message_head,
      p_message_body: payload.message_body
    });

    if (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Error sending message:', err);
    return { success: false, error: err.message };
  }
}

export async function sendBroadcastMessage(payload: SendBroadcastPayload): Promise<{ success: boolean; error?: string; data?: any }> {
  const supabase = getClient();
  
  try {
    const { data, error } = await supabase.rpc('send_broadcast_message', {
      p_target_role: payload.target_role,
      p_message_head: payload.message_head,
      p_message_body: payload.message_body
    });

    if (error) {
      console.error('Error sending broadcast:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Error sending broadcast:', err);
    return { success: false, error: err.message };
  }
}

export async function markMessageAsRead(messageId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();
  
  try {
    const { error } = await supabase.rpc('mark_message_read', {
      p_message_id: messageId
    });

    if (error) {
      console.error('Error marking message as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error marking message as read:', err);
    return { success: false, error: err.message };
  }
}

export async function getUserMessages(): Promise<Message[]> {
  const supabase = getClient();
  
  try {
    const { data, error } = await supabase
      .from('user_inbox')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.error('Error fetching messages:', err);
    return [];
  }
}

export async function getSentMessages(): Promise<Message[]> {
  const supabase = getClient();
  
  try {
    const { data, error } = await supabase
      .from('user_sent_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sent messages:', error);
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.error('Error fetching sent messages:', err);
    return [];
  }
}

// ============================================================================
// SUSPENSION FUNCTIONS
// ============================================================================

export async function suspendUser(payload: SuspendUserPayload): Promise<{ success: boolean; error?: string; data?: any }> {
  const supabase = getClient();
  
  try {
    const { data, error } = await supabase.rpc('suspend_user', {
      p_user_id: payload.user_id,
      p_reason: payload.reason,
      p_duration_days: payload.duration_days,
      p_notes: payload.notes
    });

    if (error) {
      console.error('Error suspending user:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Error suspending user:', err);
    return { success: false, error: err.message };
  }
}

export async function revokeUserAccess(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();
  
  try {
    const { error } = await supabase.rpc('revoke_user_access', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error revoking user access:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error revoking user access:', err);
    return { success: false, error: err.message };
  }
}

export async function restoreUserAccess(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();
  
  try {
    const { error } = await supabase.rpc('restore_user_access', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error restoring user access:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error restoring user access:', err);
    return { success: false, error: err.message };
  }
}

export async function getActiveSuspensions(): Promise<Suspension[]> {
  const supabase = getClient();
  
  try {
    const { data, error } = await supabase
      .from('active_suspensions')
      .select('*')
      .order('suspended_at', { ascending: false });

    if (error) {
      console.error('Error fetching suspensions:', error);
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.error('Error fetching suspensions:', err);
    return [];
  }
}

export async function isUserSuspended(userId: string): Promise<boolean> {
  const supabase = getClient();
  
  try {
    const { data, error } = await supabase.rpc('is_user_suspended', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error checking suspension status:', error);
      return false;
    }

    return data || false;
  } catch (err: any) {
    console.error('Error checking suspension status:', err);
    return false;
  }
}
