import { getSupabaseClient } from '@/lib/supabase/client';

// ============================================================================
// DEPRECATED: Use UniversalApi from './universal' for new code
// This file is kept for backward compatibility
// ============================================================================

export interface PropertyFacilities {
    houseGateImageUrl?: string;
    ownerType?: string;
    caretakerName?: string;
    caretakerPhone?: string;
    caretakerEmail?: string;
    caretakerTempPassword?: string;
    houseCardDetails?: string;
    policies?: string[];
    map?: {
        gateLabel: string;
        plotLabel: string;
        gateLat: number;
        gateLng: number;
        houseLat: number;
        houseLng: number;
    };
    invitePinCode?: string;
    realtimeMapAccess?: Record<string, number>;
}

export interface Property {
    id: string;
    name: string;
    location: string;
    caretakerId?: string;
    caretaker_user_id?: string;
    caretaker_employee_id?: string;
    logoUrl?: string;
    facilities?: PropertyFacilities;
    units?: Unit[];
    // Trust/Verification fields
    verificationStatus?: 'UNVERIFIED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'SUSPENDED' | 'FLAGGED';
    latitude?: number;
    longitude?: number;
    gateLatitude?: number;
    gateLongitude?: number;
    schoolGateDistanceMeters?: number;
    landmark?: string;
    // Caretaker info from join
    caretaker?: {
        id: string;
        user_id: string;
        full_name: string;
        email?: string;
        phone_number?: string;
        status?: string;
    };
    // New fields for property details display
    depositAmount?: number | null;
    returnDeposit?: boolean | null;
    waterSource?: string | null;
    waterAvailabilityDaysPerWeek?: number | null;
    electricityPayment?: string | null;
    roomSpaceSqm?: number | null;
    gateOpenTime?: string | null;
    gateCloseTime?: string | null;
    distanceFromSchoolKm?: number | null;
    parkingAvailable?: boolean | null;
    securityVerified?: boolean | null;
    propertyType?: string | null;
    monthlyRent?: number | null;
    description?: string | null;
    coverPhotoUrl?: string | null;
    listingStatus?: string | null;
}

export interface Unit {
    id: string;
    propertyId: string;
    type: string;
    description: string;
    basePrice: string;
    status: 'VACANT' | 'TAKEN';
    // Enhanced availability fields
    availabilityStatus?: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'UNDER_MAINTENANCE' | 'UNAVAILABLE';
    depositAmount?: number;
    amenities?: {
        water?: boolean;
        electricity?: boolean;
        security?: boolean;
        internet?: boolean;
    };
    photos?: string[];
    lastUpdated?: string;
    roomNumber?: string;
}

export interface PropertyFAQInput {
    question: string;
    answer: string;
}

export interface PropertyRuleInput {
    rule_text: string;
}

export interface CreatePropertyPayload {
    // Section A - Basic Info
    name: string;
    location: string;
    property_type: 'Bedsitter' | 'Single Room' | 'One Bedroom' | 'Two Bedroom';
    monthly_rent: number;
    description?: string;
    nearby_school_or_institution?: string;
    landmark?: string;
    contact_phone?: string;
    available_from?: string;
    logo_url?: string;
    cover_photo_url?: string;

    // Section B - Details
    number_of_units: number;
    electricity_payment: 'PERSONAL_PAYMENT' | 'COVERED';
    water_availability_days_per_week: number;
    water_source: 'Tank' | 'Well' | 'Pumped Water';
    room_space_sqm: number;
    deposit_amount: number;
    security_verified: boolean;
    return_deposit: boolean;
    gate_hours_from: string;
    gate_hours_to: string;
    parking_available: boolean;
    latitude: number;
    longitude: number;

    // Section C - Caretaker Info
    caretaker_first_name: string;
    caretaker_last_name: string;
    caretaker_email: string;
    caretaker_phone: string;

    // Section D - FAQ & Rules
    faqs: PropertyFAQInput[];
    rules: PropertyRuleInput[];
}

