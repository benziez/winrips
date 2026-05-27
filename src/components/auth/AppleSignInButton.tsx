import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface AppleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (message: string) => void;
  className?: string;
}

export function AppleSignInButton({ onSuccess, onError, className = "" }: AppleSignInButtonProps) {
  const { signInWithApple } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { error } = await signInWithApple();
      if (error) {
        onError?.(error);
        return;
      }
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={submitting}
      className={`flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white py-3.5 text-sm font-semibold text-black transition-opacity disabled:opacity-50 ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M17.05 20.28c-.98.95-2.05 1.88-3.71 1.9-1.6.02-2.12-.93-3.96-.93-1.84 0-2.41.9-3.93.92-1.58.03-2.78-.87-3.76-1.82-3.24-3.14-2.85-8.96.86-11.22 1.32-.87 2.98-1.36 4.66-1.32 1.54.03 2.98.95 3.92.95.94 0 2.72-1.17 4.58-1 .78.03 2.96.31 4.36 2.34-.11.07-2.6 1.52-2.57 4.53.03 3.58 3.14 4.77 3.18 4.79-.03.08-.5 1.72-1.64 3.4zM14.02 4.2c.83-1.01 1.39-2.41 1.24-3.8-1.2.05-2.65.8-3.51 1.79-.77.89-1.44 2.33-1.26 3.7 1.33.1 2.69-.68 3.53-1.69z" />
      </svg>
      {submitting ? "Connecting…" : "Sign in with Apple"}
    </button>
  );
}
