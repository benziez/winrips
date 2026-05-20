import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  CUSTOM_GEM_MAX,
  CUSTOM_GEM_MIN,
  PURCHASE_BUNDLES,
  bundleTotalGems,
  customAmountBundle,
  type PaymentMethod,
  type PurchaseBundle,
} from "../../data/purchaseBundles";
import { useApp } from "../../context/AppContext";
import { depositQrCodeUrl, requestDepositPayment } from "../../lib/paymentsApi";
import type { DepositPayCurrency, DepositPaymentResponse } from "../../types/payments";

const CRYPTO_ASSETS: { id: DepositPayCurrency; label: string; hint: string }[] = [
  { id: "sol", label: "Solana", hint: "SOL" },
  { id: "ltc", label: "Litecoin", hint: "LTC" },
];

function GemCluster({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const scale =
    size === "lg" ? "scale-100" : size === "sm" ? "scale-[0.82]" : "scale-90";

  return (
    <div
      className={`relative mx-auto flex h-9 w-12 items-center justify-center ${scale}`}
      aria-hidden
    >
      <div className="absolute left-0.5 top-1.5 h-5 w-5 rotate-[-18deg] rounded-sm bg-gradient-to-br from-pink-300 to-[#FF007F] shadow-[0_3px_10px_rgba(255,0,127,0.4)]" />
      <div className="relative z-10 h-7 w-7 rotate-12 rounded-sm bg-gradient-to-br from-pink-200 to-[#FF007F] shadow-[0_4px_12px_rgba(255,0,127,0.45)]" />
      <div className="absolute right-0 top-2.5 h-[18px] w-[18px] rotate-[24deg] rounded-sm bg-gradient-to-br from-[#FF4DA6] to-[#C4006A] shadow-[0_2px_8px_rgba(255,0,127,0.35)]" />
      <div className="absolute bottom-0 left-5 h-4 w-4 rounded-sm bg-gradient-to-br from-pink-400 to-[#FF007F] opacity-90" />
    </div>
  );
}

function CardBrandIcons() {
  return (
    <div className="mt-2.5 flex items-center gap-2.5" aria-hidden>
      <svg viewBox="0 0 40 14" className="h-3.5 w-9 text-[#6B7280]" aria-hidden>
        <text x="0" y="11" fill="currentColor" fontSize="11" fontWeight="700" fontFamily="system-ui">
          VISA
        </text>
      </svg>
      <svg viewBox="0 0 28 18" className="h-4 w-6 text-[#6B7280]" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="10" cy="9" r="7" />
        <circle cx="18" cy="9" r="7" />
      </svg>
      <svg viewBox="0 0 28 18" className="h-4 w-6 text-[#6B7280]" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="24" height="12" rx="2" />
        <path d="M2 8h24" />
      </svg>
      <svg viewBox="0 0 20 18" className="h-4 w-5 text-[#6B7280]" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="10" cy="9" r="7" />
        <path d="M10 5v8M6 9h8" />
      </svg>
    </div>
  );
}

function CryptoBrandIcons() {
  return (
    <div className="mt-2.5 flex items-center gap-2.5" aria-hidden>
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#6B7280]" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5c2-2.5 5.5-1 5.5 2.5s-3.5 4.5-5.5 2.5" />
      </svg>
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#6B7280]" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 4v4l3 3-3 3v4M8 12h8" />
      </svg>
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#6B7280]" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 8h8v8H8z" />
        <path d="M10 12h4" />
      </svg>
    </div>
  );
}

function RadioMark({ active }: { active: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
        active ? "border-[#FF007F] bg-[#FF007F]" : "border-[#4B5563] bg-[#0A0A0C]"
      }`}
    >
      {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
    </span>
  );
}

function PaymentMethodPanel({
  active,
  onSelect,
  title,
  children,
}: {
  active: boolean;
  onSelect: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex-1 cursor-pointer rounded-md border p-3.5 text-left transition-all lg:flex lg:flex-col lg:justify-center ${
        active
          ? "border-[#FF007F] bg-[#FF007F]/5"
          : "border-[#2A2D34] bg-[#1A1C20] hover:border-[#FF007F]/50"
      }`}
    >
      <p className="text-sm font-semibold text-white">{title}</p>
      {children}
    </button>
  );
}

