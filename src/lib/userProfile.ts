import { isSupabaseConfigured, supabase } from "./supabaseClient";
import { logger } from "./logger";

export interface CurrentUserProfile {
  username: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
}

export interface ProfileUsernameUpdateResult {
  username: string | null;
  error: string | null;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,24}$/;

/** Validates a public profile username (matches signup rules). */
export function validateProfileUsername(username: string): string | null {
  const normalized = username.trim();
  if (!normalized) return "Username is required.";
  if (!USERNAME_PATTERN.test(normalized)) {
    return "Username must be 3–24 characters (letters, numbers, underscore).";
  }
  return null;
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
    .select("username, avatar_url, is_admin")
    .eq("id", authUserId.trim())
    .single();

  if (error) {
    logger.warn("[profiles] profile fetch failed:", error.message);
    return null;
  }

  const row = data as {
    username: string | null;
    avatar_url?: string | null;
    is_admin?: boolean | null;
  } | null;
  const username = typeof row?.username === "string" ? row.username.trim() : "";
  const avatarUrl = typeof row?.avatar_url === "string" ? row.avatar_url.trim() : "";

  return {
    username: username || null,
    avatarUrl: avatarUrl || null,
    isAdmin: row?.is_admin === true,
  };
}

/** Load the public `profiles.username` for the authenticated user. */
export async function fetchProfileUsername(authUserId: string): Promise<string | null> {
  const profile = await fetchCurrentUserProfile(authUserId);
  return profile?.username ?? null;
}

/** Update the authenticated user's `profiles.username`. */
export async function updateProfileUsername(
  authUserId: string,
  username: string,
): Promise<ProfileUsernameUpdateResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { username: null, error: "Profile updates require Supabase." };
  }

  const trimmedUserId = authUserId.trim();
  if (!trimmedUserId) {
    return { username: null, error: "Sign in to update your username." };
  }

  const normalized = username.trim();
  const validationError = validateProfileUsername(normalized);
  if (validationError) {
    return { username: null, error: validationError };
  }

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      return { username: null, error: sessionError.message };
    }
    if (!sessionData.session) {
      return { username: null, error: "Please sign in again to update your username." };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ username: normalized } as never)
      .eq("id", trimmedUserId);

    if (error) {
      if (error.code === "23505") {
        return { username: null, error: "That username is already taken." };
      }
      return { username: null, error: error.message || "Could not update username." };
    }

    return { username: normalized, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update username.";
    return { username: null, error: message };
  }
}
