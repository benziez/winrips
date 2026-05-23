import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabase =
  url && anonKey
    ? createClient<Database>(url, anonKey, { auth: { persistSession: true } })
    : null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabase);
}
