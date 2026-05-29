import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { AppleSignInButton } from "./AppleSignInButton";
import { Capacitor } from "@capacitor/core";
import { isNativeCapacitorApp } from "../../utils/platform";
import { validateDateOfBirthInput, parseDateOfBirthInput } from "../../utils/ageVerification";
import { setAgeVerification } from "../../lib/complianceProfile";

const MODAL_PANEL =
  "relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0c10] p-6 sm:p-8";
const INPUT_LABEL =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]";
const INPUT_FIELD =
  "w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[#FF007F]/50 focus:outline-none focus:ring-1 focus:ring-[#FF007F]/30";
const SSO_BUTTON =
  "flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/40 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-black/55";

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

      const dobIso = parseDateOfBirthInput(dateOfBirth);
      if (!dobIso) {
        setFormError("Enter a valid date of birth (MM/DD/YYYY).");
        return;
      }

      const dobError = validateDateOfBirthInput(dobIso);
      if (dobError) {
        setFormError(dobError);
        return;
      }

      const { error, needsEmailConfirmation } = await signUpWithEmail(
        email,
        password,
        username,
        dobIso,
      );
      if (error) {
        setFormError(error);
        return;
      }

      if (!needsEmailConfirmation) {
        const { error: ageError } = await setAgeVerification(dobIso);
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
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <div className={MODAL_PANEL}>
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-lg text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white/80"
          aria-label="Close"
        >
          ×
        </button>

        <h2 id="auth-title" className="pr-8 text-2xl font-bold text-white">
          {title}
        </h2>
        <p className="mt-1.5 mb-6 text-sm text-[#A1A1AA]">{subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin ? (
            <div>
              <label htmlFor="auth-username" className={INPUT_LABEL}>
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
                className={INPUT_FIELD}
              />
            </div>
          ) : null}

          {!isLogin ? (
            <div>
              <label htmlFor="auth-dob" className={INPUT_LABEL}>
                Date of birth
              </label>
              <input
                id="auth-dob"
                type="text"
                inputMode="numeric"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder="MM/DD/YYYY"
                required
                autoComplete="bday"
                className={INPUT_FIELD}
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="auth-email" className={INPUT_LABEL}>
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
              className={INPUT_FIELD}
            />
          </div>
          <div>
            <label htmlFor="auth-password" className={INPUT_LABEL}>
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
              className={INPUT_FIELD}
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
            className="w-full rounded-xl bg-[#FF007F] py-3 text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_24px_rgba(255,0,127,0.2)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Please wait…" : isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/[0.08]" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
            or
          </span>
          <span className="h-px flex-1 bg-white/[0.08]" />
        </div>

        <div className="space-y-2.5">
          {isNativeCapacitorApp() && Capacitor.getPlatform() === "ios" ? (
            <AppleSignInButton
              className="!rounded-lg !border !border-white/10 !bg-black/40 !py-2.5 !text-sm !font-semibold !text-white hover:!bg-black/55"
              onError={(message) => setFormError(message)}
              onSuccess={() => {
                showCashoutToast("Welcome to WinRips!");
                handleClose();
              }}
            />
          ) : (
            <>
              <button type="button" onClick={() => handleSso("Google")} className={SSO_BUTTON}>
                <span className="text-base">G</span>
                Continue with Google
              </button>
              <button type="button" onClick={() => handleSso("Discord")} className={SSO_BUTTON}>
                <span className="text-base">◎</span>
                Continue with Discord
              </button>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-[#A1A1AA]">
          {isLogin ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              openAuthModal(isLogin ? "signup" : "login");
            }}
            className="font-semibold text-[#FF007F] hover:underline"
          >
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </p>
      </div>
    </div>
  );
}
