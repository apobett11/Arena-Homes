import { getSupabaseClient } from '@/lib/supabase/client';

// ============================================================================
// UNIVERSAL DATABASE CONTRACT API
// These functions use the views created by migration 0010_universal_database_contract.sql
// ============================================================================

export interface TenantDashboardData {
  // Tenant info
  tenant_id: string;
  tenant_user_id: string;
  tenant_full_name: string;
  tenant_phone_number: string;
  tenant_whatsapp_number: string;
  tenant_registration_number: string;
  tenant_email: string;
  tenant_logo_url: string;
  
  // Property info
  property_id: string;
  property_name: string;
  property_location: string;
  property_type: string;
  property_latitude: number;
  property_longitude: number;
  
  // Unit/Room info
  unit_id: string;
  room_number: string;
  room_type: string;
  room_price: number;
  
  // Caretaker info
  caretaker_employee_id: string;
  caretaker_user_id: string;
  caretaker_full_name: string;
  caretaker_phone_number: string;
  caretaker_whatsapp_number: string;
  caretaker_email: string;
  
  // Lease info
  lease_id: string;
  lease_number: string;
  lease_start_date: string;
  lease_end_date: string;
  lease_status: string;
  lease_pdf_url: string;
  
  // Payment/Financial
  paid_months: number;
  move_in_date: string;
  move_out_date: string;
  
  // Activity counts
  pending_issues_count: number;
  resolved_issues_count: number;
  pending_repairs_count: number;
  solved_repairs_count: number;
  notifications_count: number;
  announcements_count: number;
  
  // Property stats
  average_property_rating: number;
}

export interface AdminPropertyData {
  property_id: string;
  property_name: string;
  location: string;
  property_type: string;
  caretaker_employee_id: string;
  caretaker_user_id: string;
  caretaker_full_name: string;
  caretaker_phone_number: string;
  caretaker_email: string;
  verification_status: string;
  listing_status: string;
  total_rooms: number;
  occupied_rooms: number;
  vacant_rooms: number;
  reserved_rooms: number;
  maintenance_rooms: number;
  price_min: number;
  price_max: number;
  deposit_required: boolean;
  deposit_amount: number;
  latitude: number;
  longitude: number;
  overall_rating: number;
  review_count: number;
  likes_count: number;
  tenant_count: number;
  created_at: string;
  updated_at: string;
}

export interface PublicPropertyData {
  property_id: string;
  property_name: string;
  location: string;
  property_type: string;
  description: string;
  verification_status: string;
  listing_status: string;
  cover_photo_url: string;
  gate_photo_url: string;
  logo_url: string;
  latitude: number;
  longitude: number;
  total_rooms: number;
  vacant_rooms: number;
  occupied_rooms: number;
  price_min: number;
  price_max: number;
  deposit_required: boolean;
  caretaker_assigned: boolean;
  caretaker_name: string;
  overall_rating: number;
  review_count: number;
  likes_count: number;
  created_at: string;
}

export interface CaretakerDashboardData {
  caretaker_employee_id: string;
  caretaker_user_id: string;
  caretaker_full_name: string;
  caretaker_phone_number: string;
  caretaker_email: string;
  assigned_property_id: string;
  property_name: string;
  property_location: string;
  total_rooms: number;
  occupied_rooms: number;
  vacant_rooms: number;
  tenants_count: number;
  pending_issues_count: number;
  resolved_issues_count: number;
  pending_repairs_count: number;
  solved_repairs_count: number;
  pending_applications_count: number;
  outgoing_announcements_count: number;
  incoming_announcements_count: number;
}

export const UniversalApi = {
  // ==========================================================================
  // TENANT DASHBOARD - Single view query for tenant dashboard
  // ==========================================================================
  getTenantDashboard: async (userId?: string): Promise<TenantDashboardData | null> => {
    const supabase = getSupabaseClient() as any;
    
    // If no userId provided, get current user's tenant dashboard
    const targetUserId = userId || (await supabase.auth.getUser())?.data?.user?.id;
    if (!targetUserId) return null;
    
    const { data, error } = await supabase
      .from('tenant_dashboard_view')
      .select('*')
      .eq('tenant_user_id', targetUserId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching tenant dashboard:', error);
      return null;
    }
    
    return data as TenantDashboardData;
  },

  // ==========================================================================
  // ADMIN PROPERTIES - All properties with aggregated stats
  // ==========================================================================
  getAdminProperties: async (): Promise<AdminPropertyData[]> => {
    const supabase = getSupabaseClient() as any;
    
    const { data, error } = await supabase
      .from('admin_properties_view')
      .select('*')
      .order('property_name', { ascending: true });
    
    if (error) {
      console.error('Error fetching admin properties:', error);
      return [];
    }
    
    return (data || []) as AdminPropertyData[];
  },

  getAdminPropertyById: async (propertyId: string): Promise<AdminPropertyData | null> => {
    const supabase = getSupabaseClient() as any;
    
    const { data, error } = await supabase
      .from('admin_properties_view')
      .select('*')
      .eq('property_id', propertyId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching admin property:', error);
      return null;
    }
    
    return data as AdminPropertyData;
  },

  // ==========================================================================
  // PUBLIC LISTINGS - Properties for public listings page
  // ==========================================================================
  getPublicProperties: async (filters?: {
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    propertyType?: string;
    verifiedOnly?: boolean;
  }): Promise<PublicPropertyData[]> => {
    const supabase = getSupabaseClient() as any;
    
    let query = supabase
      .from('public_properties_view')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filters) {
      if (filters.minPrice !== undefined) {
        query = query.gte('price_min', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price_max', filters.maxPrice);
      }
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType);
      }
      if (filters.verifiedOnly) {
        query = query.eq('verification_status', 'VERIFIED');
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching public properties:', error);
      return [];
    }
    
    return (data || []) as PublicPropertyData[];
  },

  getPublicPropertyById: async (propertyId: string): Promise<PublicPropertyData | null> => {
    const supabase = getSupabaseClient() as any;
    
    const { data, error } = await supabase
      .from('public_properties_view')
      .select('*')
      .eq('property_id', propertyId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching public property:', error);
      return null;
    }
    
    return data as PublicPropertyData;
  },

  // ==========================================================================
  // CARETAKER DASHBOARD - Single view query for caretaker dashboard
  // ==========================================================================
  getCaretakerDashboard: async (userId?: string): Promise<CaretakerDashboardData | null> => {
    const supabase = getSupabaseClient() as any;
    
    // If no userId provided, get current user's caretaker dashboard
    const targetUserId = userId || (await supabase.auth.getUser())?.data?.user?.id;
    if (!targetUserId) return null;
    
    const { data, error } = await supabase
      .from('caretaker_dashboard_view')
      .select('*')
      .eq('caretaker_user_id', targetUserId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching caretaker dashboard:', error);
      return null;
    }
    
    return data as CaretakerDashboardData;
  },

  // ==========================================================================
  // VALIDATION - Check if the universal contract is properly set up
  // ==========================================================================
  validateContract: async (): Promise<{
    migration_name: string;
    executed_at: string;
    tables: Record<string, boolean>;
    views: Record<string, boolean>;
    counts: Record<string, number>;
    relationship_counts: Record<string, number>;
    helper_functions: Record<string, boolean>;
  } | null> => {
    const supabase = getSupabaseClient() as any;
    
    const { data, error } = await supabase.rpc('validate_universal_contract');
    
    if (error) {
      console.error('Error validating universal contract:', error);
      return null;
    }
    
    return data;
  },
};

export default UniversalApi;
