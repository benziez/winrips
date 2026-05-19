import { useMemo, useState } from "react";
import { MOCK_VAULT } from "../data/vault";
import { useApp } from "../context/AppContext";
import { UPGRADER_TARGET_POOL } from "../constants/upgraderTargets";
import { formatGems } from "../constants/retail";
import { RarityBadge } from "../components/ui/RarityBadge";
import { CollectibleImage } from "../components/ui/CollectibleImage";
import type { VaultedCard } from "../types";

function formatUpgradeOdds(deposit: VaultedCard | null, target: VaultedCard | null): string {
  if (!deposit || !target || target.value <= 0) {
    return "Select assets to compute upgrade probability.";
  }
  const odds = Math.min((deposit.value / target.value) * 100, 100);
  return `${odds.toFixed(2)}%`;
}

function computeUpgradeOddsPercent(deposit: VaultedCard, target: VaultedCard): number {
  return Math.min((deposit.value / target.value) * 100, 100);
}

function CircularProgressGauge({
  deposit,
  target,
}: {
  deposit: VaultedCard | null;
  target: VaultedCard | null;
}) {
  const percent =
    deposit && target && target.value > 0
      ? computeUpgradeOddsPercent(deposit, target)
      : 0;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const oddsLabel = formatUpgradeOdds(deposit, target);
  const hasSelection = Boolean(deposit && target);

  return (
    <div className="relative flex h-44 w-44 items-center justify-center sm:h-48 sm:w-48">
      <svg
        className="h-full w-full -rotate-90"
        viewBox="0 0 128 128"
        aria-hidden
      >
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="#1c1d24"
          strokeWidth="11"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="#FF007F"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={hasSelection ? offset : circumference}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
          style={{
            filter: "drop-shadow(0 0 14px rgba(255, 0, 127, 0.5))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <span
          className={`font-black tabular-nums leading-none text-white ${
            hasSelection
              ? "text-2xl sm:text-3xl"
              : "text-[11px] font-semibold normal-case tracking-normal text-slate-300"
          }`}
        >
          {oddsLabel}
        </span>
        {hasSelection && (
          <span className="mt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#FF007F]">
            Success Probability
          </span>
        )}
      </div>
    </div>
  );
}

function DepositMapTile({
  card,
  selected,
  onSelect,
}: {
  card: VaultedCard;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all ${
        selected
          ? "border-[#FF007F]/60 bg-[#FF007F]/10 shadow-[0_0_24px_rgba(255,0,127,0.28)] ring-2 ring-[#FF007F]/40"
          : "border-border bg-[#0A0A0C]/80 hover:border-[#FF007F]/30 hover:bg-metallic/40"
      }`}
    >
      <div className="flex h-20 items-center justify-center border-b border-border bg-[#0A0A0C] p-1.5 sm:h-28 sm:p-2">
        <CollectibleImage
          src={card.image}
          alt={card.name}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="space-y-0.5 p-2.5 text-left">
        <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-white">
          {card.name}
        </p>
        <p className="text-[10px] font-bold tabular-nums text-gold">{formatGems(card.value)}</p>
      </div>
      {selected && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF007F] text-[10px] font-bold text-white">
          ✓
        </span>
      )}
    </button>
  );
}

function TargetGrailTile({
  card,
  selected,
  onSelect,
}: {
  card: VaultedCard;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full flex-col overflow-hidden rounded-xl border text-left transition-all ${
        selected
          ? "border-[#FF007F]/60 bg-[#FF007F]/5 shadow-[0_0_24px_rgba(255,0,127,0.28)] ring-2 ring-[#FF007F]/40"
          : "border-border bg-[#0A0A0C]/60 hover:border-[#FF007F]/25"
      }`}
    >
      <div className="flex h-24 items-center justify-center border-b border-border bg-[#0A0A0C] p-2 sm:h-36 sm:p-3">
        <CollectibleImage
          src={card.image}
          alt={card.name}
          className="h-full w-full object-contain"
        />
      </div>
      <div className="space-y-1.5 p-3">
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-white">
          {card.name}
        </p>
        <p className="text-xs font-bold tabular-nums text-gold">{formatGems(card.value)}</p>
        <RarityBadge rarity={card.rarity} />
      </div>
    </button>
  );
}

export function UpgraderView() {
  const { vaultItems, removeVaultCard, addVaultCard, showCashoutToast, navigateToView } =
    useApp();

  const [selectedDepositCard, setSelectedDepositCard] = useState<VaultedCard | null>(null);
  const [targetGrailCard, setTargetGrailCard] = useState<VaultedCard | null>(null);
  const [executing, setExecuting] = useState(false);

  const depositInventory = vaultItems.length > 0 ? vaultItems : MOCK_VAULT;

  const successPercent = useMemo(() => {
    if (!selectedDepositCard || !targetGrailCard) return 0;
    return computeUpgradeOddsPercent(selectedDepositCard, targetGrailCard);
  }, [selectedDepositCard, targetGrailCard]);

  const canExecute = Boolean(selectedDepositCard && targetGrailCard && !executing);

  function handleExecute() {
    if (!selectedDepositCard || !targetGrailCard || executing) return;
    setExecuting(true);

    const roll = Math.random() * 100;
    const success = roll <= successPercent;

    setTimeout(() => {
      removeVaultCard(selectedDepositCard.vaultId);
      if (success) {
        addVaultCard({
          ...targetGrailCard,
          vaultId: `vault-${Date.now()}`,
          acquiredAt: "just now",
        });
        showCashoutToast(
          `Upgrade successful — ${targetGrailCard.name} has been added to your vault locker.`,
        );
      } else {
        showCashoutToast(
          `Trade-in processed — ${selectedDepositCard.name} was consumed. Target asset not acquired this attempt.`,
        );
      }
      setSelectedDepositCard(null);
      setTargetGrailCard(null);
      setExecuting(false);
    }, 900);
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-6 max-w-3xl border-b border-border pb-5 sm:mb-8 sm:pb-6">
        <h1 className="text-xl font-black uppercase tracking-tight text-white sm:text-3xl">
          Collection Upgrader
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Trade in your low-tier inventory to unlock premium, high-value collection assets.
        </p>
      </header>

      <div className="grid w-full grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,320px)_minmax(0,1fr)] xl:items-stretch">
        <section className="flex min-h-0 flex-col rounded-xl border border-border bg-[#121318] p-3 sm:min-h-[420px] sm:p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Inventory Deposit
          </h2>
          <p className="mt-1 mb-4 text-[11px] leading-relaxed text-muted">
            Tap a vaulted card to assign it as your active trade-in deposit.
          </p>

          {depositInventory.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted">No vaulted inventory available.</p>
              <button
                type="button"
                onClick={() => navigateToView("vault")}
                className="mt-3 text-sm font-semibold text-[#FF007F] hover:underline"
              >
                Open Your Vault
              </button>
            </div>
          ) : (
            <div
              className="grid max-h-[min(420px,50vh)] flex-1 grid-cols-2 gap-2 overflow-y-auto overflow-x-hidden pr-0 sm:max-h-[min(520px,58vh)] sm:grid-cols-3 sm:pr-1 xl:grid-cols-2 2xl:grid-cols-3"
              role="list"
              aria-label="Vault inventory deposit map"
            >
              {depositInventory.map((card) => (
                <DepositMapTile
                  key={card.vaultId}
                  card={card}
                  selected={selectedDepositCard?.vaultId === card.vaultId}
                  onSelect={() =>
                    setSelectedDepositCard((current) =>
                      current?.vaultId === card.vaultId ? null : card,
                    )
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col items-center rounded-xl border border-border bg-[#111115] px-3 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-1 flex-col items-center justify-center">
            <CircularProgressGauge deposit={selectedDepositCard} target={targetGrailCard} />
          </div>

          <div className="mt-6 w-full max-w-[280px]">
            <button
              type="button"
              disabled={!canExecute}
              onClick={handleExecute}
              className="w-full rounded-lg bg-[#FF007F] py-4 font-bold uppercase tracking-wide text-white transition-all hover:bg-[#FF007F]/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {executing ? "PROCESSING…" : "EXECUTE COLLECTIBLE UPGRADE"}
            </button>
            <p className="mt-4 text-center text-[10px] leading-relaxed text-muted">
              Trade-in items are processed instantly upon execution. All outcomes are
              deterministic and verified via our Provably Fair cryptographic auditing hub.
            </p>
          </div>
        </section>

        <section className="flex min-h-[420px] flex-col rounded-xl border border-border bg-[#121318] p-4 sm:p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Target Selection
          </h2>
          <p className="mt-1 mb-4 text-[11px] leading-relaxed text-muted">
            Choose a premium grail from the master catalog pool.
          </p>
          <div className="grid max-h-[min(520px,58vh)] flex-1 grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2">
            {UPGRADER_TARGET_POOL.map((card) => (
              <TargetGrailTile
                key={card.vaultId}
                card={card}
                selected={targetGrailCard?.vaultId === card.vaultId}
                onSelect={() =>
                  setTargetGrailCard((current) =>
                    current?.vaultId === card.vaultId ? null : card,
                  )
                }
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
