import { useState } from "react";
import { submitTaxInfo } from "../../lib/complianceProfile";

interface TaxInfoFormProps {
  onSubmitted: () => void;
  onError: (message: string) => void;
}

export function TaxInfoForm({ onSubmitted, onError }: TaxInfoFormProps) {
  const [taxName, setTaxName] = useState("");
  const [taxAddress, setTaxAddress] = useState("");
  const [taxSsnLast4, setTaxSsnLast4] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!taxName.trim() || !taxAddress.trim() || taxSsnLast4.trim().length !== 4) {
      onError("Enter your legal name, address, and the last 4 digits of your SSN or EIN.");
      return;
    }

    if (!confirmed) {
      onError("Confirm that your tax information is accurate.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await submitTaxInfo({
        taxName,
        taxAddress,
        taxSsnLast4,
      });
      if (error) {
        onError(error);
        return;
      }
      onSubmitted();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex w-full max-w-md flex-col gap-4">
      <div>
        <label htmlFor="tax-name" className="mb-1 block text-xs font-semibold uppercase text-[var(--rip-text-muted)]">
          Legal name
        </label>
        <input
          id="tax-name"
          type="text"
          value={taxName}
          onChange={(e) => setTaxName(e.target.value)}
          required
          className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm text-white"
        />
      </div>
      <div>
        <label htmlFor="tax-address" className="mb-1 block text-xs font-semibold uppercase text-[var(--rip-text-muted)]">
          Mailing address
        </label>
        <textarea
          id="tax-address"
          value={taxAddress}
          onChange={(e) => setTaxAddress(e.target.value)}
          required
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm text-white"
        />
      </div>
      <div>
        <label htmlFor="tax-ssn" className="mb-1 block text-xs font-semibold uppercase text-[var(--rip-text-muted)]">
          Last 4 of SSN or EIN
        </label>
        <input
          id="tax-ssn"
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={taxSsnLast4}
          onChange={(e) => setTaxSsnLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
          required
          className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm text-white"
        />
        {/* TODO: Before scaling past a handful of $600 users, integrate Stripe Tax or a proper W-9 collection service. Do NOT store full SSN in production. */}
      </div>
      <label className="flex items-start gap-2 text-sm text-[var(--rip-text-muted)]">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1"
        />
        <span>I confirm this information is accurate.</span>
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="flex h-14 w-full items-center justify-center rounded-full bg-[var(--rip-green)] text-[17px] font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Submit tax info"}
      </button>
    </form>
  );
}
