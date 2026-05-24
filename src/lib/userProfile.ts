import { isSupabaseConfigured, supabase } from "./supabaseClient";

export interface CurrentUserProfile {
  username: string | null;
  isAdmin: boolean;
}

/** Load the authenticated user's public profile flags. */
export async function fetchCurrentUserProfile(
  authUserId: string,
): Promise<CurrentUserProfile | null> {
  if (!isSupabaseConfigured() || !supabase || !authUserId.trim()) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("username, is_admin")
    .eq("id", authUserId.trim())
    .single();

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[profiles] profile fetch failed:", error.message);
    }
    return null;
  }

  const row = data as { username: string | null; is_admin?: boolean | null } | null;
  const username = typeof row?.username === "string" ? row.username.trim() : "";

  return {
    username: username || null,
    isAdmin: row?.is_admin === true,
  };
}

/** Load the public `profiles.username` for the authenticated user. */
export async function fetchProfileUsername(authUserId: string): Promise<string | null> {
  const profile = await fetchCurrentUserProfile(authUserId);
  return profile?.username ?? null;
}
