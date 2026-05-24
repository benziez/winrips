import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { SessionAuthWall } from "../components/auth/SessionAuthWall";
import { UPGRADER_TARGET_POOL } from "../constants/upgraderTargets";
import {
  computeUpgradeWinPercent,
  formatUpgradeWinPercent,
} from "../constants/upgraderMath";
import { formatGems } from "../constants/retail";
import { processUpgradeRoll } from "../lib/upgradeLogic";
import { RarityBadge } from "../components/ui/RarityBadge";
import { CollectibleImage } from "../components/ui/CollectibleImage";
import type { VaultedCard } from "../types";

const GLASS_CARD =
  "relative overflow-hidden bg-white/5 backdrop-blur-md border border-white/10";
const GLASS_GRADIENT =
  "pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-transparent";
const GLASS_PANEL =
  "relative overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md";
const GLASS_PANEL_GRADIENT =
  "pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-transparent";
const FUCHSIA_BLOOM =
  "shadow-[0_0_20px_rgba(255,0,127,0.4)]";

type RollPhase = "idle" | "spinning" | "won" | "lost";

function CircularProgressGauge({
  deposit,
  target,
  spinning = false,
}: {
  deposit: VaultedCard | null;
  target: VaultedCard | null;
  spinning?: boolean;
}) {
  const percent =
    deposit && target && target.value > 0
      ? computeUpgradeWinPercent(deposit.value, target.value)
      : 0;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const oddsLabel = formatUpgradeWinPercent(deposit?.value ?? 0, target?.value ?? 0);
  const hasSelection = Boolean(deposit && target);

  return (
    <div className="relative flex h-44 w-44 items-center justify-center sm:h-48 sm:w-48">
      <svg
        className={`h-full w-full -rotate-90 ${spinning ? "animate-spin" : ""}`}
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
          {spinning ? "Rolling…" : oddsLabel}
        </span>
        {hasSelection && !spinning && (
          <span className={`mt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#FF007F] drop-shadow-[0_0_10px_rgba(255,0,127,0.5)]`}>
            Success Probability
          </span>
        )}
      </div>
    </div>
  );
}

function RollResultPanel({
  won,
  target,
  deposit,
  onDismiss,
}: {
  won: boolean;
  target: VaultedCard;
  deposit: VaultedCard;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`relative flex w-full max-w-[280px] flex-col items-center overflow-hidden rounded-xl border px-5 py-6 text-center shadow-2xl ${
        won
          ? "border-yellow-500/50 bg-gradient-to-b from-yellow-900/30 to-[#0A0A0C] shadow-[0_0_40px_rgba(234,179,8,0.15),inset_0_0_50px_rgba(234,179,8,0.08)]"
          : "border-red-900/50 bg-gradient-to-b from-red-950/40 to-[#0A0A0C] shadow-[0_0_30px_rgba(127,29,29,0.35)]"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          won
            ? "bg-gradient-to-b from-yellow-400/10 via-transparent to-transparent"
            : "bg-gradient-to-b from-red-500/10 via-transparent to-transparent"
        }`}
        aria-hidden
      />
      <p
        className={`relative text-lg font-black uppercase tracking-[0.18em] ${
          won
            ? "text-gold drop-shadow-[0_0_12px_rgba(234,179,8,0.55)]"
            : "text-white [text-shadow:0_0_14px_rgba(239,68,68,0.65),0_2px_8px_rgba(0,0,0,0.8)]"
        }`}
      >
        {won ? "Upgrade Won" : "Upgrade Lost"}
      </p>
      <p className="relative mt-3 text-sm leading-relaxed text-slate-200/90">
        {won
          ? `${target.name} has been secured in your vault locker.`
          : `${deposit.name} was consumed. The target asset was not acquired this attempt.`}
      </p>
      {won ? (
        <div className="relative mt-4 w-28 overflow-hidden rounded-lg border border-yellow-500/30 bg-white/5 p-2 shadow-[inset_0_0_20px_rgba(234,179,8,0.12)] backdrop-blur-sm">
          <CollectibleImage
            src={target.image}
            alt={target.name}
            className="aspect-[2.5/3.5] w-full object-contain"
          />
        </div>
      ) : null}
      <button
        type="button"
        onClick={onDismiss}
        className={`relative mt-5 w-full rounded-lg bg-[#FF007F] py-3 text-xs font-bold uppercase tracking-wide text-white transition-all hover:brightness-110 ${FUCHSIA_BLOOM}`}
      >
        Continue
      </button>
    </div>
  );
}