// Helper to transform Supabase property row to Property interface
const transformProperty = (row: any): Property => ({
    id: row.id,
    name: row.name,
    location: row.location,
    caretakerId: row.caretaker_id,
    caretaker_user_id: row.caretaker_user_id,
    caretaker_employee_id: row.caretaker_employee_id,
    logoUrl: row.logo_url,
    facilities: row.facilities,
    verificationStatus: row.verification_status,
    latitude: row.latitude,
    longitude: row.longitude,
    gateLatitude: row.gate_latitude,
    gateLongitude: row.gate_longitude,
    schoolGateDistanceMeters: row.school_gate_distance_meters,
    landmark: row.landmark,
    caretaker: row.caretaker,
    // New fields mapping
    depositAmount: row.deposit_amount,
    returnDeposit: row.return_deposit,
    waterSource: row.water_source,
    waterAvailabilityDaysPerWeek: row.water_availability_days_per_week,
    electricityPayment: row.electricity_payment,
    roomSpaceSqm: row.room_space_sqm,
    gateOpenTime: row.gate_open_time ?? row.gate_hours_from,
    gateCloseTime: row.gate_close_time ?? row.gate_hours_to,
    distanceFromSchoolKm: row.distance_from_school_km,
    parkingAvailable: row.parking_available,
    securityVerified: row.security_verified,
    propertyType: row.property_type,
    monthlyRent: row.monthly_rent,
    description: row.description,
    coverPhotoUrl: row.cover_photo_url,
    listingStatus: row.listing_status,
});

// Helper to transform Supabase unit row to Unit interface
const transformUnit = (row: any): Unit => ({
    id: row.id,
    propertyId: row.property_id,
    type: row.type,
    description: row.description,
    basePrice: row.base_price?.toString() || '0',
    status: row.status,
    availabilityStatus: row.availability_status,
    depositAmount: row.deposit_amount,
    amenities: row.amenities,
    photos: row.photos,
    lastUpdated: row.last_updated,
    roomNumber: row.room_number,
});

