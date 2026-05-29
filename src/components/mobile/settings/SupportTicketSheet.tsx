import { useEffect, useState } from "react";
import { useApp } from "../../../context/AppContext";
import { useAuth } from "../../../context/AuthContext";
import { submitSupportTicket } from "../../../lib/supportTickets";
import { RipBottomSheet } from "../rip/RipBottomSheet";
import { hapticTabSelect } from "../../../utils/mobileHaptics";

interface SupportTicketSheetProps {
  open: boolean;
  onClose: () => void;
}

export function SupportTicketSheet({ open, onClose }: SupportTicketSheetProps) {
  const { profileUsername, showCashoutToast, showErrorToast } = useApp();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubmitted(false);
    setName(profileUsername?.trim() || user?.user_metadata?.username?.trim() || "");
    setEmail(user?.email?.trim() || "");
    setSubject("");
    setMessage("");
  }, [open, profileUsername, user?.email, user?.user_metadata?.username]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (submitting || submitted) return;
    void hapticTabSelect();
    setSubmitting(true);

    const result = await submitSupportTicket({ name, email, subject, message });
    setSubmitting(false);

    if (!result.ok) {
      showErrorToast(result.error);
      return;
    }

    setSubmitted(true);
    showCashoutToast("We'll get back to you within 24 hours.");
  };

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-[var(--rip-border)] bg-[var(--rip-surface)] px-4 py-3 text-[16px] text-white placeholder:text-[var(--rip-text-muted)] outline-none focus:border-[var(--rip-orange)]";

  return (
    <RipBottomSheet open={open} onClose={handleClose} heightClass="h-auto max-h-[92dvh]" zIndex={120}>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-14">
        <div className="px-6">
          <h2 className="text-[26px] font-bold text-white">Contact Support</h2>
          <p className="mt-1 text-[15px] text-[var(--rip-text-muted)]">
            Questions or concerns about your account or pulls
          </p>
        </div>

        {submitted ? (
          <div className="mt-8 px-6">
            <p className="text-[17px] leading-relaxed text-white">
              Thanks — your message was sent. We&apos;ll get back to you within 24 hours.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-[var(--rip-orange)] text-[16px] font-bold text-white active:bg-[var(--rip-orange-pressed)]"
            >
              Done
            </button>
          </div>
        ) : (
          <form
            className="mt-6 space-y-4 px-6"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            <label className="block">
              <span className="text-[13px] font-medium text-[var(--rip-text-muted)]">Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
                autoComplete="name"
                disabled={submitting}
              />
            </label>

            <label className="block">
              <span className="text-[13px] font-medium text-[var(--rip-text-muted)]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                autoComplete="email"
                inputMode="email"
                disabled={submitting}
              />
            </label>

            <label className="block">
              <span className="text-[13px] font-medium text-[var(--rip-text-muted)]">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className={inputClass}
                disabled={submitting}
              />
            </label>

            <label className="block">
              <span className="text-[13px] font-medium text-[var(--rip-text-muted)]">Message</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className={`${inputClass} min-h-[120px] resize-y`}
                rows={5}
                disabled={submitting}
              />
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="flex h-12 flex-1 items-center justify-center rounded-full border border-[var(--rip-border)] text-[16px] font-semibold text-white active:bg-white/5 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-[var(--rip-orange)] text-[16px] font-bold text-white active:bg-[var(--rip-orange-pressed)] disabled:opacity-40"
              >
                {submitting ? "Sending…" : "Send Message"}
              </button>
            </div>
          </form>
        )}
      </div>
    </RipBottomSheet>
  );
}
