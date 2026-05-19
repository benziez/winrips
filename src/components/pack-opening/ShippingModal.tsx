import { useState, type FormEvent } from "react";
import { Button } from "../ui/Button";

interface ShippingModalProps {
  itemName: string;
  onClose: () => void;
  onSubmit: () => void;
}

export function ShippingModal({ itemName, onClose, onSubmit }: ShippingModalProps) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onSubmit();
    }, 1200);
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg bg-obsidian border border-border text-white text-sm placeholder:text-muted focus:border-fuchsia/50 focus:outline-none";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-xl card-pack p-5 sm:p-6">
        <h3 className="text-base font-bold text-white mb-1">Request Delivery</h3>
        <p className="text-sm text-muted mb-1">{itemName}</p>
        <p className="text-xs text-muted/80 mb-5">
          Enter your verified shipping address for insured physical fulfillment.
        </p>

        {submitted ? (
          <div className="text-center py-8">
            <span className="text-4xl">📦</span>
            <p className="mt-3 text-fuchsia font-semibold text-sm">Shipping request submitted!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input required placeholder="Full name" className={inputClass} />
            <input required placeholder="Street address" className={inputClass} />
            <div className="grid grid-cols-2 gap-2">
              <input required placeholder="City" className={inputClass} />
              <input required placeholder="ZIP" className={inputClass} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="open" className="flex-1">
                Confirm Ship
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
