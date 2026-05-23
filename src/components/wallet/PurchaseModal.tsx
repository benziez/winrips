import { useCallback, useEffect, useState } from "react";
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
import { ChevronLeft } from "../icons/AppIcons";
import { CheckoutAuthGate } from "./CheckoutAuthGate";
import { CryptoDepositPanel } from "./CryptoDepositPanel";
import { WalletOfferBanner } from "./WalletOfferBanner";

const INPUT_CLASS =
  "w-full rounded-md border border-[#213743] bg-[#0f212e] px-3 py-2.5 text-sm font-medium text-white placeholder:text-muted/40 focus:border-fuchsia/50 focus:outline-none";

const PRICE_BTN_CLASS =
  "flex w-full items-center justify-center rounded-lg border border-gold/30 bg-[#0f212e] px-3 py-2.5 text-sm font-bold tabular-nums text-white transition-all group-hover:border-fuchsia/50 group-hover:bg-fuchsia/10 group-hover:text-fuchsia disabled:cursor-wait disabled:opacity-60";

const HEADER_BACK_BTN_CLASS =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-[#0f212e] hover:text-white";

function GemRefillModalHeader({
  titleId,
  showBack,
  onBack,
  onClose,
}: {
  titleId: string;
  showBack: boolean;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-[#213743] px-5 py-3.5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className={HEADER_BACK_BTN_CLASS}
            aria-label="Back to wallet"
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
        ) : null}
        <h2
          id={titleId}
          className="truncate text-base font-bold uppercase tracking-wide text-white"
        >
          Gem Refill
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        className={HEADER_BACK_BTN_CLASS}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}

function GemCluster({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const scale =
    size === "lg" ? "scale-100" : size === "sm" ? "scale-[0.82]" : "scale-90";

  return (
    <div
      className={`relative mx-auto flex h-8 w-10 items-center justify-center ${scale}`}
      aria-hidden
    >
      <div className="absolute left-0.5 top-1.5 h-4 w-4 rotate-[-18deg] rounded-sm bg-gradient-to-br from-pink-300 to-[#ff007a] shadow-[0_2px_8px_rgba(255,0,122,0.35)]" />
      <div className="relative z-10 h-6 w-6 rotate-12 rounded-sm bg-gradient-to-br from-pink-200 to-[#ff007a] shadow-[0_3px_10px_rgba(255,0,122,0.4)]" />
      <div className="absolute right-0 top-2 h-3.5 w-3.5 rotate-[24deg] rounded-sm bg-gradient-to-br from-[#ff4da6] to-[#c4006a]" />
    </div>
  );
}

function PaymentTab({
  active,
  onSelect,
  label,
}: {
  active: boolean;
  onSelect: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full px-1 py-2 text-left text-sm font-semibold transition-colors lg:px-0 lg:py-3 ${
        active
          ? "text-fuchsia lg:border-l-2 lg:border-fuchsia lg:pl-3"
          : "text-muted hover:text-white lg:border-l-2 lg:border-transparent lg:pl-3"
      }`}
    >
      {label}
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
  const ripsBonus = gems;
  const clusterSize = gems >= 50_000 ? "lg" : gems >= 10_000 ? "md" : "sm";

  return (
    <article
      className={`group flex w-full min-w-0 flex-col overflow-hidden rounded-xl border bg-[#1a1d24] transition-all duration-200 ${
        selected
          ? "border-fuchsia/45 shadow-[0_0_24px_rgba(255,0,122,0.15)]"
          : "border-[#2f4553]/70 hover:border-gold/35 hover:shadow-[0_0_20px_rgba(224,176,52,0.1)]"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full flex-col items-center px-3 pb-2 pt-4 text-center"
      >
        <GemCluster size={clusterSize} />
        <p className="mt-2 text-base font-black leading-none tabular-nums tracking-tight text-white sm:text-lg">
          {gems.toLocaleString()}
        </p>
        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-muted">Gems</p>
        <span className="mt-2 inline-flex rounded-full border border-fuchsia/30 bg-fuchsia/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-fuchsia">
          +{ripsBonus.toLocaleString()} Rips Bonus
        </span>
      </button>
      <button
        type="button"
        disabled={processing}
        onClick={onPurchase}
        className={PRICE_BTN_CLASS}
      >
        ${bundle.priceUsd.toFixed(2)}
      </button>
    </article>
  );
}

export function PurchaseModal() {
  const {
    purchaseModalOpen,
    purchaseOpenedFromWallet,
    setPurchaseModalOpen,
    backToWalletFromGemRefill,
    isLoggedIn,
    openAuthModal,
    showCashoutToast,
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("crypto");
  const [selectedTierId, setSelectedTierId] = useState<string | null>(
    PURCHASE_BUNDLES[0]?.id ?? null,
  );
  const [customAmount, setCustomAmount] = useState("");
  const [affiliateCode, setAffiliateCode] = useState("");
  const [giftCode, setGiftCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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
    setSelectedTierId(PURCHASE_BUNDLES[0]?.id ?? null);
    setCustomAmount("");
    setAffiliateCode("");
    setGiftCode("");
    setProcessing(false);
    setPaymentError(null);
  }, []);

  useEffect(() => {
    if (!purchaseModalOpen) reset();
  }, [purchaseModalOpen, reset]);

  function handleClose() {
    setPurchaseModalOpen(false);
  }

  function handleBack() {
    backToWalletFromGemRefill();
  }

  const startCardPurchase = useCallback(
    async (_bundle: PurchaseBundle) => {
      if (processing) return;

      if (!isLoggedIn) {
        openAuthModal("login", { keepPurchaseModalOpen: true });
        return;
      }

      showCashoutToast("Card checkout is coming soon — use Crypto to refill now.");
    },
    [processing, isLoggedIn, openAuthModal, showCashoutToast],
  );

  function handleTierPurchase(bundle: PurchaseBundle) {
    setSelectedTierId(bundle.id);
    void startCardPurchase(bundle);
  }

  function handleCustomAmount() {
    if (!isValidAmount) return;
    void startCardPurchase(customAmountBundle(gemValue));
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

  if (!isLoggedIn) {
    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-auth-title"
        onClick={handleClose}
      >
        <div
          className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#213743] bg-[#1a2c38] shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <GemRefillModalHeader
            titleId="purchase-auth-title"
            showBack={purchaseOpenedFromWallet}
            onBack={handleBack}
            onClose={handleClose}
          />
          <div className="p-5">
            <CheckoutAuthGate />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-title"
      onClick={handleClose}
    >
      <div
        className={`relative flex max-h-[min(90vh,720px)] w-full flex-col overflow-hidden rounded-2xl border border-[#213743] bg-[#1a2c38] shadow-2xl ${
          paymentMethod === "crypto" ? "max-w-md" : "max-w-2xl lg:max-w-3xl"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <GemRefillModalHeader
          titleId="purchase-title"
          showBack={purchaseOpenedFromWallet}
          onBack={handleBack}
          onClose={handleClose}
        />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3 pb-4 lg:py-4 lg:pb-6">
          <div className="flex w-full flex-col gap-3 pb-0.5 lg:gap-5 lg:pb-1">
            <WalletOfferBanner compact />

            <div className="flex w-full flex-col gap-3 lg:flex-row lg:gap-6">
              <aside className="flex h-auto w-full shrink-0 gap-2 lg:w-36 lg:flex-col lg:gap-1 lg:pt-1">
                <PaymentTab
                  active={paymentMethod === "card"}
                  onSelect={() => setPaymentMethod("card")}
                  label="Credit / Debit"
                />
                <PaymentTab
                  active={paymentMethod === "crypto"}
                  onSelect={() => setPaymentMethod("crypto")}
                  label="Crypto"
                />
              </aside>

              <div className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-4">
                {paymentMethod === "crypto" ? (
                  <CryptoDepositPanel />
                ) : (
                  <>
                    {paymentError ? (
                      <p
                        className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-300"
                        role="alert"
                      >
                        {paymentError}
                      </p>
                    ) : null}

                    <div className="grid w-full grid-cols-2 items-start gap-3 sm:grid-cols-3">
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

                    <div className="flex w-full flex-col gap-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Custom amount
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={customAmount}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        placeholder="Enter gem amount"
                        maxLength={6}
                        className={INPUT_CLASS}
                      />
                      <button
                        type="button"
                        disabled={!isValidAmount || processing}
                        onClick={handleCustomAmount}
                        className={`${PRICE_BTN_CLASS} relative mt-1 disabled:opacity-50`}
                      >
                        {isValidAmount ? `Buy for $${calculatedPrice}` : "Select amount"}
                      </button>
                      <p className="text-[10px] text-muted/70">
                        Min {CUSTOM_GEM_MIN.toLocaleString()} · Max{" "}
                        {CUSTOM_GEM_MAX.toLocaleString()} gems
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {paymentMethod === "card" ? (
              <div className="grid w-full grid-cols-1 gap-4 border-t border-[#213743] pt-5 sm:grid-cols-2">
                <div className="flex w-full flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Affiliate code
                  </label>
                  <p className="text-[10px] text-fuchsia">Get 5% bonus gems</p>
                  <input
                    type="text"
                    value={affiliateCode}
                    onChange={(e) => setAffiliateCode(e.target.value)}
                    placeholder="Enter code"
                    className={INPUT_CLASS}
                  />
                  <button
                    type="button"
                    onClick={handleApplyAffiliate}
                    className="mt-1 flex min-h-[44px] h-auto w-full items-center justify-center rounded-md bg-[#ff007a] px-4 py-2.5 text-xs font-medium text-white transition-all hover:opacity-90"
                  >
                    Apply
                  </button>
                </div>

                <div className="flex w-full flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Gift code
                  </label>
                  <input
                    type="text"
                    value={giftCode}
                    onChange={(e) => setGiftCode(e.target.value)}
                    placeholder="Enter code"
                    className={INPUT_CLASS}
                  />
                  <button
                    type="button"
                    onClick={handleSubmitGift}
                    className="mt-1 flex min-h-[44px] h-auto w-full items-center justify-center rounded-md bg-[#ff007a] px-4 py-2.5 text-xs font-medium text-white transition-all hover:opacity-90"
                  >
                    Submit
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
