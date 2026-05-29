import { APP_SHELL_BG } from "./mobileShellTheme";
import { persistShippingNoticeSeen } from "../../constants/shippingNotice";

interface USShippingModalProps {
  open: boolean;
  onDismiss: () => void;
}

export function USShippingModal({ open, onDismiss }: USShippingModalProps) {
  if (!open) return null;

  function handleDismiss() {
    persistShippingNoticeSeen();
    onDismiss();
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="us-shipping-title"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
        style={{ background: APP_SHELL_BG }}
      >
        <div className="text-4xl" aria-hidden>
          🌎
        </div>
        <h2 id="us-shipping-title" className="mt-4 text-xl font-bold text-white">
          US-Only Shipping
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-[#A1A1AA]">
          We currently only ship physical cards to US addresses. International users can still vault
          their cards.
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          className="mt-6 w-full rounded-xl bg-[#FF007F] py-3.5 text-[15px] font-bold tracking-wide text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
