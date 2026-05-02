// ============================================================================
// CARETAKER DASHBOARD DATA LAYER - Supabase Direct Queries
// No backend API calls - all Supabase client
// ============================================================================

import { getSupabaseClient } from '@/lib/supabase/client';

// Cast to any to bypass strict typing until Supabase types are fully generated
const getClient = (): any => getSupabaseClient() as any;
import type {
  CaretakerDashboardData,
  CaretakerProperty,
  CaretakerUnit,
  CaretakerTenant,
  CaretakerLease,
  CaretakerIssue,
  CaretakerRepair,
  CaretakerRule,
  CaretakerFaq,
  CaretakerFacilities,
  CaretakerInventoryItem,
  CaretakerApplication,
  CaretakerAnnouncement,
  CaretakerMessage,
  UpdatePropertyPayload,
  UpdateUnitPayload,
  UpdateIssuePayload,
  CreateRepairPayload,
  UpdateRepairPayload,
  CreateRulePayload,
  UpdateRulePayload,
  CreateFaqPayload,
  UpdateFaqPayload,
  UpsertFacilitiesPayload,
  CreateInventoryPayload,
  UpdateInventoryPayload,
  UpdateApplicationPayload,
  CreateAnnouncementPayload,
  SendMessagePayload,
  UnitAvailabilityStatus,
  UnitStatus,
  IssueStatus,
  RepairStatus,
  ApplicationStatus,
} from './types';

// ============================================================================
// AUTH HELPERS
// ============================================================================

async function getCurrentUserId(): Promise<string | null> {
  const supabase = getClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getCurrentCaretakerEmployee(): Promise<{ id: string; assigned_property_id: string | null } | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = getClient();
  const { data, error } = await supabase
    .from('employees')
    .select('id, assigned_property_id')
    .eq('user_id', userId)
    .eq('role_id', 'CARETAKER')
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (error) {
    console.error('Error fetching caretaker employee:', error);
    return null;
  }

  return data;
}

// ============================================================================
// DASHBOARD - Primary View Query
// ============================================================================

export async function getCaretakerDashboardData(): Promise<CaretakerDashboardData | null> {
  const supabase = getClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('caretaker_dashboard_view')
    .select('*')
    .eq('caretaker_user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching caretaker dashboard:', error);
    return null;
  }

  return data as CaretakerDashboardData | null;
}

// ============================================================================
// PROPERTY MANAGEMENT
// ============================================================================

export async function getCaretakerProperty(propertyId: string): Promise<CaretakerProperty | null> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching property:', error);
    return null;
  }

  return data as CaretakerProperty | null;
}

