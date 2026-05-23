import { isSupabaseConfigured, supabase } from "./supabaseClient";

/** Load the public `profiles.username` for the authenticated user. */
export async function fetchProfileUsername(authUserId: string): Promise<string | null> {
  if (!isSupabaseConfigured() || !supabase || !authUserId.trim()) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", authUserId.trim())
    .single();

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[profiles] username fetch failed:", error.message);
    }
    return null;
  }

  const row = data as { username: string | null } | null;
  const username = typeof row?.username === "string" ? row.username.trim() : "";
  return username || null;
}
