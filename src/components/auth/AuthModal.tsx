import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { AppleSignInButton } from "./AppleSignInButton";
import { Capacitor } from "@capacitor/core";
import { isNativeCapacitorApp } from "../../utils/platform";
import { validateDateOfBirthInput } from "../../utils/ageVerification";
import { setAgeVerification } from "../../lib/complianceProfile";

export function AuthModal() {
  const {
    authModalOpen,
    authModalMode,
    setAuthModalOpen,
    openAuthModal,
    completeLogin,
    showCashoutToast,
  } = useApp();
  const { signInWithEmail, signUpWithEmail } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isLogin = authModalMode === "login";
  const title = isLogin ? "Welcome Back" : "Create Account";
  const subtitle = isLogin
    ? "Sign in to sync your vault and collection."
    : "Join WinRips — pick a username and start ripping.";

  useEffect(() => {
    if (!authModalOpen) {
      setUsername("");
      setEmail("");
      setPassword("");
      setDateOfBirth("");
      setFormError(null);
      setSubmitting(false);
    }
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  function handleClose() {
    setAuthModalOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setFormError(null);
    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setFormError(error);
          return;
        }
        showCashoutToast("Welcome back!");
        handleClose();
        return;
      }

      const dobError = validateDateOfBirthInput(dateOfBirth);
      if (dobError) {
        setFormError(dobError);
        return;
      }

      const { error, needsEmailConfirmation } = await signUpWithEmail(
        email,
        password,
        username,
        dateOfBirth,
      );
      if (error) {
        setFormError(error);
        return;
      }

      if (!needsEmailConfirmation) {
        const { error: ageError } = await setAgeVerification(dateOfBirth);
        if (ageError) {
          setFormError(ageError);
          return;
        }
      }

      if (needsEmailConfirmation) {
        showCashoutToast("Account created — check your email to confirm before signing in.");
      } else {
        showCashoutToast("Account created — you're in.");
      }
      handleClose();
    } finally {
      setSubmitting(false);
    }
  }

  function handleSso(provider: string) {
    completeLogin();
    showCashoutToast(`Signed in with ${provider}.`);
    handleClose();
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-slate p-6 sm:p-8">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-xl text-muted hover:text-white"
          aria-label="Close"
        >
          ×
        </button>

        <h2 id="auth-title" className="text-xl font-bold text-white">
          {title}
        </h2>
        <p className="mt-1 mb-6 text-sm text-muted">{subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin ? (
            <div>
              <label
                htmlFor="auth-username"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted"
              >
                Username
              </label>
              <input
                id="auth-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_handle"
                required
                minLength={3}
                maxLength={24}
                autoComplete="username"
                pattern="[a-zA-Z0-9_]{3,24}"
                className="w-full rounded-lg border border-border bg-obsidian px-4 py-2.5 text-sm text-white placeholder:text-muted/50 focus:border-fuchsia/50 focus:outline-none focus:ring-1 focus:ring-fuchsia/30"
              />
            </div>
          ) : null}

          {!isLogin ? (
            <div>
              <label
                htmlFor="auth-dob"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted"
              >
                Date of birth
              </label>
              <input
                id="auth-dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                max={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-border bg-obsidian px-4 py-2.5 text-sm text-white focus:border-fuchsia/50 focus:outline-none focus:ring-1 focus:ring-fuchsia/30"
              />
            </div>
          ) : null}

          <div>
            <label
              htmlFor="auth-email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted"
            >
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-border bg-obsidian px-4 py-2.5 text-sm text-white placeholder:text-muted/50 focus:border-fuchsia/50 focus:outline-none focus:ring-1 focus:ring-fuchsia/30"
            />
          </div>
          <div>
            <label
              htmlFor="auth-password"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted"
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="w-full rounded-lg border border-border bg-obsidian px-4 py-2.5 text-sm text-white placeholder:text-muted/50 focus:border-fuchsia/50 focus:outline-none focus:ring-1 focus:ring-fuchsia/30"
            />
          </div>

          {formError ? (
            <p className="text-sm text-red-400/90" role="alert">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#FF007F] py-3 text-sm font-bold uppercase tracking-wide text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Please wait…" : isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2.5">
          {isNativeCapacitorApp() && Capacitor.getPlatform() === "ios" ? (
            <AppleSignInButton
              className="rounded-lg py-2.5"
              onError={(message) => setFormError(message)}
              onSuccess={() => {
                showCashoutToast("Welcome to WinRips!");
                handleClose();
              }}
            />
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSso("Google")}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-metallic py-2.5 text-sm font-semibold text-white transition-colors hover:border-fuchsia/40 hover:bg-metallic-hover"
              >
                <span className="text-base">G</span>
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => handleSso("Discord")}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-metallic py-2.5 text-sm font-semibold text-white transition-colors hover:border-fuchsia/40 hover:bg-metallic-hover"
              >
                <span className="text-base">◎</span>
                Continue with Discord
              </button>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-muted">
          {isLogin ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              openAuthModal(isLogin ? "signup" : "login");
            }}
            className="font-semibold text-fuchsia hover:underline"
          >
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </p>
      </div>
    </div>
  );
}