function DepositMapTile({
  card,
  selected,
  disabled,
  onSelect,
}: {
  card: VaultedCard;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={`group relative flex flex-col overflow-hidden rounded-xl transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? "border-amber-500/50 bg-amber-950/20 shadow-[0_0_20px_rgba(234,179,8,0.35)] ring-1 ring-yellow-500/50 backdrop-blur-md"
          : `${GLASS_CARD} hover:border-white/20 hover:bg-white/[0.07]`
      }`}
    >
      <div className={GLASS_GRADIENT} aria-hidden />
      <div className="relative flex h-24 items-center justify-center border-b border-white/10 p-2 sm:h-32 sm:p-3">
        <CollectibleImage
          src={card.image}
          alt={card.name}
          className={`h-full w-full object-contain transition-all duration-300 group-hover:scale-[1.03] ${
            selected ? "opacity-100" : "opacity-60 group-hover:opacity-95"
          }`}
        />
      </div>
      <div className="relative space-y-1 p-3 text-left sm:p-4">
        <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-white sm:text-xs">
          {card.name}
        </p>
        <p className="text-[10px] font-bold tabular-nums tracking-wide text-amber-400/90 sm:text-[11px]">
          {formatGems(card.value)}
        </p>
      </div>
      {selected && (
        <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black shadow-[0_0_10px_rgba(234,179,8,0.45)]">
          ✓
        </span>
      )}
    </button>
  );
}

function TargetGrailTile({
  card,
  selected,
  disabled,
  onSelect,
}: {
  card: VaultedCard;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={`group relative flex w-full flex-col overflow-hidden rounded-xl text-left transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? "border-amber-500/50 bg-amber-950/20 shadow-[0_0_20px_rgba(234,179,8,0.35)] ring-1 ring-yellow-500/50 backdrop-blur-md"
          : `${GLASS_CARD} hover:border-white/20 hover:bg-white/[0.07]`
      }`}
    >
      <div className={GLASS_GRADIENT} aria-hidden />
      <div className="relative flex h-28 items-center justify-center border-b border-white/10 p-3 sm:h-40 sm:p-4">
        <CollectibleImage
          src={card.image}
          alt={card.name}
          className={`h-full w-full object-contain transition-all duration-300 group-hover:scale-[1.03] ${
            selected ? "opacity-100" : "opacity-60 group-hover:opacity-95"
          }`}
        />
      </div>
      <div className="relative space-y-2 p-4 sm:p-5">
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-white sm:text-sm">
          {card.name}
        </p>
        <p className="text-xs font-bold tabular-nums tracking-wide text-amber-400/90 sm:text-sm">
          {formatGems(card.value)}
        </p>
        <RarityBadge rarity={card.rarity} />
      </div>
    </button>
  );
}

function UpgraderEmptyInventory() {
  const { navigateToView } = useApp();

  return (
    <div className={`${GLASS_PANEL} px-8 py-20 text-center`}>
      <div className={GLASS_PANEL_GRADIENT} aria-hidden />
      <p className="relative text-base font-semibold text-white">
        No inventory items available to upgrade.
      </p>
      <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#A0A5B5]">
        Open some packs first!
      </p>
      <button
        type="button"
        onClick={() => navigateToView("lobby")}
        className="relative mt-6 text-sm font-semibold text-[#FF007F] drop-shadow-[0_0_10px_rgba(255,0,127,0.45)] transition-colors hover:underline"
      >
        Browse packs in the lobby
      </button>
    </div>
  );
}

function isUpgradeableDeposit(card: VaultedCard): boolean {
  return !card.status || card.status === "vaulted";
}

