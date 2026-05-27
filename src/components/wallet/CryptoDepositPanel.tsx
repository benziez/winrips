import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "../icons/AppIcons";
import { useApp } from "../../context/AppContext";
import {
  CRYPTO_DEPOSIT_OPTIONS,
  MIN_CRYPTO_DEPOSIT_USD,
  findCryptoOption,
  gemsFromUsd,
  ripsFromUsd,
} from "../../constants/cryptoDeposit";
import { depositQrCodeUrl, requestDepositPayment } from "../../lib/paymentsApi";
import type { DepositPayCurrency, DepositPaymentResponse } from "../../types/payments";
import { CheckoutAuthGate } from "./CheckoutAuthGate";

const INPUT_CLASS =
  "w-full rounded-md border border-[#213743] bg-[#0f212e] px-3 py-2.5 text-sm font-medium text-white placeholder:text-muted/40 focus:border-fuchsia/50 focus:outline-none";

function CryptoTokenIcon({ id }: { id: DepositPayCurrency }) {
  const base =
    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black";

  if (id === "btc") {
    return (
      <span className={`${base} bg-[#f7931a]/20 text-[#f7931a]`} aria-hidden>
        ₿
      </span>
    );
  }
  if (id === "sol") {
    return (
      <span className={`${base} bg-[#9945ff]/20 text-[#14f195]`} aria-hidden>
        S
      </span>
    );
  }
  if (id === "ltc") {
    return (
      <span className={`${base} bg-slate-elevated text-muted`} aria-hidden>
        Ł
      </span>
    );
  }
  return (
    <span className={`${base} bg-slate-elevated text-muted`} aria-hidden>
      ?
    </span>
  );
}

const QR_SIZE_MOBILE = 175;
const QR_SIZE_DESKTOP = 200;

const QR_FRAME_CLASS =
  "flex h-[175px] w-[175px] items-center justify-center rounded-xl bg-white p-2 shadow-[0_0_24px_rgba(0,0,0,0.35)] lg:h-[200px] lg:w-[200px] lg:p-3";

const QR_IMAGE_CLASS = "h-[175px] w-[175px] lg:h-[200px] lg:w-[200px]";

function useQrPixelSize() {
  const [size, setSize] = useState(QR_SIZE_MOBILE);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setSize(mq.matches ? QR_SIZE_DESKTOP : QR_SIZE_MOBILE);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return size;
}

function DepositSummaryCard({
  usdAmount,
  gems,
  rips,
  loading,
}: {
  usdAmount: number;
  gems: number;
  rips: number;
  loading: boolean;
}) {
  return (
    <div
      className="w-full rounded-xl border border-[#213743] bg-[#1a1d24] px-4 py-2.5"
      aria-busy={loading}
    >
      <ul className="flex flex-col gap-y-1.5 text-sm">
        <li className="flex items-center justify-between gap-3">
          <span className="text-muted">Deposit Amount</span>
          <span className="font-semibold tabular-nums text-white">
            ${usdAmount.toFixed(2)} USD
          </span>
        </li>
        <li className="flex items-center justify-between gap-3">
          <span className="text-muted">You Receive</span>
          <span className="font-bold tabular-nums text-gold">
            {loading ? "…" : `${gems.toLocaleString()} Gems`}
          </span>
        </li>
        <li className="flex items-center justify-between gap-3 border-t border-[#213743]/80 pt-1.5">
          <span className="text-muted">Bonus Reward</span>
          <span className="font-bold tabular-nums text-fuchsia">
            {loading ? "…" : `${rips.toLocaleString()} Rips`}
          </span>
        </li>
      </ul>
      <p className="mt-1.5 text-center text-[10px] leading-relaxed text-muted/80">
        100% Rips match applied on every crypto deposit
      </p>
    </div>
  );
}

