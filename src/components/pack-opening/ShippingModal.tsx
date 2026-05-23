import { useState, type FormEvent } from "react";
import { formatGems } from "../../constants/retail";
import { Button } from "../ui/Button";

export interface ShippingFormValues {
  name: string;
  street: string;
  city: string;
  zip: string;
}

export interface VaultShippingConfirmInput {
  name: string;
  address: string;
}

interface ShippingModalProps {
  itemName: string;
  onClose: () => void;
  /** Pack reveal flow — no gem charge */
  onSubmit?: () => void;
  /** Vault delivery flow — charges gems server-side */
  vaultMode?: {
    shippingCost: number;
    onConfirm: (input: VaultShippingConfirmInput) => Promise<{ ok: boolean; error?: string }>;
  };
}

function buildAddress(values: ShippingFormValues): string {
  return [values.street.trim(), values.city.trim(), values.zip.trim()]
    .filter(Boolean)
    .join(", ");
}

export function ShippingModal({
  itemName,
  onClose,
  onSubmit,
  vaultMode,
}: ShippingModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ShippingFormValues>({
    name: "",
    street: "",
    city: "",
    zip: "",
  });

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg bg-obsidian border border-border text-white text-sm placeholder:text-muted focus:border-fuchsia/50 focus:outline-none";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const name = form.name.trim();
    const address = buildAddress(form);

    if (!name || !address) {
      setError("Enter a valid name and shipping address.");
      return;
    }

    if (vaultMode) {
      setProcessing(true);
      try {
        const result = await vaultMode.onConfirm({ name, address });
        if (!result.ok) {
          setError(result.error ?? "Unable to submit shipping request.");
          return;
        }
      } finally {
        setProcessing(false);
      }
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      onSubmit?.();
    }, 1200);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl card-pack p-5 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="mb-1 text-base font-bold text-white">Request Delivery</h3>
        <p className="mb-1 text-sm text-muted">{itemName}</p>
        {vaultMode ? (
          <p className="mb-4 text-sm font-semibold text-gold">
            Shipping Cost: {formatGems(vaultMode.shippingCost)}
          </p>
        ) : (
          <p className="mb-5 text-xs text-muted/80">
            Enter your verified shipping address for insured physical fulfillment.
          </p>
        )}

        {submitted ? (
          <div className="py-8 text-center">
            <span className="text-4xl">📦</span>
            <p className="mt-3 text-sm font-semibold text-fuchsia">Shipping request submitted!</p>
          </div>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
            {!vaultMode ? (
              <p className="text-xs text-muted/80">
                Enter your verified shipping address for insured physical fulfillment.
              </p>
            ) : null}
            <input
              required
              placeholder="Full name"
              className={inputClass}
              value={form.name}
              disabled={processing}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <input
              required
              placeholder="Street address"
              className={inputClass}
              value={form.street}
              disabled={processing}
              onChange={(event) =>
                setForm((current) => ({ ...current, street: event.target.value }))
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                placeholder="City"
                className={inputClass}
                value={form.city}
                disabled={processing}
                onChange={(event) =>
                  setForm((current) => ({ ...current, city: event.target.value }))
                }
              />
              <input
                required
                placeholder="ZIP"
                className={inputClass}
                value={form.zip}
                disabled={processing}
                onChange={(event) => setForm((current) => ({ ...current, zip: event.target.value }))}
              />
            </div>
            {error ? <p className="text-xs font-semibold text-fuchsia">{error}</p> : null}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={onClose}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button type="submit" variant="open" className="flex-1" disabled={processing}>
                {processing ? "Processing…" : "Confirm Ship"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