export async function updateCaretakerProperty(
  propertyId: string,
  payload: UpdatePropertyPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();

  const { error } = await supabase
    .from('properties')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId);

  if (error) {
    console.error('Error updating property:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================================================
// UNITS/ROOMS MANAGEMENT
// ============================================================================

export async function getCaretakerUnits(propertyId: string): Promise<CaretakerUnit[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('property_id', propertyId)
    .order('room_number', { ascending: true });

  if (error) {
    console.error('Error fetching units:', error);
    return [];
  }

  return (data || []) as CaretakerUnit[];
}

export async function updateUnitAvailability(
  unitId: string,
  payload: UpdateUnitPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.availability_status) {
    updates.availability_status = payload.availability_status;
    // Sync status with availability for consistency
    if (payload.availability_status === 'AVAILABLE') {
      updates.status = 'VACANT';
    } else if (payload.availability_status === 'OCCUPIED') {
      updates.status = 'TAKEN';
    }
  }

  if (payload.status) {
    updates.status = payload.status;
  }

  if (payload.amenities) {
    updates.amenities = payload.amenities;
  }

  const { error } = await supabase
    .from('units')
    .update(updates)
    .eq('id', unitId);

  if (error) {
    console.error('Error updating unit:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Helper to update unit status with valid enum values
export async function setUnitStatus(
  unitId: string,
  availabilityStatus: UnitAvailabilityStatus
): Promise<{ success: boolean; error?: string }> {
  return updateUnitAvailability(unitId, { availability_status: availabilityStatus });
}

// ============================================================================
// TENANTS MANAGEMENT
// ============================================================================

export async function getCaretakerTenants(propertyId: string): Promise<CaretakerTenant[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('tenants')
    .select(`
      *,
      unit:units!tenants_unit_id_fkey (
        room_number,
        room_type
      ),
      lease:leases!leases_tenant_id_fkey (
        id,
        lease_number,
        start_date,
        end_date,
        status
      )
    `)
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tenants:', error);
    return [];
  }

  // Transform to ensure single lease per tenant
  const tenants = (data || []).map((t: any) => ({
    ...t,
    lease: t.lease?.[0] || t.lease || null,
  }));

  return tenants as CaretakerTenant[];
}

export async function getTenantById(tenantId: string): Promise<CaretakerTenant | null> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('tenants')
    .select(`
      *,
      unit:units!tenants_unit_id_fkey (
        room_number,
        room_type
      )
    `)
    .eq('id', tenantId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }

  return data as CaretakerTenant | null;
}

// ============================================================================
// LEASES (Read-only for caretakers)
// ============================================================================

export async function getCaretakerLeases(propertyId: string): Promise<CaretakerLease[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('leases')
    .select(`
      *,
      tenant:tenants!leases_tenant_id_fkey (
        full_name,
        room_number
      ),
      unit:units!leases_unit_id_fkey (
        room_number,
        room_type
      )
    `)
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leases:', error);
    return [];
  }

  return (data || []) as CaretakerLease[];
}

// ============================================================================
// ISSUES MANAGEMENT
// ============================================================================

export async function getCaretakerIssues(propertyId: string): Promise<CaretakerIssue[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('issues')
    .select(`
      *,
      tenant:tenants!issues_tenant_id_fkey (
        full_name,
        room_number
      ),
      unit:units!issues_unit_id_fkey (
        room_number
      )
    `)
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching issues:', error);
    return [];
  }

  return (data || []) as CaretakerIssue[];
}

export async function updateCaretakerIssue(
  issueId: string,
  payload: UpdateIssuePayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.status) updates.status = payload.status;
  if (payload.priority) updates.priority = payload.priority;
  if (payload.caretaker_employee_id) updates.caretaker_employee_id = payload.caretaker_employee_id;

  const { error } = await supabase
    .from('issues')
    .update(updates as any)
    .eq('id', issueId);

  if (error) {
    console.error('Error updating issue:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function markIssueAsResolved(issueId: string): Promise<{ success: boolean; error?: string }> {
  return updateCaretakerIssue(issueId, { status: 'RESOLVED' });
}

export async function markIssueAsInProgress(issueId: string): Promise<{ success: boolean; error?: string }> {
  return updateCaretakerIssue(issueId, { status: 'IN_PROGRESS' });
}

// ============================================================================
// REPAIRS MANAGEMENT
// ============================================================================

export async function getCaretakerRepairs(propertyId: string): Promise<CaretakerRepair[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('repairs')
    .select(`
      *,
      issue:issues!repairs_issue_id_fkey (
        title,
        description
      ),
      tenant:tenants!repairs_tenant_id_fkey (
        full_name,
        room_number
      ),
      unit:units!repairs_unit_id_fkey (
        room_number
      )
    `)
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching repairs:', error);
    return [];
  }

  return (data || []) as CaretakerRepair[];
}

