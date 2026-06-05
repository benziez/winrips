import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { VaultedCard } from "../../../types";
import { useApp } from "../../../context/AppContext";
import {
  canShipCardValue,
  formatUsd,
  gemsToUsd,
} from "../../../constants/retail";
import { VAULT_SHIPPING_COST } from "../../../constants/shipping";
import { shipVaultItemInUi } from "../../../lib/shippingLogic";
import { queryKeys } from "../../../queries/queryKeys";
import { CollectibleImage } from "../../ui/CollectibleImage";
import { RipBottomSheet } from "../rip/RipBottomSheet";
import {
  hapticMediumImpact,
  hapticNotificationSuccess,
} from "../../../utils/mobileHaptics";

interface ShipCardSheetProps {
  open: boolean;
  onClose: () => void;
  card: VaultedCard | null;
  onSuccess?: () => void;
  zIndex?: number;
}

interface ShippingFormValues {
  name: string;
  street: string;
  city: string;
  zip: string;
}

const EMPTY_FORM: ShippingFormValues = {
  name: "",
  street: "",
  city: "",
  zip: "",
};

function buildAddress(values: ShippingFormValues): string {
  return [values.street.trim(), values.city.trim(), values.zip.trim()]
    .filter(Boolean)
    .join(", ");
}

const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-[var(--rip-border)] bg-[var(--rip-surface)] px-4 py-3 text-[15px] text-white outline-none placeholder:text-[var(--rip-text-muted)]";

