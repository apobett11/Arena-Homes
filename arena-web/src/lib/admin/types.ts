// Admin Dashboard Types - Universal Database Contract

export type EmployeeStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
export type TenantStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'MOVED_OUT';
export type IssueStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
export type IssuePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type AnnouncementTargetRole = 'TENANT' | 'CARETAKER' | 'EMPLOYEE' | 'ALL' | 'PUBLIC';
export type MessageType = 'PRIVATE' | 'BROADCAST' | 'SYSTEM' | 'WARNING';
export type BroadcastTargetRole = 'TENANT' | 'EMPLOYEE' | 'ALL';

export interface AdminEmployee {
  id: string;
  user_id: string;
  role_id: string;
  status: EmployeeStatus;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  assigned_property_id: string | null;
  assigned_property_name: string | null;
  created_at: string;
  last_online: string | null;
  complaints_count: number;
  completion_percent: number | null;
}

export interface AdminProperty {
  id: string;
  name: string;
  location: string;
  logo_url: string | null;
  property_type: string | null;
  verification_status: string | null;
  caretaker_employee_id: string | null;
  caretaker_user_id: string | null;
  caretaker_name: string | null;
  caretaker_email: string | null;
  caretaker_phone: string | null;
  caretaker_status: EmployeeStatus | null;
  caretaker_password?: string | null;
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  tenant_count: number;
  issues_count: number;
  created_at: string;
}

export interface AdminIssue {
  id: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  property_id: string | null;
  property_name: string | null;
  unit_id: string | null;
  room_number: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
  tenant_user_id: string | null;
  caretaker_employee_id: string | null;
  caretaker_name: string | null;
  source: 'TENANT' | 'CARETAKER' | 'ADMIN' | 'SYSTEM';
  target_role: 'CARETAKER' | 'ADMIN' | null;
  created_at: string;
  resolved_at: string | null;
  time_pending_ms: number;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  body: string;
  target_role: AnnouncementTargetRole | null;
  property_id: string | null;
  is_global: boolean;
  is_published: boolean;
  sender_user_id: string | null;
  sender_employee_id: string | null;
  created_at: string;
}

export interface AdminDashboardStats {
  totalProperties: number;
  totalUnits: number;
  totalTenants: number;
  activeTenants: number;
  pendingTenants: number;
  inactiveTenants: number;
  occupancyRate: number;
  totalStaff: number;
  activeEmployees: number;
  suspendedEmployees: number;
  escalatedComplaints: number;
  unresolvedComplaints: number;
  resolvedComplaints: number;
  pendingApprovals: number;
  vacantUnits: number;
  occupiedUnits: number;
}

export interface AdminWarningPayload {
  employee_id: string;
  user_id: string;
  title: string;
  message: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CreateUnitPayload {
  property_id: string;
  room_number: string;
  room_type: string;
  base_price: number;
  description?: string;
  amenities?: {
    water?: boolean;
    electricity?: boolean;
    security?: boolean;
    internet?: boolean;
  };
}

export interface PropertyStats {
  property_id: string;
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  reserved_units: number;
  maintenance_units: number;
  tenant_count: number;
  issues_count: number;
  pending_issues: number;
  resolved_issues: number;
  leases_count: number;
  average_rating: number | null;
  review_count: number;
}

// Message Types
export interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string | null;
  message_type: MessageType;
  message_head: Record<string, any>;
  message_body: Record<string, any>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRecipient {
  id: string;
  message_id: string;
  user_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Suspension {
  id: string;
  user_id: string;
  suspended_by: string;
  suspension_reason: string;
  suspension_duration_days: number | null;
  suspended_at: string;
  ends_at: string | null;
  is_active: boolean;
  ended_at: string | null;
  ended_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Message Payloads
export interface SendMessagePayload {
  to_user_id: string;
  message_head: Record<string, any>;
  message_body: Record<string, any>;
}

export interface SendBroadcastPayload {
  target_role: BroadcastTargetRole;
  message_head: Record<string, any>;
  message_body: Record<string, any>;
}

export interface SuspendUserPayload {
  user_id: string;
  reason: string;
  duration_days?: number | null;
  notes?: string | null;
}
