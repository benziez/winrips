import { useState } from "react";
import type { FooterPageSlug } from "../../constants/footerContent";
import { WinRipsLogo } from "../brand/WinRipsLogo";
import { persistTermsAccepted } from "../../constants/termsAcknowledgment";
import { InfoSheet } from "../mobile/settings/InfoSheet";

const ACKNOWLEDGMENTS = [
  <>
    I acknowledge that I must be <strong className="font-bold text-white">over 18</strong> and have a
    valid government ID to withdraw funds. Only adults (those over 18) may process transactions.
  </>,
  <>
    I have not created or used additional WinRips accounts on this device. I understand that any
    attempt to create more than one account is basis for immediate termination and forfeiture of all
    associated balances.
  </>,
  <>
    Information provided is accurate and users must have a personal{" "}
    <strong className="font-bold text-white">United States</strong> phone number.
  </>,
] as const;

interface TermsAcknowledgmentScreenProps {
  onAccepted: () => void;
}

export function TermsAcknowledgmentScreen({ onAccepted }: TermsAcknowledgmentScreenProps) {
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [infoSheetKey, setInfoSheetKey] = useState<FooterPageSlug | null>(null);

  const handleContinue = () => {
    if (!termsAccepted) return;
    persistTermsAccepted(marketingOptIn);
    onAccepted();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-black text-white"
      data-shell="mobile"
    >
      <div
        className="flex flex-1 flex-col overflow-y-auto px-6"
        style={{
          paddingTop: "max(1.5rem, env(safe-area-inset-top))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex flex-col items-center pt-4">
          <WinRipsLogo className="block h-14 w-auto object-contain" maxWidth={260} />
          <h1 className="mt-8 text-center text-[28px] font-bold tracking-tight text-white">
            Terms of Use
          </h1>
        </div>

        <ol className="mt-8 space-y-5">
          {ACKNOWLEDGMENTS.map((statement, index) => (
            <li key={index} className="flex gap-3 text-[15px] leading-relaxed text-white/85">
              <span className="mt-0.5 shrink-0 text-sm font-semibold text-white/50">{index + 1}.</span>
              <span>{statement}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8 space-y-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(event) => setMarketingOptIn(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 bg-transparent accent-[#FF007F]"
            />
            <span className="text-[14px] leading-snug text-white/80">
              I agree to receive special offers and other marketing messages from WinRips.
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 bg-transparent accent-[#FF007F]"
            />
            <span className="text-[14px] leading-snug text-white/80">
              I agree to WinRips&apos;{" "}
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  setInfoSheetKey("terms");
                }}
                className="font-semibold text-[#FF007F] underline underline-offset-2"
              >
                Terms and Conditions
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  setInfoSheetKey("privacy");
                }}
                className="font-semibold text-[#FF007F] underline underline-offset-2"
              >
                Privacy Policy
              </button>
            </span>
          </label>
        </div>

        <div className="mt-auto pt-8">
          <button
            type="button"
            disabled={!termsAccepted}
            onClick={handleContinue}
            className="w-full rounded-xl bg-[#FF007F] py-4 text-[15px] font-bold tracking-wide text-white shadow-[0_0_32px_rgba(255,0,127,0.25)] transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-white/45">
            * Consent is not a condition of use. Message rates may apply.
          </p>
        </div>
      </div>

      <InfoSheet
        open={infoSheetKey !== null}
        onClose={() => setInfoSheetKey(null)}
        contentKey={infoSheetKey}
      />
    </div>
  );
}
