import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { signInWithApple as runAppleSignIn } from "../lib/appleAuth";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import {
  clearPendingReferralCode,
  readPendingReferralCode,
} from "../constants/pendingReferral";
import { normalizeReferralCodeInput } from "../utils/referralCode";

export interface AuthActionResult {
  error: string | null;
}

export interface SignUpResult extends AuthActionResult {
  needsEmailConfirmation: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  authLoading: boolean;
  isAuthenticated: boolean;
  signInWithEmail: (email: string, password: string) => Promise<AuthActionResult>;
  signUpWithEmail: (
    email: string,
    password: string,
    username: string,
    dateOfBirth?: string,
  ) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  signInWithApple: () => Promise<AuthActionResult>;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,24}$/;

function normalizeUsername(value: string): string {
  return value.trim();
}

function validateUsername(username: string): string | null {
  if (!username) return "Username is required.";
  if (!USERNAME_PATTERN.test(username)) {
    return "Username must be 3–24 characters (letters, numbers, underscore).";
  }
  return null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured());

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      if (!supabase) {
        return { error: "Authentication is not configured." };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      return { error: error?.message ?? null };
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      username: string,
      dateOfBirth?: string,
    ): Promise<SignUpResult> => {
      if (!supabase) {
        return { error: "Authentication is not configured.", needsEmailConfirmation: false };
      }

      const normalizedUsername = normalizeUsername(username);
      const usernameError = validateUsername(normalizedUsername);
      if (usernameError) {
        return { error: usernameError, needsEmailConfirmation: false };
      }

      const metadata: Record<string, string> = { username: normalizedUsername };
      if (dateOfBirth?.trim()) {
        metadata.pending_date_of_birth = dateOfBirth.trim();
      }

      const pendingReferral = normalizeReferralCodeInput(readPendingReferralCode());
      if (pendingReferral) {
        metadata.referral_code = pendingReferral;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        return { error: error.message, needsEmailConfirmation: false };
      }

      if (pendingReferral) {
        clearPendingReferralCode();
      }

      return {
        error: null,
        needsEmailConfirmation: !data.session,
      };
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setAuthLoading(false);
  }, []);

  const signInWithApple = useCallback(async (): Promise<AuthActionResult> => {
    const { error } = await runAppleSignIn();
    return { error };
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      authLoading,
      isAuthenticated: Boolean(user),
      signInWithEmail,
      signUpWithEmail,
      signOut,
      signInWithApple,
    }),
    [user, session, authLoading, signInWithEmail, signUpWithEmail, signOut, signInWithApple],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
