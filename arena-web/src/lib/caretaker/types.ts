// ============================================================================
// CARETAKER DASHBOARD TYPES - Universal Database Contract
// ============================================================================

// Core Dashboard Data from caretaker_dashboard_view
export interface CaretakerDashboardData {
  caretaker_employee_id: string;
  caretaker_user_id: string;
  caretaker_full_name: string;
  caretaker_phone_number: string | null;
  caretaker_email: string | null;
  assigned_property_id: string | null;
  property_name: string | null;
  property_location: string | null;
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

// Property Management
export interface CaretakerProperty {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  property_type: string | null;
  latitude: number | null;
  longitude: number | null;
  gate_latitude: number | null;
  gate_longitude: number | null;
  verification_status: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
  listing_status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED';
  assigned_unit_id?: string;
  price_min: number | null;
  price_max: number | null;
  gate_open_time: string | null;
  gate_close_time: string | null;
  water_source: string | null;
  security_description: string | null;
  parking_available: boolean;
  wifi_available: boolean;
  trash_collection: string | null;
  rules_summary: string | null;
  caretaker_employee_id: string | null;
  caretaker_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdatePropertyPayload {
  description?: string;
  gate_open_time?: string;
  gate_close_time?: string;
  water_source?: string;
  security_description?: string;
  parking_available?: boolean;
  wifi_available?: boolean;
  trash_collection?: string;
  rules_summary?: string;
}

// Units/Rooms Management
export type UnitStatus = 'VACANT' | 'TAKEN';
export type UnitAvailabilityStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'UNDER_MAINTENANCE' | 'UNAVAILABLE';

export interface CaretakerUnit {
  id: string;
  property_id: string;
  room_number: string | null;
  room_type: string;
  base_price: number;
  status: UnitStatus;
  availability_status: UnitAvailabilityStatus;
  bedrooms: number | null;
  bathrooms: number | null;
  capacity: number;
  deposit_amount: number | null;
  is_public: boolean;
  photos: string[];
  amenities: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UpdateUnitPayload {
  availability_status?: UnitAvailabilityStatus;
  status?: UnitStatus;
  amenities?: Record<string, any>;
}

// Tenants
export interface CaretakerTenant {
  id: string;
  user_id: string | null;
  full_name: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  registration_number: string | null;
  email: string | null;
  property_id: string | null;
  unit_id: string | null;
  room_number: string | null;
  move_in_date: string | null;
  move_out_date: string | null;
  status: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
  // Join fields
  unit?: {
    room_number: string | null;
    room_type: string;
  };
  lease?: {
    id: string;
    lease_number: string | null;
    start_date: string;
    end_date: string;
    status: string;
  } | null;
}

// Leases (Read-only for caretakers)
export type LeaseStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED';

export interface CaretakerLease {
  id: string;
  tenant_id: string;
  unit_id: string;
  property_id: string | null;
  lease_number: string | null;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number | null;
  pdf_url: string | null;
  auto_renew: boolean;
  status: LeaseStatus;
  created_at: string;
  updated_at: string;
  // Join fields
  tenant?: {
    full_name: string | null;
    room_number: string | null;
  };
  unit?: {
    room_number: string | null;
    room_type: string;
  };
}

// Issues
export type IssueStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED' | 'CLOSED';
export type IssuePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface CaretakerIssue {
  id: string;
  tenant_id: string | null;
  tenant_user_id: string | null;
  property_id: string | null;
  unit_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  priority: IssuePriority;
  status: IssueStatus;
  caretaker_employee_id: string | null;
  target_role: string | null;
  sent_to: string | null;
  reporter_id: string | null;
  created_at: string;
  updated_at: string;
  // Join fields
  tenant?: {
    full_name: string | null;
    room_number: string | null;
  };
  unit?: {
    room_number: string | null;
  };
}

export interface UpdateIssuePayload {
  status?: IssueStatus;
  priority?: IssuePriority;
  caretaker_employee_id?: string;
}

// Repairs
export type RepairStatus = 'PENDING' | 'IN_PROGRESS' | 'SOLVED' | 'CANCELLED';

export interface CaretakerRepair {
  id: string;
  issue_id: string | null;
  property_id: string | null;
  unit_id: string | null;
  tenant_id: string | null;
  caretaker_employee_id: string | null;
  title: string;
  description: string | null;
  status: RepairStatus;
  before_photo_url: string | null;
  after_photo_url: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  // Join fields
  issue?: {
    title: string;
    description: string | null;
  };
  tenant?: {
    full_name: string | null;
    room_number: string | null;
  };
  unit?: {
    room_number: string | null;
  };
}

export interface CreateRepairPayload {
  issue_id?: string;
  property_id: string;
  unit_id?: string;
  tenant_id?: string;
  title: string;
  description?: string;
  before_photo_url?: string;
}

export interface UpdateRepairPayload {
  status?: RepairStatus;
  after_photo_url?: string;
  resolution_notes?: string;
}

// Property Rules
export interface CaretakerRule {
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRulePayload {
  property_id: string;
  title: string;
  description?: string;
}

export interface UpdateRulePayload {
  title?: string;
  description?: string;
  is_active?: boolean;
}

// Property FAQs
export interface CaretakerFaq {
  id: string;
  property_id: string;
  question: string;
  answer: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFaqPayload {
  property_id: string;
  question: string;
  answer: string;
}

export interface UpdateFaqPayload {
  question?: string;
  answer?: string;
  is_active?: boolean;
}

// Property Facilities
export interface CaretakerFacilities {
  id: string;
  property_id: string;
  water_source: string | null;
  water_availability_days: string | null;
  security: string | null;
  parking: boolean;
  wifi: boolean;
  trash_collection: string | null;
  notes: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertFacilitiesPayload {
  property_id: string;
  water_source?: string;
  water_availability_days?: string;
  security?: string;
  parking?: boolean;
  wifi?: boolean;
  trash_collection?: string;
  notes?: string;
}

// Property Inventory
export interface CaretakerInventoryItem {
  id: string;
  property_id: string;
  name: string;
  quantity: number;
  condition: string | null;
  notes: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInventoryPayload {
  property_id: string;
  name: string;
  quantity?: number;
  condition?: string;
  notes?: string;
}

export interface UpdateInventoryPayload {
  name?: string;
  quantity?: number;
  condition?: string;
  notes?: string;
}

// Tenant Applications
// Simplified application flow: WAITING → ACCEPTED/REJECTED
export type ApplicationStatus = 'WAITING' | 'ACCEPTED' | 'REJECTED';

export interface CaretakerApplication {
  id: string;
  applicant_user_id: string | null;
  full_name: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  registration_number: string | null;
  email: string | null;
  property_id: string | null;
  unit_id: string | null;
  status: ApplicationStatus;
  caretaker_employee_id: string | null;
  notes: string | null;
  rejection_reason?: string;
  assigned_unit_id?: string;
  preferred_move_in_date?: string | null;
  created_at: string;
  updated_at: string;
  // Join fields
  unit?: {
    room_number: string | null;
    room_type: string;
  };
}

export interface UpdateApplicationPayload {
  status?: ApplicationStatus;
  notes?: string;
  rejection_reason?: string;
}

// Announcements
export interface CaretakerAnnouncement {
  id: string;
  title: string;
  body: string;
  property_id: string | null;
  sender_user_id: string | null;
  sender_employee_id: string | null;
  target_role: string | null;
  is_global: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnouncementPayload {
  title: string;
  body: string;
  property_id: string;
  target_role?: string;
  is_global?: boolean;
}

// Messages
export interface CaretakerMessage {
  id: string;
  sender_user_id: string;
  receiver_user_id: string;
  property_id: string | null;
  tenant_id: string | null;
  subject: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
  // Join fields
  sender?: {
    full_name: string | null;
    email: string | null;
  };
  receiver?: {
    full_name: string | null;
    email: string | null;
  };
  tenant?: {
    full_name: string | null;
    room_number: string | null;
  };
}

export interface SendMessagePayload {
  receiver_user_id: string;
  property_id?: string;
  tenant_id?: string;
  subject?: string;
  body: string;
}

// Dashboard Loading States
export interface DashboardState {
  data: CaretakerDashboardData | null;
  property: CaretakerProperty | null;
  units: CaretakerUnit[];
  tenants: CaretakerTenant[];
  leases: CaretakerLease[];
  issues: CaretakerIssue[];
  repairs: CaretakerRepair[];
  rules: CaretakerRule[];
  faqs: CaretakerFaq[];
  facilities: CaretakerFacilities | null;
  inventory: CaretakerInventoryItem[];
  applications: CaretakerApplication[];
  announcements: CaretakerAnnouncement[];
  messages: CaretakerMessage[];
  loading: boolean;
  error: string | null;
}
