import { useState } from "react";
import { validateDateOfBirthInput } from "../../utils/ageVerification";
import { setAgeVerification } from "../../lib/complianceProfile";

interface DobCollectionScreenProps {
  onVerified: () => void;
}

export function DobCollectionScreen({ onVerified }: DobCollectionScreenProps) {
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const validationError = validateDateOfBirthInput(dateOfBirth);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const { error: saveError } = await setAgeVerification(dateOfBirth);
      if (saveError) {
        setError(saveError);
        return;
      }
      onVerified();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0a0c10] px-6 text-white"
      data-shell="mobile"
    >
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold tracking-tight">Confirm your age</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
          WinRips is for users 18 and older. Enter your date of birth to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="dob-collection"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]"
            >
              Date of birth
            </label>
            <input
              id="dob-collection"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
              max={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm text-white focus:border-[#FF007F]/50 focus:outline-none focus:ring-1 focus:ring-[#FF007F]/30"
            />
          </div>

          {error ? (
            <p className="text-sm text-red-400/90" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#FF007F] py-3 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-50"
          >
            {submitting ? "Please wait…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
