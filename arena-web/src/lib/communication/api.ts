import { getSupabaseClient } from '@/lib/supabase/client';

export type CommunicationAudience = 'ALL' | 'EMPLOYEES' | 'TENANTS';

export interface CommunicationMessageItem {
  message_id: string;
  direction: 'INBOX' | 'SENT';
  message_type: 'DIRECT' | 'BROADCAST';
  title: string;
  body: string;
  body_preview: string;
  sender_user_id: string;
  sender_name: string;
  sender_role: string;
  audience: string;
  created_at: string;
  read_at: string | null;
  related_property_id: string | null;
}

export interface CommunicationNotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

function getClient() {
  return getSupabaseClient() as ReturnType<typeof getSupabaseClient> & {
    rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
}

export async function createAdminBroadcast(
  audience: CommunicationAudience,
  title: string,
  body: string
): Promise<{ success: boolean; messageId?: string; recipientCount?: number; error?: string }> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('create_admin_broadcast', {
    p_audience: audience,
    p_title: title,
    p_body: body,
  });
  if (error) return { success: false, error: error.message };
  const row = data as { success?: boolean; message_id?: string; recipient_count?: number };
  return {
    success: Boolean(row?.success),
    messageId: row?.message_id,
    recipientCount: row?.recipient_count,
  };
}

export async function createCaretakerBroadcast(
  title: string,
  body: string
): Promise<{ success: boolean; messageId?: string; recipientCount?: number; error?: string }> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('create_caretaker_broadcast', {
    p_title: title,
    p_body: body,
  });
  if (error) return { success: false, error: error.message };
  const row = data as { success?: boolean; message_id?: string; recipient_count?: number };
  return {
    success: Boolean(row?.success),
    messageId: row?.message_id,
    recipientCount: row?.recipient_count,
  };
}

export async function createDirectMessage(
  recipientUserId: string,
  title: string,
  body: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('create_direct_message', {
    p_recipient_user_id: recipientUserId,
    p_title: title,
    p_body: body,
  });
  if (error) return { success: false, error: error.message };
  const row = data as { success?: boolean; message_id?: string };
  return { success: Boolean(row?.success), messageId: row?.message_id };
}

export async function markCommunicationRead(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('mark_communication_read', {
    p_message_id: messageId,
  });
  if (error) return { success: false, error: error.message };
  return { success: Boolean((data as { success?: boolean })?.success) };
}

export async function getMyMessages(): Promise<CommunicationMessageItem[]> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('get_my_messages');
  if (error) {
    console.error('get_my_messages:', error.message);
    return [];
  }
  const payload = data as { messages?: CommunicationMessageItem[] };
  return Array.isArray(payload?.messages) ? payload.messages : [];
}

export async function getMyNotificationsRpc(): Promise<CommunicationNotificationItem[]> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('get_my_notifications');
  if (error) {
    console.error('get_my_notifications:', error.message);
    return [];
  }
  const payload = data as { notifications?: CommunicationNotificationItem[] };
  return Array.isArray(payload?.notifications) ? payload.notifications : [];
}

export async function getAdminBroadcastStats(messageId: string) {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('get_admin_broadcast_stats', {
    p_message_id: messageId,
  });
  if (error) return { success: false as const, error: error.message };
  return { success: true as const, stats: data as Record<string, unknown> };
}

export async function getCaretakerBroadcastStats(messageId: string) {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('get_caretaker_broadcast_stats', {
    p_message_id: messageId,
  });
  if (error) return { success: false as const, error: error.message };
  return { success: true as const, stats: data as Record<string, unknown> };
}

export async function getUnreadCommunicationCount(): Promise<number> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('get_unread_communication_count');
  if (error) return 0;
  const row = data as { total_unread?: number };
  return row?.total_unread ?? 0;
}
