import { useCallback, useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { depositQrCodeUrl, requestDepositPayment } from "../../lib/paymentsApi";
import { CRYPTO_DEPOSIT_OPTIONS } from "../../constants/cryptoDeposit";
import type { DepositPayCurrency, DepositPaymentResponse } from "../../types/payments";
import { CheckoutAuthGate } from "../wallet/CheckoutAuthGate";

const USD_PRESETS = [25, 50, 100, 250] as const;

export function DepositModal() {
  const {
    depositModalOpen,
    setDepositModalOpen,
    isLoggedIn,
    userId,
    showCashoutToast,
    syncGemBalanceFromServer,
  } = useApp();

  const [usdAmount, setUsdAmount] = useState(50);
  const [selectedAsset, setSelectedAsset] = useState<DepositPayCurrency | null>(null);
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<DepositPaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = useCallback(() => {
    setUsdAmount(50);
    setSelectedAsset(null);
    setLoading(false);
    setPayment(null);
    setError(null);
    setCopied(false);
  }, []);

  useEffect(() => {
    if (!depositModalOpen) reset();
  }, [depositModalOpen, reset]);

  useEffect(() => {
    if (!depositModalOpen || !payment) return;

    const pollBalance = () => {
      void syncGemBalanceFromServer();
    };

    pollBalance();
    const intervalId = window.setInterval(pollBalance, 5000);
    return () => window.clearInterval(intervalId);
  }, [depositModalOpen, payment, syncGemBalanceFromServer]);

  function handleClose() {
    setDepositModalOpen(false);
  }

  async function handleSelectAsset(payCurrency: DepositPayCurrency) {
    if (!isLoggedIn || !userId) return;

    setSelectedAsset(payCurrency);
    setLoading(true);
    setError(null);
    setPayment(null);

    try {
      const result = await requestDepositPayment({
        priceAmount: usdAmount,
        payCurrency,
        userId,
      });
      setPayment(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit request failed.");
    } finally {
      setLoading(false);
    }
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

  if (!depositModalOpen) return null;

  if (!isLoggedIn || !userId) {
    return (
      <div
        className="fixed inset-0 z-[75] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deposit-modal-title"
      >
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#22242B] bg-[#0D0E12]/95 p-5 shadow-[0_0_50px_rgba(0,0,0,0.85)]">
          <CheckoutAuthGate />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deposit-modal-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#22242B] bg-[#0D0E12]/95 shadow-[0_0_50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-[#FF007F]" aria-hidden />

        <div className="flex items-start justify-between border-b border-[#22242B] px-5 py-4">
          <div>
            <h2 id="deposit-modal-title" className="text-base font-black uppercase tracking-[0.18em] text-white">
              Crypto Deposit
            </h2>
            <p className="mt-1 text-xs text-[#A0A5B5]">Fund your vault via NOWPayments</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-lg text-[#A0A5B5] transition-colors hover:bg-[#1A1C20] hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 p-5">
          {!payment ? (
            <>
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#A0A5B5]">
                  Deposit amount (USD)
                </p>
                <div className="mb-2 grid grid-cols-4 gap-2">
                  {USD_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setUsdAmount(preset)}
                      className={`rounded-md border py-2 text-xs font-bold transition-colors ${
                        usdAmount === preset
                          ? "border-[#FF007F] bg-[#FF007F]/10 text-white"
                          : "border-[#22242B] bg-[#111215] text-[#A0A5B5] hover:border-[#FF007F]/40"
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={usdAmount}
                  onChange={(e) => setUsdAmount(Number(e.target.value) || 0)}
                  className="h-11 w-full rounded-lg border border-[#22242B] bg-[#090A0D] px-3 text-center text-sm font-bold text-white outline-none focus:border-[#FF007F] focus:shadow-[0_0_15px_rgba(255,0,127,0.15)]"
                />
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#A0A5B5]">
                  Select asset
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {CRYPTO_DEPOSIT_OPTIONS.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      disabled={loading || usdAmount < 1}
                      onClick={() => handleSelectAsset(asset.id)}
                      className={`rounded-xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                        selectedAsset === asset.id
                          ? "border-[#FF007F] bg-[#FF007F]/5"
                          : "border-[#22242B] bg-[#111215] hover:border-[#FF007F]/50"
                      }`}
                    >
                      <p className="text-sm font-bold text-white">{asset.ticker}</p>
                      <p className="mt-0.5 text-[10px] font-mono uppercase tracking-wider text-[#FF007F]">
                        {asset.network}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {loading && (
                <p className="text-center text-xs font-medium text-[#FF007F]">Generating deposit address…</p>
              )}
              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300" role="alert">
                  {error}
                </p>
              )}
            </>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A5B5]">
                Send {payment.payCurrency.toUpperCase()} — ${payment.priceAmount.toFixed(2)} USD
              </p>

              <div className="mx-auto inline-block rounded-xl border border-[#22242B] bg-white p-3">
                <img
                  src={depositQrCodeUrl(payment.payAddress, payment.payCurrency, 220)}
                  alt={`QR code for ${payment.payCurrency} deposit`}
                  width={220}
                  height={220}
                  loading="lazy"
                  decoding="async"
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
                  className="group w-full rounded-lg border border-[#22242B] bg-[#090A0D] p-3 text-left transition-colors hover:border-[#FF007F]/50"
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
                automatically after NOWPayments confirms your transfer (typically 1–3 confirmations).
              </p>

              <button
                type="button"
                onClick={reset}
                className="text-xs font-semibold uppercase tracking-wider text-[#A0A5B5] transition-colors hover:text-[#FF007F]"
              >
                Choose another asset
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
