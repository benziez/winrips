import { useEffect, useState } from "react";
import type { FairnessSession } from "../../utils/provablyFair";
import { ShieldIcon } from "../icons/AppIcons";

interface FairnessVerifyModalProps {
  session: FairnessSession;
  packLabel: string;
  onClose: () => void;
  onVerify: () => void;
}

function formatRollPercent(rolledNumber?: number): string | null {
  if (rolledNumber == null) return null;
  return `${rolledNumber.toFixed(3)}%`;
}

export function FairnessVerifyModal({
  session,
  packLabel,
  onClose,
  onVerify,
}: FairnessVerifyModalProps) {
  const [copied, setCopied] = useState(false);
  const rollLabel = formatRollPercent(session.rolledNumber);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyHash() {
    try {
      await navigator.clipboard.writeText(session.commitmentHash);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fairness-verify-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-border bg-slate shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                <ShieldIcon size={16} className="text-emerald-400" />
              </div>
              <div>
                <h2 id="fairness-verify-title" className="text-base font-bold text-white">
                  Fairness Verified
                </h2>
                <p className="mt-0.5 text-xs text-muted">{packLabel}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md border border-border px-2.5 py-1 text-sm text-muted transition-colors hover:border-fuchsia/40 hover:text-white"
              aria-label="Close verification"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
              Commitment Hash
            </p>
            <code className="mt-1.5 block max-h-24 overflow-y-auto rounded-lg border border-border bg-obsidian px-3 py-2.5 font-mono text-[11px] leading-relaxed text-cyan break-all select-all">
              {session.commitmentHash}
            </code>
            <button
              type="button"
              onClick={() => void copyHash()}
              className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted transition-colors hover:text-white"
            >
              {copied ? "Copied" : "Copy hash"}
            </button>
          </div>

          {rollLabel ? (
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-slate-elevated/40 px-3 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                Roll result
              </span>
              <span className="font-mono text-sm tabular-nums text-white">{rollLabel}</span>
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-muted">
              Hash committed before your unlock. After a spin, the roll result is sealed into this
              record for independent verification.
            </p>
          )}

          <button
            type="button"
            onClick={onVerify}
            className="w-full rounded-lg bg-[#FF007F] px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}