export async function createCaretakerRepair(
  payload: CreateRepairPayload
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getClient();

  // Get caretaker employee id
  const employee = await getCurrentCaretakerEmployee();

  const { data, error } = await supabase
    .from('repairs')
    .insert({
      ...payload,
      caretaker_employee_id: employee?.id,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating repair:', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

export async function updateCaretakerRepair(
  repairId: string,
  payload: UpdateRepairPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.status) updates.status = payload.status;
  if (payload.after_photo_url !== undefined) updates.after_photo_url = payload.after_photo_url;
  if (payload.resolution_notes !== undefined) updates.resolution_notes = payload.resolution_notes;

  const { error } = await supabase
    .from('repairs')
    .update(updates)
    .eq('id', repairId);

  if (error) {
    console.error('Error updating repair:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function markRepairAsSolved(
  repairId: string,
  resolutionNotes?: string
): Promise<{ success: boolean; error?: string }> {
  return updateCaretakerRepair(repairId, {
    status: 'SOLVED',
    resolution_notes: resolutionNotes,
  });
}

// ============================================================================
// PROPERTY RULES
// ============================================================================

export async function getCaretakerRules(propertyId: string): Promise<CaretakerRule[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('property_rules')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rules:', error);
    return [];
  }

  return (data || []) as CaretakerRule[];
}

export async function createCaretakerRule(
  payload: CreateRulePayload
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('property_rules')
    .insert({
      ...payload,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating rule:', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

export async function updateCaretakerRule(
  ruleId: string,
  payload: UpdateRulePayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.title !== undefined) updates.title = payload.title;
  if (payload.description !== undefined) updates.description = payload.description;
  if (payload.is_active !== undefined) updates.is_active = payload.is_active;

  const { error } = await supabase
    .from('property_rules')
    .update(updates)
    .eq('id', ruleId);

  if (error) {
    console.error('Error updating rule:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteCaretakerRule(ruleId: string): Promise<{ success: boolean; error?: string }> {
  // Soft delete by deactivating
  return updateCaretakerRule(ruleId, { is_active: false });
}

// ============================================================================
// PROPERTY FAQs
// ============================================================================

export async function getCaretakerFaqs(propertyId: string): Promise<CaretakerFaq[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('property_faqs')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching FAQs:', error);
    return [];
  }

  return (data || []) as CaretakerFaq[];
}

export async function createCaretakerFaq(
  payload: CreateFaqPayload
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('property_faqs')
    .insert({
      ...payload,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating FAQ:', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

export async function updateCaretakerFaq(
  faqId: string,
  payload: UpdateFaqPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.question !== undefined) updates.question = payload.question;
  if (payload.answer !== undefined) updates.answer = payload.answer;
  if (payload.is_active !== undefined) updates.is_active = payload.is_active;

  const { error } = await supabase
    .from('property_faqs')
    .update(updates)
    .eq('id', faqId);

  if (error) {
    console.error('Error updating FAQ:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteCaretakerFaq(faqId: string): Promise<{ success: boolean; error?: string }> {
  return updateCaretakerFaq(faqId, { is_active: false });
}

// ============================================================================
// PROPERTY FACILITIES
// ============================================================================

export async function getCaretakerFacilities(propertyId: string): Promise<CaretakerFacilities | null> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('property_facilities')
    .select('*')
    .eq('property_id', propertyId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching facilities:', error);
    return null;
  }

  return data as CaretakerFacilities | null;
}

export async function upsertCaretakerFacilities(
  payload: UpsertFacilitiesPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();
  const userId = await getCurrentUserId();

  const { data: existing } = await supabase
    .from('property_facilities')
    .select('id')
    .eq('property_id', payload.property_id)
    .maybeSingle();

  if (existing) {
    // Update
    const { error } = await supabase
      .from('property_facilities')
      .update({
        ...payload,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating facilities:', error);
      return { success: false, error: error.message };
    }
  } else {
    // Insert
    const { error } = await supabase
      .from('property_facilities')
      .insert({
        ...payload,
        updated_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error creating facilities:', error);
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}

// ============================================================================
// PROPERTY INVENTORY
// ============================================================================

export async function getCaretakerInventory(propertyId: string): Promise<CaretakerInventoryItem[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('property_inventory')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }

  return (data || []) as CaretakerInventoryItem[];
}

export async function createInventoryItem(
  payload: CreateInventoryPayload
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getClient();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('property_inventory')
    .insert({
      ...payload,
      updated_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating inventory item:', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

export async function updateInventoryItem(
  itemId: string,
  payload: UpdateInventoryPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();
  const userId = await getCurrentUserId();

  const updates: Record<string, any> = {
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.quantity !== undefined) updates.quantity = payload.quantity;
  if (payload.condition !== undefined) updates.condition = payload.condition;
  if (payload.notes !== undefined) updates.notes = payload.notes;

  const { error } = await supabase
    .from('property_inventory')
    .update(updates)
    .eq('id', itemId);

  if (error) {
    console.error('Error updating inventory item:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================================================
// TENANT APPLICATIONS
// ============================================================================

export async function getCaretakerApplications(propertyId: string): Promise<CaretakerApplication[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('tenant_applications')
    .select(`
      *,
      unit:units!tenant_applications_unit_id_fkey (
        room_number,
        room_type
      )
    `)
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    return [];
  }

  return (data || []) as CaretakerApplication[];
}

export async function updateCaretakerApplication(
  applicationId: string,
  payload: UpdateApplicationPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.status !== undefined) updates.status = payload.status;
  if (payload.notes !== undefined) updates.notes = payload.notes;
  if (payload.rejection_reason !== undefined) updates.rejection_reason = payload.rejection_reason;

  const { error } = await supabase
    .from('tenant_applications')
    .update(updates)
    .eq('id', applicationId);

  if (error) {
    console.error('Error updating application:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Simplified flow: Use accept_application RPC instead
export async function approveApplicationCaretaker(
  applicationId: string,
  unitId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();
  
  const { data, error } = await supabase.rpc('accept_application', {
    p_application_id: applicationId,
    p_assigned_unit_id: unitId,
    p_start_date: new Date().toISOString().split('T')[0],
    p_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  if (error) {
    console.error('Error accepting application:', error);
    return { success: false, error: error.message };
  }

  return data || { success: true };
}

// Simplified flow: Use reject_application RPC instead
export async function rejectApplicationCaretaker(
  applicationId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();
  
  const { data, error } = await supabase.rpc('reject_application', {
    p_application_id: applicationId,
    p_reason: reason
  });

  if (error) {
    console.error('Error rejecting application:', error);
    return { success: false, error: error.message };
  }

  return data || { success: true };
}

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

export async function getCaretakerAnnouncements(propertyId: string, caretakerEmployeeId: string): Promise<{
  incoming: CaretakerAnnouncement[];
  outgoing: CaretakerAnnouncement[];
}> {
  const supabase = getClient();

  // Incoming: targeted to caretaker or their property or global
  const { data: incoming, error: incomingError } = await supabase
    .from('announcements')
    .select('*')
    .or(`target_role.eq.CARETAKER,property_id.eq.${propertyId},is_global.eq.true`)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (incomingError) {
    console.error('Error fetching incoming announcements:', incomingError);
  }

  // Outgoing: sent by this caretaker
  const { data: outgoing, error: outgoingError } = await supabase
    .from('announcements')
    .select('*')
    .eq('sender_employee_id', caretakerEmployeeId)
    .order('created_at', { ascending: false });

  if (outgoingError) {
    console.error('Error fetching outgoing announcements:', outgoingError);
  }

  return {
    incoming: (incoming || []) as CaretakerAnnouncement[],
    outgoing: (outgoing || []) as CaretakerAnnouncement[],
  };
}

export async function createCaretakerAnnouncement(
  payload: CreateAnnouncementPayload
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getClient();
  const { data: { user } } = await supabase.auth.getUser();
  const employee = await getCurrentCaretakerEmployee();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      ...payload,
      sender_user_id: user.id,
      sender_employee_id: employee?.id,
      is_published: true,
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
// MESSAGES
// ============================================================================

export async function getCaretakerMessages(): Promise<CaretakerMessage[]> {
  const supabase = getClient();
  const userId = await getCurrentUserId();

  if (!userId) return [];

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_user_id_fkey (
        full_name,
        email
      ),
      receiver:profiles!messages_receiver_user_id_fkey (
        full_name,
        email
      ),
      tenant:tenants!messages_tenant_id_fkey (
        full_name,
        room_number
      )
    `)
    .or(`sender_user_id.eq.${userId},receiver_user_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return (data || []) as CaretakerMessage[];
}

export async function sendCaretakerMessage(
  payload: SendMessagePayload
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_user_id: userId,
      ...payload,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

export async function markMessageAsRead(messageId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();

  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId);

  if (error) {
    console.error('Error marking message as read:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================================================
// FALLBACK QUERY CHAIN (if caretaker_dashboard_view is missing)
// ============================================================================

export async function getCaretakerDashboardDataFallback(): Promise<CaretakerDashboardData | null> {
  const supabase = getClient();

  // 1. Get current auth user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 2. Fetch employee where user_id = auth.uid() and role_id = CARETAKER
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, assigned_property_id, full_name, phone_number, email')
    .eq('user_id', user.id)
    .eq('role_id', 'CARETAKER')
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (employeeError || !employee || !employee.assigned_property_id) {
    console.error('Caretaker employee not found or no assigned property:', employeeError);
    return null;
  }

  const propertyId = employee.assigned_property_id;

  // 3. Fetch counts
  const [
    { count: totalRooms },
    { count: occupiedRooms },
    { count: vacantRooms },
    { count: tenantsCount },
    { count: pendingIssues },
    { count: resolvedIssues },
    { count: pendingRepairs },
    { count: solvedRepairs },
    { count: pendingApplications },
    { count: outgoingAnnouncements },
    { count: incomingAnnouncements },
    { data: property },
  ] = await Promise.all([
    supabase.from('units').select('*', { count: 'exact', head: true }).eq('property_id', propertyId),
    supabase.from('units').select('*', { count: 'exact', head: true }).eq('property_id', propertyId).or('status.eq.TAKEN,availability_status.eq.OCCUPIED'),
    supabase.from('units').select('*', { count: 'exact', head: true }).eq('property_id', propertyId).or('status.eq.VACANT,availability_status.eq.AVAILABLE'),
    supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('property_id', propertyId),
    supabase.from('issues').select('*', { count: 'exact', head: true }).eq('property_id', propertyId).eq('status', 'PENDING'),
    supabase.from('issues').select('*', { count: 'exact', head: true }).eq('property_id', propertyId).eq('status', 'RESOLVED'),
    supabase.from('repairs').select('*', { count: 'exact', head: true }).eq('property_id', propertyId).in('status', ['PENDING', 'IN_PROGRESS']),
    supabase.from('repairs').select('*', { count: 'exact', head: true }).eq('property_id', propertyId).eq('status', 'SOLVED'),
    supabase.from('tenant_applications').select('*', { count: 'exact', head: true }).eq('property_id', propertyId).eq('status', 'PENDING'),
    supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('sender_employee_id', employee.id),
    supabase.from('announcements').select('*', { count: 'exact', head: true }).or(`target_role.eq.CARETAKER,property_id.eq.${propertyId},is_global.eq.true`).eq('is_published', true),
    supabase.from('properties').select('name, location').eq('id', propertyId).maybeSingle(),
  ]);

  return {
    caretaker_employee_id: employee.id,
    caretaker_user_id: user.id,
    caretaker_full_name: employee.full_name,
    caretaker_phone_number: employee.phone_number,
    caretaker_email: employee.email,
    assigned_property_id: propertyId,
    property_name: property?.name || null,
    property_location: property?.location || null,
    total_rooms: totalRooms || 0,
    occupied_rooms: occupiedRooms || 0,
    vacant_rooms: vacantRooms || 0,
    tenants_count: tenantsCount || 0,
    pending_issues_count: pendingIssues || 0,
    resolved_issues_count: resolvedIssues || 0,
    pending_repairs_count: pendingRepairs || 0,
    solved_repairs_count: solvedRepairs || 0,
    pending_applications_count: pendingApplications || 0,
    outgoing_announcements_count: outgoingAnnouncements || 0,
    incoming_announcements_count: incomingAnnouncements || 0,
  };
}