export const PropertyApi = {
    getAll: async (): Promise<Property[]> => {
        const supabase = getSupabaseClient() as any;
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

        if (error) throw error;
        return (data || []).map(transformProperty);
    },

    getOne: async (id: string): Promise<Property> => {
        const supabase = getSupabaseClient() as any;
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
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Property not found');
        return transformProperty(data);
    },

    // Get related properties by type (same property_type, exclude current, limit 3)
    getRelatedProperties: async (propertyId: string, propertyType: string, limit: number = 3): Promise<Property[]> => {
        const supabase = getSupabaseClient() as any;

        // Fetch published properties of same type, excluding current
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
            .eq('property_type', propertyType)
            .neq('id', propertyId)
            .or('listing_status.eq.PUBLISHED,verification_status.eq.VERIFIED')
            .limit(limit * 4); // Fetch more for randomization

        if (error) {
            console.error('Error fetching related properties:', error);
            return [];
        }

        // Shuffle and take limit
        const shuffled = (data || []).sort(() => 0.5 - Math.random());
        return shuffled.slice(0, limit).map(transformProperty);
    },

    create: async (data: CreatePropertyPayload): Promise<{ 
        id: string; 
        caretakerEmployeeId?: string;
        unitsCreated?: number;
        caretaker_password?: string;
        message?: string;
    }> => {
        const supabase = getSupabaseClient() as any;
        
        // Call the complete property creation RPC
        // IMPORTANT: Parameters must be in the EXACT order the SQL function expects:
        // 1-21: Required params (no defaults)
        // 22-31: Optional params (with defaults)
        const { data: result, error } = await supabase.rpc('create_property_complete', {
            // ========== REQUIRED PARAMETERS (1-21) ==========
            
            // Property basic info (1-4)
            p_name: data.name,
            p_location: data.location,
            p_property_type: data.property_type,
            p_monthly_rent: data.monthly_rent,
            
            // Property details (5-17)
            p_number_of_units: data.number_of_units,
            p_electricity_payment: data.electricity_payment,
            p_water_availability_days_per_week: data.water_availability_days_per_week,
            p_water_source: data.water_source,
            p_room_space_sqm: data.room_space_sqm,
            p_deposit_amount: data.deposit_amount,
            p_security_verified: data.security_verified,
            p_return_deposit: data.return_deposit,
            p_gate_hours_from: data.gate_hours_from,
            p_gate_hours_to: data.gate_hours_to,
            p_parking_available: data.parking_available,
            p_latitude: data.latitude,
            p_longitude: data.longitude,
            
            // Caretaker info (18-21)
            p_caretaker_first_name: data.caretaker_first_name,
            p_caretaker_last_name: data.caretaker_last_name,
            p_caretaker_email: data.caretaker_email,
            p_caretaker_phone: data.caretaker_phone,
            
            // ========== OPTIONAL PARAMETERS (22-31) ==========
            
            // Property basic info optional (22-26)
            p_description: data.description || null,
            p_nearby_school_or_institution: data.nearby_school_or_institution || null,
            p_landmark: data.landmark || null,
            p_contact_phone: data.contact_phone || null,
            p_available_from: data.available_from || new Date().toISOString().split('T')[0],
            
            // Media URLs optional (27-28)
            p_logo_url: data.logo_url || null,
            p_cover_photo_url: data.cover_photo_url || null,
            
            // FAQ and Rules optional (29-30)
            p_faqs: data.faqs && data.faqs.length > 0 ? data.faqs : [],
            p_rules: data.rules && data.rules.length > 0 ? data.rules.map(r => ({ rule_text: r.rule_text })) : [],
            
            // Admin ID optional (31)
            p_created_by_admin_id: null,
        });

        if (error) {
            console.error('RPC Error:', error);
            throw new Error(error.message || 'Failed to create property');
        }

        // Handle the result from the RPC function
        if (result && typeof result === 'object') {
            if (result.success === false) {
                throw new Error(result.error || 'Failed to create property');
            }
            
            return {
                id: result.property_id,
                caretakerEmployeeId: result.caretaker_employee_id,
                unitsCreated: result.units_created,
                caretaker_password: result.caretaker_password,
                message: result.message,
            };
        }

        // Fallback for unexpected response format
        throw new Error('Invalid response from server');
    },

    update: async (id: string, data: Partial<Property>): Promise<void> => {
        const supabase = getSupabaseClient() as any;
        const { error } = await supabase
            .from('properties')
            .update({
                name: data.name,
                location: data.location,
                logo_url: data.logoUrl,
                facilities: data.facilities,
                verification_status: data.verificationStatus,
                latitude: data.latitude,
                longitude: data.longitude,
                gate_latitude: data.gateLatitude,
                gate_longitude: data.gateLongitude,
                school_gate_distance_meters: data.schoolGateDistanceMeters,
                landmark: data.landmark,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) throw error;
    },

    getUnits: async (propertyId?: string): Promise<Unit[]> => {
        const supabase = getSupabaseClient() as any;
        let query = supabase
            .from('units')
            .select('*')
            .order('type', { ascending: true });

        if (propertyId) {
            query = query.eq('property_id', propertyId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(transformUnit);
    },

    getUnit: async (id: string): Promise<Unit> => {
        const supabase = getSupabaseClient() as any;
        const { data, error } = await supabase
            .from('units')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Unit not found');
        return transformUnit(data);
    },

    getByPinCode: async (pinCode: string): Promise<Property> => {
        const supabase = getSupabaseClient() as any;
        
        // Try to find by location share code first
        const { data: shareData, error: shareError } = await supabase
            .from('location_share_codes')
            .select('property_id')
            .eq('code', pinCode.toUpperCase())
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

        if (shareData?.property_id) {
            return PropertyApi.getOne(shareData.property_id);
        }

        // Fallback: search in properties facilities
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
            .filter('facilities->>invitePinCode', 'eq', pinCode.toUpperCase())
            .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Property not found with this PIN code');
        return transformProperty(data);
    },

    consumeRealtimeMapByPin: async (pinCode: string, visitorId: string): Promise<{ remainingUses: number; used: number; maxUses: number }> => {
        const supabase = getSupabaseClient() as any;
        
        // Call the database function to consume map access
        const { data, error } = await supabase.rpc('consume_map_access', {
            p_code: pinCode.toUpperCase(),
            p_visitor_id: visitorId,
        });

        if (error) {
            // Fallback response if RPC not available
            return { remainingUses: 5, used: 0, maxUses: 5 };
        }

        return data || { remainingUses: 0, used: 0, maxUses: 5 };
    },

    updateUnitStatus: async (id: string, status: string, reason: string): Promise<void> => {
        const supabase = getSupabaseClient() as any;
        
        const { error } = await supabase
            .from('units')
            .update({
                status: status,
                availability_status: status === 'VACANT' ? 'AVAILABLE' : 'OCCUPIED',
                last_updated: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) throw error;

        // Log the status change
        await supabase.from('unit_availability_snapshots').insert({
            unit_id: id,
            status: status,
            reason: reason,
        });
    },

    // Get property with vacancy counts - USES public_properties_view for anonymous access
    getPropertiesWithVacancy: async (): Promise<(Property & {
        totalUnits: number;
        vacantUnits: number;
        occupiedUnits: number;
        rentRange: { min: number; max: number };
        overall_rating?: number;
        review_count?: number;
        likes_count?: number;
        tenant_count?: number;
        created_at?: string;
        coverPhotoUrl?: string;
    })[]> => {
        const supabase = getSupabaseClient() as any;

        // Use public_properties_view - it has GRANT SELECT TO anon
        // This allows public listings to work without authentication
        const { data: properties, error: propError } = await supabase
            .from('public_properties_view')
            .select('*')
            .order('property_name', { ascending: true });

        if (propError) {
            console.error('Error fetching properties from view:', propError);
            throw propError;
        }

        // Get property IDs to fetch cover photos in batch
        const propertyIds = (properties || []).map((p: any) => p.property_id);
        
        // Fetch cover photos for all properties in one query
        let coverPhotos: Record<string, string> = {};
        if (propertyIds.length > 0) {
            const { data: photos } = await supabase
                .from('property_photos')
                .select('property_id, storage_bucket, storage_path')
                .eq('photo_type', 'COVER')
                .in('property_id', propertyIds);
            
            // Build cover photo URL map
            const storageBase = process.env.NEXT_PUBLIC_SUPABASE_URL 
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-photos`
                : '';
            
            (photos || []).forEach((photo: any) => {
                if (storageBase) {
                    coverPhotos[photo.property_id] = `${storageBase}/${photo.storage_path}`;
                }
            });
        }

        return (properties || []).map((p: any) => {
            // Priority: new photo system > legacy cover_photo_url > logo_url
            const coverUrl = coverPhotos[p.property_id] || p.cover_photo_url || p.logo_url;
            
            return {
                id: p.property_id,
                name: p.property_name,
                location: p.location,
                propertyType: p.property_type,
                caretakerId: p.caretaker_assigned ? p.caretaker_name : null,
                logoUrl: coverUrl,
                coverPhotoUrl: coverUrl,
                verificationStatus: p.verification_status,
                latitude: p.latitude,
                longitude: p.longitude,
                totalUnits: p.total_rooms,
                vacantUnits: p.vacant_rooms,
                occupiedUnits: p.occupied_rooms,
                rentRange: {
                    min: p.price_min || 0,
                    max: p.price_max || 0,
                },
                overall_rating: p.overall_rating,
                review_count: p.review_count,
                likes_count: p.likes_count,
                created_at: p.created_at,
            };
        });
    },

    // Get distinct locations for filter dropdowns
    getDistinctLocations: async (): Promise<string[]> => {
        const supabase = getSupabaseClient() as any;

        try {
            const { data, error } = await supabase
                .rpc('get_distinct_locations');

            if (error) {
                console.error('Error fetching locations:', error);
                // Fallback to hardcoded values
                return ["Main Gate", "Njokerio", "Milimani", "Town", "Blue Valley"];
            }

            return (data || []).map((item: { location: string }) => item.location);
        } catch (err) {
            console.error('Failed to fetch locations:', err);
            return ["Main Gate", "Njokerio", "Milimani", "Town", "Blue Valley"];
        }
    },

    // Get distinct property types for filter dropdowns
    getDistinctPropertyTypes: async (): Promise<string[]> => {
        const supabase = getSupabaseClient() as any;

        try {
            const { data, error } = await supabase
                .rpc('get_distinct_property_types');

            if (error) {
                console.error('Error fetching property types:', error);
                // Fallback to hardcoded values
                return ["Single Room", "Bedsitter", "One Bedroom", "Two Bedroom", "Apartment"];
            }

            // Format property types for display (convert SINGLE_ROOM to "Single Room")
            return (data || []).map((item: { property_type: string }) => {
                const type = item.property_type;
                return type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
            });
        } catch (err) {
            console.error('Failed to fetch property types:', err);
            return ["Single Room", "Bedsitter", "One Bedroom", "Two Bedroom", "Apartment"];
        }
    },

    // Get distinct unit types (room types) for filter dropdowns
    getDistinctUnitTypes: async (): Promise<string[]> => {
        const supabase = getSupabaseClient() as any;

        try {
            const { data, error } = await supabase
                .rpc('get_distinct_unit_types');

            if (error) {
                console.error('Error fetching unit types:', error);
                // Fallback to hardcoded values
                return ["Single Room", "Bedsitter", "One Bedroom", "Two Bedroom", "Apartment"];
            }

            // Format unit types for display
            return (data || []).map((item: { unit_type: string }) => {
                const type = item.unit_type;
                return type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
            });
        } catch (err) {
            console.error('Failed to fetch unit types:', err);
            return ["Single Room", "Bedsitter", "One Bedroom", "Two Bedroom", "Apartment"];
        }
    },
};
