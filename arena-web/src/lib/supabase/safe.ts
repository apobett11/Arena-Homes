import { getSupabaseClient } from "@/lib/supabase/client";

export async function safeSelect<T>(
  table: string,
  query: (builder: any) => Promise<{ data: T[] | null; error: any }>
): Promise<T[]> {
  try {
    const supabase = getSupabaseClient() as any;
    const { data, error } = await query(supabase.from(table));
    if (error) {
      console.warn(`[safeSelect] ${table}:`, error.message);
      return [];
    }
    return data ?? [];
  } catch (error) {
    console.warn(`[safeSelect] ${table} failed`, error);
    return [];
  }
}

export async function safeMaybeSingle<T>(
  table: string,
  query: (builder: any) => Promise<{ data: T | null; error: any }>
): Promise<T | null> {
  try {
    const supabase = getSupabaseClient() as any;
    const { data, error } = await query(supabase.from(table));
    if (error) {
      console.warn(`[safeMaybeSingle] ${table}:`, error.message);
      return null;
    }
    return data;
  } catch (error) {
    console.warn(`[safeMaybeSingle] ${table} failed`, error);
    return null;
  }
}