export function UpgraderView() {
  const {
    isLoggedIn,
    userId,
    vaultItems,
    vaultItemsLoading,
    syncVaultFromServer,
    showCashoutToast,
  } = useApp();
  const { user, authLoading, isAuthenticated } = useAuth();

  const [selectedDepositCard, setSelectedDepositCard] = useState<VaultedCard | null>(null);
  const [targetGrailCard, setTargetGrailCard] = useState<VaultedCard | null>(null);
  const [rollPhase, setRollPhase] = useState<RollPhase>("idle");
  const [lastRoll, setLastRoll] = useState<{
    deposit: VaultedCard;
    target: VaultedCard;
    won: boolean;
  } | null>(null);

  const hasUpgraderAccess =
    !authLoading &&
    isAuthenticated &&
    Boolean(user?.id) &&
    isLoggedIn &&
    Boolean(userId) &&
    user!.id === userId;

  useEffect(() => {
    if (!hasUpgraderAccess || !userId) return;
    void syncVaultFromServer(userId);
  }, [hasUpgraderAccess, userId, syncVaultFromServer]);

  const depositInventory = useMemo(
    () => (hasUpgraderAccess ? vaultItems.filter(isUpgradeableDeposit) : []),
    [hasUpgraderAccess, vaultItems],
  );
  const isLoadingInventory = hasUpgraderAccess && vaultItemsLoading;
  const isRolling = rollPhase === "spinning";
  const showingResult = rollPhase === "won" || rollPhase === "lost";

  const successPercent = useMemo(() => {
    if (!selectedDepositCard || !targetGrailCard) return 0;
    return computeUpgradeWinPercent(selectedDepositCard.value, targetGrailCard.value);
  }, [selectedDepositCard, targetGrailCard]);

  const canExecute = Boolean(
    hasUpgraderAccess &&
      depositInventory.length > 0 &&
      selectedDepositCard &&
      targetGrailCard &&
      rollPhase === "idle",
  );

  async function handleExecute() {
    if (!selectedDepositCard || !targetGrailCard || !userId || rollPhase !== "idle") return;

    const deposit = selectedDepositCard;
    const target = targetGrailCard;

    setRollPhase("spinning");

    try {
      const result = await processUpgradeRoll(deposit.vaultId, target.id);

      if (!result.ok) {
        showCashoutToast(result.error);
        setRollPhase("idle");
        return;
      }

      await syncVaultFromServer(userId);

      setLastRoll({ deposit, target, won: result.won });
      setRollPhase(result.won ? "won" : "lost");
      setSelectedDepositCard(null);
      setTargetGrailCard(null);

      showCashoutToast(
        result.won
          ? `Upgrade successful — ${target.name} secured in your vault.`
          : `Upgrade failed — ${deposit.name} was consumed.`,
      );
    } catch {
      showCashoutToast("Unable to process this upgrade. Please try again.");
      setRollPhase("idle");
    }
  }

  function handleDismissResult() {
    setRollPhase("idle");
    setLastRoll(null);
  }

  const header = (
    <header className="mb-8 max-w-3xl border-b border-white/10 pb-6 sm:mb-10 sm:pb-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-500/80">
        Premium Exchange
      </p>
      <h1 className="mt-2 text-xl font-black uppercase tracking-tight text-white sm:text-3xl">
        Collection Upgrader
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-slate-400">
        Trade in your low-tier inventory to unlock premium, high-value collection assets.
      </p>
    </header>
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] overflow-x-hidden px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
      {header}

      {authLoading || isLoadingInventory ? (
        <div className={`${GLASS_PANEL} px-6 py-16 text-center`}>
          <div className={GLASS_PANEL_GRADIENT} aria-hidden />
          <p className="relative text-sm text-[#A0A5B5]">
            {authLoading ? "Verifying session…" : "Loading your vault inventory…"}
          </p>
        </div>
      ) : !hasUpgraderAccess ? (
        <SessionAuthWall description="Sign in with an active account to use the Collection Upgrader. Deposit inventory is tied to your verified session and is never shown to guests." />
      ) : depositInventory.length === 0 ? (
        <UpgraderEmptyInventory />
      ) : (
        <div className="grid w-full grid-cols-1 gap-6 sm:gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(280px,320px)_minmax(0,1fr)] xl:items-stretch">
          <section className={`${GLASS_PANEL} flex min-h-0 flex-col p-6 sm:min-h-[420px] sm:p-8`}>
            <div className={GLASS_PANEL_GRADIENT} aria-hidden />
            <h2 className="relative text-xs font-bold uppercase tracking-[0.18em] text-white">
              Inventory Deposit
            </h2>
            <p className="relative mt-2 mb-6 text-[11px] leading-relaxed text-muted">
              Tap a vaulted card to assign it as your active trade-in deposit.
            </p>

            <div
              className="relative grid max-h-[min(420px,50vh)] flex-1 grid-cols-2 gap-4 overflow-y-auto overflow-x-hidden pr-0 sm:max-h-[min(520px,58vh)] sm:grid-cols-3 sm:gap-5 sm:pr-1 xl:grid-cols-2 2xl:grid-cols-3"
              role="list"
              aria-label="Vault inventory deposit map"
            >
              {depositInventory.map((card) => (
                <DepositMapTile
                  key={card.vaultId}
                  card={card}
                  selected={selectedDepositCard?.vaultId === card.vaultId}
                  disabled={isRolling || showingResult}
                  onSelect={() =>
                    setSelectedDepositCard((current) =>
                      current?.vaultId === card.vaultId ? null : card,
                    )
                  }
                />
              ))}
            </div>
          </section>

          <section className={`${GLASS_PANEL} flex flex-col items-center px-6 py-8 sm:px-8 sm:py-10`}>
            <div className={GLASS_PANEL_GRADIENT} aria-hidden />
            <div className="relative flex flex-1 flex-col items-center justify-center">
              {showingResult && lastRoll ? (
                <RollResultPanel
                  won={lastRoll.won}
                  target={lastRoll.target}
                  deposit={lastRoll.deposit}
                  onDismiss={handleDismissResult}
                />
              ) : (
                <CircularProgressGauge
                  deposit={selectedDepositCard}
                  target={targetGrailCard}
                  spinning={isRolling}
                />
              )}
            </div>

            {!showingResult ? (
              <div className="relative mt-6 w-full max-w-[280px]">
                <button
                  type="button"
                  disabled={!canExecute}
                  onClick={() => void handleExecute()}
                  className={`w-full rounded-lg bg-[#FF007F] py-4 font-bold uppercase tracking-wide text-white transition-all hover:bg-[#FF007F]/90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${FUCHSIA_BLOOM}`}
                >
                  {isRolling ? "PROCESSING…" : "EXECUTE COLLECTIBLE UPGRADE"}
                </button>
                {selectedDepositCard && targetGrailCard ? (
                  <p className="relative mt-3 text-center text-[10px] tabular-nums text-muted">
                    Server win chance: {successPercent.toFixed(2)}% (10% house edge applied)
                  </p>
                ) : null}
                <p className="relative mt-4 text-center text-[10px] leading-relaxed text-muted">
                  Trade-in items are consumed on execution. Outcomes are determined securely on
                  the server.
                </p>
              </div>
            ) : null}
          </section>

          <section className={`${GLASS_PANEL} flex min-h-[420px] flex-col p-6 sm:p-8`}>
            <div className={GLASS_PANEL_GRADIENT} aria-hidden />
            <h2 className="relative text-xs font-bold uppercase tracking-[0.18em] text-white">
              Target Selection
            </h2>
            <p className="relative mt-2 mb-6 text-[11px] leading-relaxed text-muted">
              Choose a premium grail from the master catalog pool.
            </p>
            <div className="relative grid max-h-[min(520px,58vh)] flex-1 grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 sm:gap-5">
              {UPGRADER_TARGET_POOL.map((card) => (
                <TargetGrailTile
                  key={card.id}
                  card={card}
                  selected={targetGrailCard?.id === card.id}
                  disabled={isRolling || showingResult}
                  onSelect={() =>
                    setTargetGrailCard((current) => (current?.id === card.id ? null : card))
                  }
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