export function ShipCardSheet({
  open,
  onClose,
  card,
  onSuccess,
  zIndex = 95,
}: ShipCardSheetProps) {
  const queryClient = useQueryClient();
  const {
    goldVolts,
    userId,
    showCashoutToast,
    showErrorToast,
    markVaultItemPendingShipment,
    syncGemBalanceFromServer,
  } = useApp();

  const [form, setForm] = useState<ShippingFormValues>(EMPTY_FORM);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setProcessing(false);
    }
  }, [open]);

  const shippingFeeUsd = formatUsd(gemsToUsd(VAULT_SHIPPING_COST));
  const hasSufficientBalance = goldVolts >= VAULT_SHIPPING_COST;

  const formComplete = useMemo(() => {
    const name = form.name.trim();
    const street = form.street.trim();
    const city = form.city.trim();
    const zip = form.zip.trim();
    return Boolean(name && street && city && zip.length >= 5);
  }, [form]);

  const canSubmit = formComplete && hasSufficientBalance && !processing;

  function updateField<K extends keyof ShippingFormValues>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleFinalize() {
    if (!card?.vaultId || processing) return;

    if (!canShipCardValue(card.value)) {
      showErrorToast(
        "Cards under $50 cannot be shipped. Tap Sell to convert to balance.",
      );
      return;
    }

    const name = form.name.trim();
    const address = buildAddress(form);

    if (!name || !address || form.zip.trim().length < 5) {
      showErrorToast("Enter a valid name and shipping address.");
      return;
    }

    if (!hasSufficientBalance) {
      showErrorToast("You don't have enough balance to cover the shipping fee.");
      return;
    }

    void hapticMediumImpact();
    setProcessing(true);

    try {
      const shipped = await shipVaultItemInUi(
        card.vaultId,
        { name, address },
        {
          onShipped: (vaultItemId, serverGemsBalance) => {
            markVaultItemPendingShipment(
              vaultItemId,
              name,
              address,
              serverGemsBalance,
            );
          },
          syncGemBalance: userId
            ? async () => {
                await syncGemBalanceFromServer(userId);
              }
            : undefined,
          invalidateBalanceQueries: async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.vaultAll });
            await queryClient.invalidateQueries({ queryKey: queryKeys.userAll });
          },
          toastError: showErrorToast,
          toastSuccess: (message) => {
            void hapticNotificationSuccess();
            showCashoutToast(message);
          },
          closeModal: () => {
            onSuccess?.();
            onClose();
          },
        },
      );

      if (!shipped) {
        console.error("[ShipCardSheet] processShippingRequest failed:", {
          vaultItemId: card.vaultId,
        });
      }
    } catch (error) {
      console.error("[ShipCardSheet] processShippingRequest threw:", error);
      showErrorToast("Something went wrong, try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <RipBottomSheet open={open} onClose={onClose} heightClass="h-[85dvh]" zIndex={zIndex}>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-32 pt-14">
        <div className="mt-4 px-6">
          <p className="text-[12px] font-medium uppercase tracking-wider text-[var(--rip-text-muted)]">
            Physical Fulfillment
          </p>
          <h2 className="mt-1 text-[26px] font-bold leading-tight text-white">Ship Card</h2>
        </div>

        {card ? (
          <>
            <div className="mx-6 mt-6 flex items-center gap-4 rounded-2xl bg-[var(--rip-surface)] p-4">
              <div className="h-[88px] w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--rip-bg-elevated)] p-1">
                <CollectibleImage
                  src={card.image}
                  alt={card.name}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-semibold text-white">{card.name}</p>
                <p className="mt-1 text-[13px] text-[var(--rip-text-muted)]">
                  Stated value:{" "}
                  <span className="font-semibold text-white">
                    {formatUsd(gemsToUsd(card.value))}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4 px-6">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--rip-text-muted)]">
                  Recipient name
                </span>
                <input
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Full legal name"
                  className={INPUT_CLASS}
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--rip-text-muted)]">
                  Street address
                </span>
                <input
                  type="text"
                  autoComplete="street-address"
                  value={form.street}
                  onChange={(event) => updateField("street", event.target.value)}
                  placeholder="Street address"
                  className={INPUT_CLASS}
                />
              </label>

              <div className="flex gap-3">
                <label className="block min-w-0 flex-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--rip-text-muted)]">
                    City
                  </span>
                  <input
                    type="text"
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={(event) => updateField("city", event.target.value)}
                    placeholder="City"
                    className={INPUT_CLASS}
                  />
                </label>
                <label className="block w-32 shrink-0">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--rip-text-muted)]">
                    ZIP / Postal
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={form.zip}
                    onChange={(event) => updateField("zip", event.target.value)}
                    placeholder="ZIP code"
                    className={INPUT_CLASS}
                  />
                </label>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--rip-text-muted)]">
                  Country
                </span>
                <p className="mt-2 rounded-xl border border-[var(--rip-border)] bg-[var(--rip-surface)] px-4 py-3 text-[15px] text-[var(--rip-text-muted)]">
                  United States
                </p>
              </div>
            </div>

            <div className="mx-6 mt-6 rounded-2xl bg-[var(--rip-surface)] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-bold text-white">Shipping Summary</p>
                    <span className="rounded-full bg-[var(--rip-surface-strong)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--rip-green-bright)]">
                      Insured
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-[var(--rip-text-muted)]">
                    Physical fulfillment fee
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--rip-text-muted)]">
                    Deducted from your balance on release
                  </p>
                </div>
                <p className="shrink-0 text-[22px] font-bold tabular-nums text-white">
                  -{shippingFeeUsd}
                </p>
              </div>
              {!hasSufficientBalance ? (
                <p className="mt-3 text-[13px] text-red-300">
                  Insufficient balance for the {shippingFeeUsd} shipping fee.
                </p>
              ) : null}
            </div>

            <div className="mx-6 mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={processing}
                className="flex h-14 flex-1 items-center justify-center rounded-full border border-[var(--rip-border)] bg-[var(--rip-surface)] text-[16px] font-semibold text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                onClick={() => void handleFinalize()}
                disabled={!canSubmit}
                whileTap={canSubmit ? { scale: 0.97 } : undefined}
                className={`flex h-14 flex-[2] items-center justify-center rounded-full text-[16px] font-semibold ${
                  canSubmit
                    ? "bg-[var(--rip-orange)] text-white active:bg-[var(--rip-orange-pressed)]"
                    : "bg-[var(--rip-surface)] text-[var(--rip-text-muted)]"
                }`}
              >
                {processing ? "Processing…" : "Finalize Release"}
              </motion.button>
            </div>
          </>
        ) : (
          <p className="px-6 py-8 text-[15px] text-[var(--rip-text-muted)]">
            Select a card to ship.
          </p>
        )}
      </div>
    </RipBottomSheet>
  );
}