function RefillTierCard({
  bundle,
  selected,
  processing,
  onSelect,
  onPurchase,
}: {
  bundle: PurchaseBundle;
  selected: boolean;
  processing: boolean;
  onSelect: () => void;
  onPurchase: () => void;
}) {
  const gems = bundleTotalGems(bundle);
  const clusterSize =
    gems >= 50_000 ? "lg" : gems >= 10_000 ? "md" : "sm";

  return (
    <article
      className={`relative flex flex-col overflow-hidden rounded-lg border bg-[#121318] transition-colors ${
        selected ? "border-[#FF007F]/50" : "border-[#2A2D34]"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-1 flex-col items-center px-2 py-3 text-center sm:px-2.5 sm:py-4"
      >
        <div className="mb-1 flex w-full items-start">
          <RadioMark active={selected} />
        </div>
        <GemCluster size={clusterSize} />
        <p className="mt-1.5 text-base font-bold tabular-nums tracking-tight text-white">
          {gems.toLocaleString()}
        </p>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-[#FF007F]">Gems</p>
      </button>
      <button
        type="button"
        disabled={processing}
        onClick={onPurchase}
        className="w-full bg-[#FF007F] py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#FF007F]/90 disabled:cursor-wait disabled:opacity-60"
      >
        ${bundle.priceUsd.toFixed(2)}
      </button>
    </article>
  );
}

export function PurchaseModal() {
  const {
    purchaseModalOpen,
    setPurchaseModalOpen,
    isLoggedIn,
    openAuthModal,
    userId,
    showCashoutToast,
    syncGemBalanceFromServer,
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("crypto");
  const [payCurrency, setPayCurrency] = useState<DepositPayCurrency>("sol");
  const [selectedTierId, setSelectedTierId] = useState<string | null>(
    PURCHASE_BUNDLES[0]?.id ?? null,
  );
  const [customAmount, setCustomAmount] = useState("");
  const [affiliateCode, setAffiliateCode] = useState("");
  const [giftCode, setGiftCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [payment, setPayment] = useState<DepositPaymentResponse | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const gemValue = Number.parseInt(customAmount.replace(/,/g, ""), 10) || 0;
  const isValidAmount = gemValue >= CUSTOM_GEM_MIN && gemValue <= CUSTOM_GEM_MAX;
  const calculatedPrice = (gemValue / 100).toFixed(2);

  function handleCustomAmountChange(raw: string) {
    const digitsOnly = raw.replace(/\D/g, "");
    if (!digitsOnly) {
      setCustomAmount("");
      return;
    }
    const parsed = Number.parseInt(digitsOnly, 10);
    setCustomAmount(String(Math.min(parsed, CUSTOM_GEM_MAX)));
  }

  const reset = useCallback(() => {
    setPaymentMethod("crypto");
    setPayCurrency("sol");
    setSelectedTierId(PURCHASE_BUNDLES[0]?.id ?? null);
    setCustomAmount("");
    setAffiliateCode("");
    setGiftCode("");
    setProcessing(false);
    setPayment(null);
    setPaymentError(null);
    setCopied(false);
  }, []);

  useEffect(() => {
    if (!purchaseModalOpen) reset();
  }, [purchaseModalOpen, reset]);

  useEffect(() => {
    if (!purchaseModalOpen || !payment) return;

    const pollBalance = () => {
      void syncGemBalanceFromServer();
    };

    pollBalance();
    const intervalId = window.setInterval(pollBalance, 5000);
    return () => window.clearInterval(intervalId);
  }, [purchaseModalOpen, payment, syncGemBalanceFromServer]);

  function handleClose() {
    setPurchaseModalOpen(false);
  }

  const startPurchase = useCallback(
    async (bundle: PurchaseBundle) => {
      if (processing) return;

      if (!isLoggedIn) {
        openAuthModal("login", { keepPurchaseModalOpen: true });
        return;
      }

      if (paymentMethod === "card") {
        showCashoutToast("Card checkout is coming soon — use Crypto to refill now.");
        return;
      }

      setProcessing(true);
      setPaymentError(null);
      setPayment(null);

      try {
        const result = await requestDepositPayment({
          priceAmount: bundle.priceUsd,
          payCurrency,
          userId,
        });
        setPayment(result);
      } catch (err) {
        setPaymentError(err instanceof Error ? err.message : "Unable to create payment.");
      } finally {
        setProcessing(false);
      }
    },
    [processing, isLoggedIn, openAuthModal, paymentMethod, payCurrency, userId],
  );

  function handleTierPurchase(bundle: PurchaseBundle) {
    setSelectedTierId(bundle.id);
    void startPurchase(bundle);
  }

  function handleCustomAmount() {
    if (!isValidAmount) return;
    void startPurchase(customAmountBundle(gemValue));
  }

  async function handleCopyAddress() {
    if (!payment?.payAddress) return;
    try {
      await navigator.clipboard.writeText(payment.payAddress);
      setCopied(true);
      showCashoutToast("Deposit address copied to clipboard.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showCashoutToast("Copy failed — select the address manually.");
    }
  }

  function handleApplyAffiliate() {
    if (!affiliateCode.trim()) return;
    showCashoutToast("Affiliate code applied — Get 5% bonus gems on your next refill.");
    setAffiliateCode("");
  }

  function handleSubmitGift() {
    if (!giftCode.trim()) return;
    showCashoutToast("Gift code submitted — rewards will apply when validated.");
    setGiftCode("");
  }

  if (!purchaseModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-title"
    >
      <div className="relative flex max-h-[90vh] w-[92%] max-w-xl flex-col overflow-hidden rounded-xl border border-[#2A2D34] bg-[#0F1115] shadow-2xl md:max-h-[94vh] md:max-w-4xl">
        <div className="flex shrink-0 items-center justify-between border-b border-[#2A2D34] px-4 py-2.5 sm:px-6 sm:py-3">
          <h2 id="purchase-title" className="text-base font-bold uppercase tracking-wide text-white sm:text-lg">
            Gem Refill
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-lg text-[#A0A5B5] transition-colors hover:bg-[#1A1C20] hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {payment ? (
            <div className="mx-auto max-w-md space-y-4 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A5B5]">
                Send {payment.payCurrency.toUpperCase()} — ${payment.priceAmount.toFixed(2)} USD
              </p>
              <div className="mx-auto inline-block rounded-xl border border-[#2A2D34] bg-white p-3">
                <img
                  src={depositQrCodeUrl(payment.payAddress, 220)}
                  alt={`QR code for ${payment.payCurrency} deposit`}
                  width={220}
                  height={220}
                  className="h-[220px] w-[220px]"
                />
              </div>
              <div className="text-left">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#A0A5B5]">
                  Deposit address
                </p>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="group w-full rounded-lg border border-[#2A2D34] bg-[#0A0A0C] p-3 text-left transition-colors hover:border-[#FF007F]/50"
                >
                  <p className="break-all font-mono text-xs leading-relaxed text-white group-hover:text-[#FF007F]">
                    {payment.payAddress}
                  </p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#FF007F]">
                    {copied ? "Copied" : "Tap to copy address"}
                  </p>
                </button>
              </div>
              <p className="text-[10px] leading-relaxed text-[#A0A5B5]/80">
                Order <span className="font-mono text-white/70">{payment.orderId}</span> — gems credit
                automatically after NOWPayments confirms your transfer.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPayment(null);
                  setPaymentError(null);
                }}
                className="text-xs font-semibold uppercase tracking-wider text-[#A0A5B5] transition-colors hover:text-[#FF007F]"
              >
                ← Back to packages
              </button>
            </div>
          ) : (
          <>
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:gap-5">
            <aside className="flex shrink-0 flex-row gap-1.5 sm:gap-2 lg:w-44 lg:flex-col lg:gap-3 lg:self-stretch">
              <PaymentMethodPanel
                active={paymentMethod === "card"}
                onSelect={() => setPaymentMethod("card")}
                title="Credit / Debit"
              >
                <CardBrandIcons />
              </PaymentMethodPanel>

              <PaymentMethodPanel
                active={paymentMethod === "crypto"}
                onSelect={() => setPaymentMethod("crypto")}
                title="Crypto"
              >
                <CryptoBrandIcons />
              </PaymentMethodPanel>
            </aside>

            <div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
              {paymentMethod === "crypto" && (
                <div className="grid grid-cols-2 gap-1.5">
                  {CRYPTO_ASSETS.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setPayCurrency(asset.id)}
                      className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        payCurrency === asset.id
                          ? "border-[#FF007F] bg-[#FF007F]/10"
                          : "border-[#2A2D34] bg-[#121318] hover:border-[#FF007F]/40"
                      }`}
                    >
                      <p className="text-xs font-bold text-white">{asset.label}</p>
                      <p className="text-[10px] font-mono uppercase text-[#FF007F]">{asset.hint}</p>
                    </button>
                  ))}
                </div>
              )}

              {paymentError && (
                <p
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300"
                  role="alert"
                >
                  {paymentError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2">
                {PURCHASE_BUNDLES.map((bundle) => (
                  <RefillTierCard
                    key={bundle.id}
                    bundle={bundle}
                    selected={selectedTierId === bundle.id}
                    processing={processing}
                    onSelect={() => setSelectedTierId(bundle.id)}
                    onPurchase={() => handleTierPurchase(bundle)}
                  />
                ))}
              </div>

              <div className="rounded-lg border border-[#2A2D34] bg-[#121318] p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="flex h-11 min-w-0 flex-1 items-center rounded-md border border-[#2A2D34] bg-[#16181C] px-3 transition-all focus-within:border-[#FF007F]/50">
                      <span className="shrink-0 text-sm leading-none" aria-hidden>
                        💎
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={customAmount}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        placeholder="Enter Custom Amount"
                        maxLength={6}
                        className="flex h-full w-full flex-1 items-center bg-transparent pb-0 pl-2 pt-0 text-sm font-bold text-white outline-none placeholder:text-[#A0A5B5]/30"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!isValidAmount}
                      onClick={handleCustomAmount}
                      className="h-11 shrink-0 rounded-md bg-[#FF007F] px-5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#FF007F]/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#FF007F]"
                    >
                      {isValidAmount ? `BUY FOR $${calculatedPrice}` : "SELECT AMOUNT"}
                    </button>
                  </div>
                </div>
                <span className="mt-1.5 block pl-1 text-[10px] font-medium uppercase tracking-wider text-[#A0A5B5]/40">
                  Min: 500 GEMS — Max: 100,000 GEMS
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-[#2A2D34] pt-3 sm:mt-4 sm:grid-cols-2 sm:gap-3 sm:pt-4">
            <div className="rounded-lg border border-[#2A2D34] bg-[#121318] p-3">
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#A0A5B5]">
                Enter Affiliate Code
              </label>
              <p className="mb-2 text-[10px] text-[#FF007F]">Get 5% bonus gems</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={affiliateCode}
                  onChange={(e) => setAffiliateCode(e.target.value)}
                  placeholder="Affiliate code"
                  className="min-w-0 flex-1 rounded-md border border-[#2A2D34] bg-[#0A0A0C] px-3 py-2 text-xs text-white placeholder:text-[#4B5563] focus:border-[#FF007F]/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyAffiliate}
                  className="shrink-0 rounded-md border border-[#FF007F]/40 bg-[#FF007F] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#FF007F]/90"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-[#2A2D34] bg-[#121318] p-3">
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#A0A5B5]">
                Enter Gift Code
              </label>
              <p className="mb-2 text-[10px] text-transparent select-none">.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={giftCode}
                  onChange={(e) => setGiftCode(e.target.value)}
                  placeholder="Gift code"
                  className="min-w-0 flex-1 rounded-md border border-[#2A2D34] bg-[#0A0A0C] px-3 py-2 text-xs text-white placeholder:text-[#4B5563] focus:border-[#FF007F]/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSubmitGift}
                  className="shrink-0 rounded-md border border-[#FF007F]/40 bg-[#FF007F] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#FF007F]/90"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