function QrCodeFrame({
  payAddress,
  payCurrency,
  loading,
  ticker,
}: {
  payAddress: string | null;
  payCurrency: DepositPayCurrency;
  loading: boolean;
  ticker: string;
}) {
  const showQr = Boolean(payAddress?.trim()) && !loading;
  const qrSize = useQrPixelSize();

  return (
    <div className={QR_FRAME_CLASS} aria-busy={loading || !showQr}>
      {showQr ? (
        <img
          key={`${payAddress}-${qrSize}`}
          src={depositQrCodeUrl(payAddress!, payCurrency, qrSize)}
          alt={`${ticker} deposit QR code`}
          width={qrSize}
          height={qrSize}
          loading="lazy"
          decoding="async"
          className={QR_IMAGE_CLASS}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-lg bg-[#0f212e]/10 px-4">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-[#213743] border-t-fuchsia"
            aria-hidden
          />
          <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted">
            {loading ? "Generating address…" : "Awaiting address"}
          </p>
        </div>
      )}
    </div>
  );
}

export function CryptoDepositPanel() {
  const {
    isLoggedIn,
    openAuthModal,
    userId,
    showCashoutToast,
    syncGemBalanceFromServer,
  } = useApp();

  const [payCurrency, setPayCurrency] = useState<DepositPayCurrency>("btc");
  const [usdAmount, setUsdAmount] = useState("50");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<DepositPaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  const usdValue = Number.parseFloat(usdAmount) || 0;
  const isValidUsd = usdValue >= MIN_CRYPTO_DEPOSIT_USD;
  const estimatedGems = gemsFromUsd(usdValue);
  const estimatedRips = ripsFromUsd(usdValue);
  const selected = findCryptoOption(payCurrency);
  const displayUsd = payment?.priceAmount ?? usdValue;
  const displayGems = payment ? gemsFromUsd(payment.priceAmount) : estimatedGems;
  const displayRips = payment ? ripsFromUsd(payment.priceAmount) : estimatedRips;

  const createDeposit = useCallback(async () => {
    if (!isValidUsd) return;

    if (!isLoggedIn || !userId) {
      openAuthModal("login", { keepPurchaseModalOpen: true });
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    setPayment(null);

    try {
      const result = await requestDepositPayment({
        priceAmount: usdValue,
        payCurrency,
        userId,
      });

      if (requestId !== requestIdRef.current) return;
      setPayment(result);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setPayment(null);
      setError(err instanceof Error ? err.message : "Unable to create deposit.");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [isValidUsd, isLoggedIn, userId, usdValue, payCurrency, openAuthModal]);

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      setPayment(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (!isValidUsd) {
      setPayment(null);
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      void createDeposit();
    }, 500);

    return () => window.clearTimeout(timer);
  }, [isLoggedIn, userId, payCurrency, usdAmount, isValidUsd, createDeposit]);

  useEffect(() => {
    if (!payment) return;

    const poll = () => void syncGemBalanceFromServer(userId);
    poll();
    const intervalId = window.setInterval(poll, 5000);
    return () => window.clearInterval(intervalId);
  }, [payment, syncGemBalanceFromServer, userId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  function handleUsdChange(raw: string) {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    const normalized =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
    setUsdAmount(normalized);
  }

  if (!isLoggedIn || !userId) {
    return <CheckoutAuthGate />;
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-auto min-h-[44px] w-full items-center justify-between gap-3 rounded-md bg-[#0f212e] px-3 py-2 transition-colors hover:bg-[#0f212e]/80"
          aria-expanded={menuOpen}
          aria-haspopup="listbox"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <CryptoTokenIcon id={payCurrency} />
            <span className="min-w-0 text-left">
              <span className="block text-sm font-bold text-white">{selected.ticker}</span>
              <span className="block text-[10px] text-muted">{selected.network}</span>
            </span>
          </span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-muted transition-transform duration-200 ${
              menuOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {menuOpen ? (
          <ul
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-md bg-[#1a2c38] py-1 shadow-xl ring-1 ring-[#213743]"
          >
            {CRYPTO_DEPOSIT_OPTIONS.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={payCurrency === option.id}
                  onClick={() => {
                    setPayCurrency(option.id);
                    setMenuOpen(false);
                    setPayment(null);
                    setError(null);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                    payCurrency === option.id
                      ? "bg-fuchsia/10 text-white"
                      : "text-muted hover:bg-[#0f212e] hover:text-white"
                  }`}
                >
                  <CryptoTokenIcon id={option.id} />
                  <span>
                    <span className="block text-sm font-semibold">{option.ticker}</span>
                    <span className="block text-[10px]">{option.network}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex w-full flex-col gap-1">
        <label
          htmlFor="crypto-deposit-amount"
          className="text-[10px] font-semibold uppercase tracking-wider text-muted"
        >
          Amount (USD)
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
            $
          </span>
          <input
            id="crypto-deposit-amount"
            type="text"
            inputMode="decimal"
            value={usdAmount}
            onChange={(e) => handleUsdChange(e.target.value)}
            placeholder="0.00"
            className={`${INPUT_CLASS} pl-7`}
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-md bg-red-500/10 px-3 py-1.5 text-xs text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      {isValidUsd && !error ? (
        <div className="flex w-full flex-col items-center gap-3">
          <DepositSummaryCard
            usdAmount={displayUsd}
            gems={displayGems}
            rips={displayRips}
            loading={loading}
          />

          {payment?.payAddress && !loading ? (
            <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted">
              Send {payment.payAmount > 0 ? payment.payAmount : "—"}{" "}
              {selected.ticker.toUpperCase()} to the address below
            </p>
          ) : null}

          <QrCodeFrame
            payAddress={payment?.payAddress ?? null}
            payCurrency={payCurrency}
            loading={loading}
            ticker={selected.ticker}
          />

          <div className="w-full">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
              Deposit address
            </label>
            <div className="flex items-stretch gap-0 overflow-hidden rounded-md border border-[#213743] bg-[#0f212e]">
              <input
                type="text"
                readOnly
                value={loading ? "" : (payment?.payAddress ?? "")}
                placeholder={loading ? "Generating address…" : "—"}
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 font-mono text-[11px] leading-relaxed text-white placeholder:text-muted/50 focus:outline-none"
                aria-label="Deposit address"
                aria-busy={loading}
              />
              <button
                type="button"
                onClick={handleCopyAddress}
                disabled={loading || !payment?.payAddress}
                className="flex shrink-0 items-center gap-1.5 border-l border-[#213743] bg-[#1a2c38] px-3 text-[10px] font-bold uppercase tracking-wider text-fuchsia transition-colors hover:bg-fuchsia/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {payment?.orderId && !loading ? (
            <p className="max-w-xs text-center text-[9px] leading-relaxed text-muted/60">
              Ref <span className="font-mono text-muted/80">{payment.orderId}</span> · Credits
              after network confirmation
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
