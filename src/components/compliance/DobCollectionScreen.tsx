import { useState } from "react";
import { setAgeVerification } from "../../lib/complianceProfile";

interface DobCollectionScreenProps {
  onVerified: () => void;
}

export function DobCollectionScreen({ onVerified }: DobCollectionScreenProps) {
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirmAdult() {
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      const { error: saveError } = await setAgeVerification("1990-01-01");
      if (saveError) {
        setError(saveError);
        return;
      }
      onVerified();
    } finally {
      setSubmitting(false);
    }
  }

  if (blocked) {
    return (
      <div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0a0c10] px-6 text-white"
        data-shell="mobile"
      >
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold tracking-tight">Access restricted</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">
            WinRips is only available to users 18 and older.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0a0c10] px-6 text-white"
      data-shell="mobile"
    >
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold tracking-tight">Confirm your age</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
          WinRips is for users 18 and older. Please confirm your age to continue.
        </p>

        {error ? (
          <p className="mt-6 text-sm text-red-400/90" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-8 space-y-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleConfirmAdult()}
            className="w-full rounded-xl bg-[#FF007F] py-3.5 text-[15px] font-bold tracking-wide text-white disabled:opacity-50"
          >
            {submitting ? "Please wait…" : "I am 18 or older"}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => setBlocked(true)}
            className="w-full rounded-xl border border-white/[0.12] bg-transparent py-3.5 text-[15px] font-semibold text-white transition-colors active:bg-white/[0.04] disabled:opacity-50"
          >
            I am under 18
          </button>
        </div>
      </div>
    </div>
  );
}
