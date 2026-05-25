import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { formatGems } from "../../constants/retail";
import { VAULT_SHIPPING_COST } from "../../constants/shipping";
import { BRAND_FUCHSIA, BRAND_GOLD, BRAND_GRADIENT } from "../../constants/theme";
import type { VaultShippingConfirmInput } from "../../lib/vaultReleaseFlow";
import { queryKeys } from "../../queries/queryKeys";
import { CollectibleImage } from "../ui/CollectibleImage";
import { BrandTextField, ReleaseSpinner } from "./VaultReleaseFields";

export type { VaultShippingConfirmInput };

export interface ShippingFormValues {
  name: string;
  street: string;
  city: string;
  zip: string;
}

interface VaultReleaseModalProps {
  vaultItemId: string;
  itemName: string;
  itemImage?: string;
  itemValue?: number;
  shippingCost?: number;
  onClose: () => void;
  onSuccessDismiss: () => void;
  successDismissLabel?: string;
  onConfirm: (input: VaultShippingConfirmInput) => Promise<{ ok: boolean; error?: string }>;
}

function buildAddress(values: ShippingFormValues): string {
  return [values.street.trim(), values.city.trim(), values.zip.trim()]
    .filter(Boolean)
    .join(", ");
}

function VaultReleaseSuccessIcon() {
  return (
    <div
      className="vault-release-check mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10 shadow-[0_0_28px_rgba(52,211,153,0.25)]"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
        <circle cx="12" cy="12" r="10" stroke="rgba(52, 211, 153, 0.35)" strokeWidth="1.5" />
        <path
          className="vault-release-check-path"
          d="M7.5 12.5l3 3 6-6"
          stroke="#34d399"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function VaultReleaseSuccessView({
  dismissLabel,
  onDismiss,
}: {
  dismissLabel: string;
  onDismiss: () => void;
}) {
  return (
    <div className="py-4 text-center sm:py-6">
      <VaultReleaseSuccessIcon />
      <h4
        id="vault-release-success-title"
        className="mt-6 text-xl font-black uppercase tracking-[0.12em] text-white sm:text-2xl"
      >
        Request Received.
      </h4>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted">
        Your item is being prepared for dispatch. We will email you with tracking information as
        soon as your package leaves our vault.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-8 w-full rounded-xl px-6 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition-all hover:brightness-110"
        style={{
          background: BRAND_GRADIENT,
          border: `1px solid color-mix(in srgb, ${BRAND_GOLD} 35%, transparent)`,
          boxShadow: `0 0 24px color-mix(in srgb, ${BRAND_FUCHSIA} 22%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.12)`,
        }}
      >
        {dismissLabel}
      </button>
    </div>
  );
}

function ShippingSummary({ shippingCost }: { shippingCost: number }) {
  return (
    <section
      className="rounded-xl border bg-obsidian/70 p-4"
      style={{
        borderColor: `color-mix(in srgb, ${BRAND_GOLD} 35%, transparent)`,
        boxShadow: `inset 0 1px 0 color-mix(in srgb, ${BRAND_GOLD} 12%, transparent)`,
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4
          className="text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: BRAND_GOLD }}
        >
          Shipping Summary
        </h4>
        <span
          className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted"
          style={{ borderColor: `color-mix(in srgb, ${BRAND_FUCHSIA} 25%, transparent)` }}
        >
          Insured
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-3">
        <div>
          <p className="text-sm font-semibold text-white">Physical fulfillment fee</p>
          <p className="mt-0.5 text-xs text-muted">Deducted from your gem balance on release</p>
        </div>
        <p
          className="shrink-0 text-lg font-black tabular-nums"
          style={{ color: BRAND_GOLD }}
        >
          −{formatGems(shippingCost)}
        </p>
      </div>
    </section>
  );
}

export function VaultReleaseModal({
  itemName,
  itemImage,
  itemValue,
  shippingCost = VAULT_SHIPPING_COST,
  onClose,
  onSuccessDismiss,
  successDismissLabel = "Return to Vault",
  onConfirm,
}: VaultReleaseModalProps) {
  const queryClient = useQueryClient();
  const [succeeded, setSucceeded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ShippingFormValues>({
    name: "",
    street: "",
    city: "",
    zip: "",
  });

  async function handleFinalize(name: string, address: string) {
    setProcessing(true);
    setError(null);

    try {
      const result = await onConfirm({ name, address });
      if (!result.ok) {
        setError(result.error ?? "Unable to finalize vault release.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.vaultAll });
      await queryClient.invalidateQueries({ queryKey: queryKeys.userAll });

      setSucceeded(true);
    } finally {
      setProcessing(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const name = form.name.trim();
    const address = buildAddress(form);

    if (!name || !address) {
      setError("Enter a valid name and shipping address.");
      return;
    }

    await handleFinalize(name, address);
  }

  function handleSuccessDismiss() {
    onSuccessDismiss();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby={succeeded ? "vault-release-success-title" : "vault-release-title"}
      onClick={succeeded ? undefined : onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-slate/95 p-5 sm:p-6"
        style={{
          border: `1px solid color-mix(in srgb, ${BRAND_GOLD} 30%, transparent)`,
          boxShadow: `0 0 80px rgba(0, 0, 0, 0.55), 0 0 36px color-mix(in srgb, ${BRAND_FUCHSIA} 10%, transparent)`,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: BRAND_GRADIENT }}
          aria-hidden
        />

        {!succeeded ? (
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="absolute right-4 top-4 z-10 text-xl text-muted transition-colors hover:text-white disabled:opacity-40"
            aria-label="Close vault release"
          >
            ×
          </button>
        ) : null}

        {!succeeded ? (
          <header className="mb-5 flex gap-4 pr-8">
            <div
              className="relative h-24 w-[4.75rem] shrink-0 overflow-hidden rounded-xl border bg-obsidian p-1.5 sm:h-28 sm:w-[5.5rem]"
              style={{
                borderColor: `color-mix(in srgb, ${BRAND_FUCHSIA} 35%, transparent)`,
                boxShadow: `0 0 22px color-mix(in srgb, ${BRAND_FUCHSIA} 14%, transparent)`,
              }}
            >
              <CollectibleImage
                src={itemImage}
                alt={itemName}
                className="h-full w-full"
                frameClassName="h-full rounded-lg"
              />
            </div>

            <div className="min-w-0 flex-1 pt-1">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.24em]"
                style={{ color: BRAND_GOLD }}
              >
                Physical Fulfillment
              </p>
              <h3
                id="vault-release-title"
                className="mt-1 text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-2xl"
              >
                Vault Release
              </h3>
              <p className="mt-2 line-clamp-2 text-sm font-semibold text-white/90">{itemName}</p>
              {itemValue != null && itemValue > 0 ? (
                <p className="mt-1 text-xs font-mono text-muted">
                  Stated value:{" "}
                  <span style={{ color: BRAND_GOLD }}>{formatGems(itemValue)}</span>
                </p>
              ) : null}
            </div>
          </header>
        ) : null}

        {succeeded ? (
          <VaultReleaseSuccessView dismissLabel={successDismissLabel} onDismiss={handleSuccessDismiss} />
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
            <BrandTextField
              label="Recipient name"
              placeholder="Full legal name"
              autoComplete="name"
              value={form.name}
              disabled={processing}
              onChange={(name) => setForm((current) => ({ ...current, name }))}
            />

            <BrandTextField
              label="Street address"
              placeholder="Street address"
              autoComplete="street-address"
              value={form.street}
              disabled={processing}
              onChange={(street) => setForm((current) => ({ ...current, street }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <BrandTextField
                label="City"
                placeholder="City"
                autoComplete="address-level2"
                value={form.city}
                disabled={processing}
                onChange={(city) => setForm((current) => ({ ...current, city }))}
              />
              <BrandTextField
                label="ZIP / Postal"
                placeholder="ZIP code"
                autoComplete="postal-code"
                value={form.zip}
                disabled={processing}
                onChange={(zip) => setForm((current) => ({ ...current, zip }))}
              />
            </div>

            <ShippingSummary shippingCost={shippingCost} />

            {error ? (
              <p className="text-xs font-semibold" style={{ color: BRAND_FUCHSIA }}>
                {error}
              </p>
            ) : null}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={processing}
                className="flex-1 rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  borderColor: `color-mix(in srgb, ${BRAND_GOLD} 22%, transparent)`,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: BRAND_GRADIENT,
                  border: `1px solid color-mix(in srgb, ${BRAND_GOLD} 35%, transparent)`,
                  boxShadow: processing
                    ? "none"
                    : `0 0 24px color-mix(in srgb, ${BRAND_FUCHSIA} 30%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.12)`,
                }}
              >
                {processing ? (
                  <>
                    <ReleaseSpinner />
                    Processing Release…
                  </>
                ) : (
                  "Finalize Release"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
