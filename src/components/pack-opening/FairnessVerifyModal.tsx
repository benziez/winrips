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

function buildVerificationPayload(session: FairnessSession): string | null {
  if (session.serverSeed == null || session.rolledNumber == null) return null;
  return JSON.stringify(
    {
      serverSeed: session.serverSeed,
      clientSeed: session.clientSeed,
      nonce: session.nonce,
      packId: session.packId,
      roll: session.rolledNumber,
    },
    null,
    2,
  );
}

export function FairnessVerifyModal({
  session,
  packLabel,
  onClose,
  onVerify,
}: FairnessVerifyModalProps) {
  const [hashCopied, setHashCopied] = useState(false);
  const [payloadCopied, setPayloadCopied] = useState(false);
  const rollLabel = formatRollPercent(session.rolledNumber);
  const canCopyPayload = buildVerificationPayload(session) != null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!hashCopied) return;
    const timer = window.setTimeout(() => setHashCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [hashCopied]);

  useEffect(() => {
    if (!payloadCopied) return;
    const timer = window.setTimeout(() => setPayloadCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [payloadCopied]);

  async function copyHash() {
    try {
      await navigator.clipboard.writeText(session.serverSeedHash);
      setHashCopied(true);
    } catch {
      setHashCopied(false);
    }
  }

  async function copyVerificationPayload() {
    const payload = buildVerificationPayload(session);
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload);
      setPayloadCopied(true);
    } catch {
      setPayloadCopied(false);
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
              Server Seed Hash (Pre-Commit)
            </p>
            <code className="mt-1.5 block max-h-24 overflow-y-auto rounded-lg border border-border bg-obsidian px-3 py-2.5 font-mono text-[11px] leading-relaxed text-cyan break-all select-all">
              {session.serverSeedHash}
            </code>
            <button
              type="button"
              onClick={() => void copyHash()}
              className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted transition-colors hover:text-white"
            >
              {hashCopied ? "Copied" : "Copy hash"}
            </button>
          </div>

          {rollLabel ? (
            <div className="space-y-2 rounded-lg border border-border/60 bg-slate-elevated/40 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  Roll result
                </span>
                <span className="font-mono text-sm tabular-nums text-white">{rollLabel}</span>
              </div>
              {session.serverSeed ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                    Revealed Server Seed
                  </p>
                  <code className="block max-h-20 overflow-y-auto rounded border border-border bg-obsidian px-2 py-1.5 font-mono text-[10px] leading-relaxed text-fuchsia break-all select-all">
                    {session.serverSeed}
                  </code>
                </>
              ) : null}
              {session.proofHash ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                    Proof Hash
                  </p>
                  <code className="block max-h-20 overflow-y-auto rounded border border-border bg-obsidian px-2 py-1.5 font-mono text-[10px] leading-relaxed text-cyan break-all select-all">
                    {session.proofHash}
                  </code>
                </>
              ) : null}
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-muted">
              Hash committed before your unlock. After you open a pack, the roll result is sealed into this
              record for independent verification.
            </p>
          )}

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => void copyVerificationPayload()}
              disabled={!canCopyPayload}
              className="w-full rounded-lg border border-fuchsia-500/50 bg-slate-800 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {payloadCopied ? "Payload Copied" : "Copy Verification Payload"}
            </button>
            <p className="text-center text-[11px] leading-relaxed text-muted">
              Copy this data to verify your result in any external provably fair calculator.
            </p>
          </div>

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
