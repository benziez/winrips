import { Capacitor } from "@capacitor/core";
import { isNativeCapacitorApp } from "../utils/platform";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export async function signInWithApple(): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { error: "Authentication is not configured." };
  }

  if (Capacitor.getPlatform() === "ios" && isNativeCapacitorApp()) {
    try {
      const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
      const result = await SignInWithApple.authorize({
        clientId: "com.winrips.app",
        redirectURI: "https://winrips.app/auth/apple",
        scopes: "email name",
      });

      const identityToken = result.response?.identityToken;
      if (!identityToken) {
        return { error: "Apple Sign In did not return a valid token." };
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: identityToken,
      });

      return { error: error?.message ?? null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Apple Sign In failed.";
      if (message.toLowerCase().includes("cancel")) {
        return { error: null };
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
