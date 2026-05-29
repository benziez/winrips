import { useEffect, useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import { fetchProfileReferralCode } from "../../lib/referrals";
import { MOBILE_DOCK_CLEARANCE } from "./MobileFloatingDock";
import { RipAmbientShell } from "./rip/RipAmbientShell";
import { BalancePill } from "./rip/BalancePill";
import { AddFundsModal } from "./rip/AddFundsModal";
import { GiftIcon } from "../icons/AppIcons";
import { hapticTabSelect } from "../../utils/mobileHaptics";
import { copyToClipboard } from "../../utils/copyToClipboard";
import {
  REFERRAL_SIGNUP_BONUS_USD,
  referralCodeForUserId,
  referralShareUrl,
} from "../../utils/referralCode";

export function MobileReferView() {
  const { userId, showCashoutToast } = useApp();
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [code, setCode] = useState(() => (userId ? referralCodeForUserId(userId) : "WR-GUEST"));

  useEffect(() => {
    if (!userId) {
      setCode("WR-GUEST");
      return;
    }

    let cancelled = false;
    void fetchProfileReferralCode(userId).then((nextCode) => {
      if (!cancelled && nextCode) {
        setCode(nextCode);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const shareUrl = useMemo(() => referralShareUrl(code), [code]);

  async function copyCode() {
    void hapticTabSelect();
    const copied = await copyToClipboard(code);
    showCashoutToast(copied ? "Referral code copied." : "Could not copy — select and copy manually.");
  }

  async function shareCode() {
    void hapticTabSelect();
    const text = `Join WinRips with my code ${code} — we both get $${REFERRAL_SIGNUP_BONUS_USD}!`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "WinRips Referral",
          text,
          url: shareUrl,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    const copied = await copyToClipboard(`${text} ${shareUrl}`);
    showCashoutToast(
      copied ? "Referral link copied." : "Could not share — copy your code manually.",
    );
  }

  return (
    <RipAmbientShell>
      <header
        className="flex shrink-0 justify-end px-6 pb-3"
        style={{ paddingTop: "calc(max(0.5rem, env(safe-area-inset-top)) + 0.5rem)" }}
      >
        <BalancePill onAddFunds={() => setAddFundsOpen(true)} />
      </header>

      <div
        className="flex flex-1 flex-col px-6"
        style={{ paddingBottom: MOBILE_DOCK_CLEARANCE }}
      >
        <h1 className="text-[30px] font-bold text-white">Refer Friends</h1>

        <div className="mt-10 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--rip-surface)]">
            <GiftIcon size={32} className="text-[var(--rip-green-bright)]" />
          </div>
          <h2 className="mt-6 text-[22px] font-bold text-white">
            Give ${REFERRAL_SIGNUP_BONUS_USD}, Get ${REFERRAL_SIGNUP_BONUS_USD}
          </h2>
          <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-[var(--rip-text-muted)]">
            Share your code with friends. When they sign up with your code, you both earn bonus
            credit.
          </p>
        </div>

        <div className="mt-10 rounded-2xl bg-[var(--rip-surface)] px-5 py-5 text-center">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--rip-text-muted)]">
            Your code
          </p>
          <p className="mt-2 font-mono text-[28px] font-bold tracking-wider text-white">{code}</p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => void copyCode()}
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-[var(--rip-surface-strong)] text-[14px] font-semibold text-white"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => void shareCode()}
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-[var(--rip-green)] text-[14px] font-semibold text-white"
            >
              Share
            </button>
          </div>
        </div>
      </div>

      <AddFundsModal open={addFundsOpen} onClose={() => setAddFundsOpen(false)} />
    </RipAmbientShell>
  );
}
