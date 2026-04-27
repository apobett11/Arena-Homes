// Tenant Dashboard Types - Universal Database Contract
// These types align with the public.tenant_dashboard_view and related tables

export interface TenantDashboardData {
  // Tenant info
  tenantId: string;
  tenantUserId: string;
  tenantFullName: string;
  tenantPhoneNumber: string | null;
  tenantWhatsappNumber: string | null;
  tenantRegistrationNumber: string | null;
  tenantEmail: string | null;
  tenantLogoUrl: string | null;
  
  // Property info
  propertyId: string | null;
  propertyName: string | null;
  propertyLocation: string | null;
  propertyType: string | null;
  propertyLatitude: number | null;
  propertyLongitude: number | null;
  
  // Unit/Room info
  unitId: string | null;
  roomNumber: string | null;
  roomType: string | null;
  roomPrice: number | null;
  
  // Caretaker info
  caretakerEmployeeId: string | null;
  caretakerUserId: string | null;
  caretakerFullName: string | null;
  caretakerPhoneNumber: string | null;
  caretakerWhatsappNumber: string | null;
  caretakerEmail: string | null;
  
  // Lease info
  leaseId: string | null;
  leaseNumber: string | null;
  leaseStartDate: string | null;
  leaseEndDate: string | null;
  leaseStatus: string | null;
  leasePdfUrl: string | null;
  
  // Payment/Financial
  paidMonths: number;
  moveInDate: string | null;
  moveOutDate: string | null;
  
  // Activity counts
  pendingIssuesCount: number;
  resolvedIssuesCount: number;
  pendingRepairsCount: number;
  solvedRepairsCount: number;
  notificationsCount: number;
  announcementsCount: number;
  
  // Property stats
  averagePropertyRating: number | null;
}

export interface TenantNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface TenantAnnouncement {
  id: string;
  title: string;
  body: string | null;
  targetRole: string | null;
  propertyId: string | null;
  isGlobal: boolean;
  senderUserId: string | null;
  senderEmployeeId: string | null;
  createdAt: string;
}

export interface TenantPropertyRule {
  id: string;
  propertyId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface TenantPropertyFaq {
  id: string;
  propertyId: string;
  question: string;
  answer: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface TenantPropertyReview {
  id: string;
  tenantId: string;
  propertyId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface TenantIssuePayload {
  tenantId: string;
  tenantUserId: string;
  propertyId: string | null;
  unitId: string | null;
  caretakerEmployeeId: string | null;
  targetRole: 'CARETAKER' | 'ADMIN';
  title: string;
  description: string;
  status: 'PENDING';
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface TenantReviewPayload {
  tenantId: string;
  propertyId: string;
  rating: number;
  comment: string | null;
}

export interface TenantActivityItem {
  id: string;
  type: 'payment' | 'maintenance' | 'feedback' | 'announcement' | 'lease' | 'notification' | 'info';
  title: string;
  desc?: string;
  amount?: string;
  date: string;
}

export interface DashboardError {
  code: 'NO_TENANT_ASSIGNMENT' | 'SUPABASE_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  details?: string;
}
