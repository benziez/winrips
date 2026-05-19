import { UtilityPageShell } from "./UtilityPageShell";

export function FairnessView() {
  return (
    <UtilityPageShell
      eyebrow="Provably Fair Hub"
      title="Provably Fair Verification"
      description="Verify that every unboxing transaction is random, immutable, and tamper-proof using cryptographic hashing."
    >
      <section className="card-pack rounded-xl p-5 sm:p-6 space-y-4 mb-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Cryptographic Mechanism
        </h2>
        <p className="text-xs text-muted leading-relaxed">
          The platform combines a committed server seed, your client seed, and a per-transaction
          nonce. Neither you nor the operator can predict or alter the outcome after an unlock
          request is submitted.
        </p>
        <div className="rounded-lg bg-obsidian border border-border p-4 text-center">
          <code className="text-[10px] sm:text-xs text-cyan font-mono select-all break-all">
            CalculatedRoll = HMAC-SHA512(ServerSeed + ClientSeed + Nonce) % TotalWeight
          </code>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Before you unlock a drop, you receive a hashed commitment of the server seed. After the
          transaction completes, the unhashed seed is revealed so you can verify the exact outcome
          on independent scripts.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="card-pack rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Server Seed Hash</h2>
          <code className="block rounded-lg bg-obsidian border border-border p-3 text-xs text-muted font-mono break-all">
            8f3a9c2e1b7d4f6a0e8c5b2d9f1a3e7c4b8d0f2a6e9c1b5d8f0a3e7c2b9d4f6
          </code>
          <p className="text-xs text-muted">
            Revealed after session close. Compare against your client seed to verify pull outcomes.
          </p>
        </section>
        <section className="card-pack rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Your Client Seed</h2>
          <code className="block rounded-lg bg-obsidian border border-border p-3 text-xs text-fuchsia font-mono break-all">
            player_md_7xKp9mN2vR4sT8wQ
          </code>
          <button
            type="button"
            className="text-xs font-bold text-fuchsia hover:underline uppercase tracking-wide"
          >
            Rotate Seed
          </button>
        </section>
      </div>
    </UtilityPageShell>
  );
}
