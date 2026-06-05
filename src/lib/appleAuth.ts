import { Capacitor, registerPlugin } from "@capacitor/core";
import { isNativeCapacitorApp } from "../utils/platform";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export const APPLE_SIGN_IN_CANCELLED = "cancelled";

export interface AppleSignInResult {
  error: string | null;
  cancelled?: boolean;
}

interface AppleSignInPlugin {
  signIn(): Promise<{
    identityToken?: string;
    user?: string;
    email?: string;
    givenName?: string;
    familyName?: string;
    authorizationCode?: string;
    cancelled?: boolean;
  }>;
}

const AppleSignInNative = registerPlugin<AppleSignInPlugin>("AppleSignInPlugin");

function isAppleSignInCancelled(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("cancel") ||
    normalized.includes("1000") ||
    normalized.includes("authorizationerror")
  );
}

export async function signInWithApple(): Promise<AppleSignInResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { error: "Authentication is not configured." };
  }

  if (Capacitor.getPlatform() === "ios" && isNativeCapacitorApp()) {
    try {
      const result = await AppleSignInNative.signIn();

      if (result.cancelled) {
        return { error: APPLE_SIGN_IN_CANCELLED, cancelled: true };
      }

      if (!result.identityToken) {
        return { error: "Apple Sign In did not return a valid token." };
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: result.identityToken,
      });

      return { error: error?.message ?? null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Apple Sign In failed.";
      if (isAppleSignInCancelled(message)) {
        return { error: APPLE_SIGN_IN_CANCELLED, cancelled: true };
      }
      return { error: message };
    }
  }

  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo,
      skipBrowserRedirect: isNativeCapacitorApp(),
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url && isNativeCapacitorApp()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: data.url });
  }

  return { error: null };
}
