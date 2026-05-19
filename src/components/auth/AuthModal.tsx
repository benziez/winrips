import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";

export function AuthModal() {
  const {
    authModalOpen,
    authModalMode,
    setAuthModalOpen,
    openAuthModal,
    showCashoutToast,
  } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isLogin = authModalMode === "login";
  const title = isLogin ? "Welcome Back" : "Create Account";
  const subtitle = isLogin
    ? "Sign in to sync your vault and sweeps balance."
    : "Join WinRips — sweepstakes pack ripping awaits.";

  useEffect(() => {
    if (!authModalOpen) {
      setEmail("");
      setPassword("");
    }
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  function handleClose() {
    setAuthModalOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    showCashoutToast(isLogin ? "Logged in (demo)" : "Account created (demo)");
    handleClose();
  }

  function handleSso(provider: string) {
    showCashoutToast(`Continuing with ${provider} (demo)`);
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
          <div>
            <label
              htmlFor="auth-email"
              className="mb-1.5 block text-xs font-semibold text-muted uppercase tracking-wider"
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
              className="w-full rounded-lg border border-border bg-obsidian px-4 py-2.5 text-sm text-white placeholder:text-muted/50 focus:border-fuchsia/50 focus:outline-none focus:ring-1 focus:ring-fuchsia/30"
            />
          </div>
          <div>
            <label
              htmlFor="auth-password"
              className="mb-1.5 block text-xs font-semibold text-muted uppercase tracking-wider"
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
              className="w-full rounded-lg border border-border bg-obsidian px-4 py-2.5 text-sm text-white placeholder:text-muted/50 focus:border-fuchsia/50 focus:outline-none focus:ring-1 focus:ring-fuchsia/30"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#FF007F] py-3 text-sm font-bold uppercase tracking-wide text-white hover:brightness-110"
          >
            {isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2.5">
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
        </div>

        <p className="mt-5 text-center text-xs text-muted">
          {isLogin ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => openAuthModal(isLogin ? "signup" : "login")}
            className="font-semibold text-fuchsia hover:underline"
          >
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </p>
      </div>
    </div>
  );
}
