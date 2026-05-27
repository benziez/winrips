import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Pack } from "../../types";
import { useApp } from "../../context/AppContext";
import { useBoxesCatalog } from "../../context/BoxesCatalogContext";
import { LOBBY_SECTIONS, packsForLobbySection } from "../../data/lobbySections";
import { formatUsd, gemsToUsd } from "../../constants/retail";
import { formatPackMinUsd, formatPackMaxUsd } from "../../utils/packValueRange";
import { PackCatalogImage } from "./PackCatalogImage";
import { MOBILE_DOCK_CLEARANCE } from "./MobileFloatingDock";
import { RipAmbientShell } from "./rip/RipAmbientShell";
import { BalancePill } from "./rip/BalancePill";
import { CategorySelector } from "./rip/CategorySelector";
import { CategorySheet } from "./rip/CategorySheet";
import { AddFundsModal } from "./rip/AddFundsModal";
import { WhatsInsideSheet } from "./rip/WhatsInsideSheet";
import { AdjustOddsSheet } from "./rip/AdjustOddsSheet";
import { InsufficientBalanceToast } from "./rip/InsufficientBalanceToast";
import type { OddsMode } from "./rip/adjustOdds";
import { oddsMultiplierForMode } from "./rip/adjustOdds";
import { ChevronRight, EyeIcon } from "../icons/AppIcons";
import { hapticMediumImpact, hapticTabSelect } from "../../utils/mobileHaptics";

const SLIDE_WIDTH_VW = 46;

export function MobileRipLobby() {
  const { packs: catalogPacks, loading } = useBoxesCatalog();
  const { goldVolts, selectPack } = useApp();

  const [activeIndex, setActiveIndex] = useState(0);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [whatsInsideOpen, setWhatsInsideOpen] = useState(false);
  const [adjustOddsOpen, setAdjustOddsOpen] = useState(false);
  const [oddsMode, setOddsMode] = useState<OddsMode>("normal");
  const [insufficientToast, setInsufficientToast] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const catalogPacksFlat = useMemo(() => {
    const seen = new Set<string>();
    const ordered: Pack[] = [];
    for (const section of LOBBY_SECTIONS) {
      for (const pack of packsForLobbySection(section, catalogPacks)) {
        if (seen.has(pack.id)) continue;
        seen.add(pack.id);
        ordered.push(pack);
      }
    }
    return ordered;
  }, [catalogPacks]);

  const activePack = catalogPacksFlat[activeIndex] ?? null;

  const priceUsd = useMemo(() => {
    if (!activePack) return 0;
    return gemsToUsd(activePack.cost) * oddsMultiplierForMode(oddsMode);
  }, [activePack, oddsMode]);

  const balanceUsd = gemsToUsd(goldVolts);
  const canAfford = activePack ? balanceUsd >= priceUsd : false;

  const updateActiveFromScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || catalogPacksFlat.length === 0) return;

    const centerX = container.scrollLeft + container.clientWidth / 2;
    const slides = container.querySelectorAll<HTMLElement>("[data-pack-slide]");
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(centerX - slideCenter);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    setActiveIndex(bestIndex);
  }, [catalogPacksFlat.length]);

  useEffect(() => {
    if (!activePack) return;
    setInsufficientToast(!canAfford);
  }, [activePack?.id, canAfford, activePack]);

  const handleBuy = useCallback(() => {
    if (!activePack) return;
    void hapticMediumImpact();
    if (!canAfford) {
      setInsufficientToast(true);
      return;
    }
    selectPack(activePack);
  }, [activePack, canAfford, selectPack]);

  const oddsLabel =
    oddsMode === "normal" ? "Normal" : oddsMode === "better" ? "Better" : "Best";

  return (
    <RipAmbientShell scratch>
      <header
        className="flex shrink-0 items-center justify-between px-6 pb-3"
        style={{ paddingTop: "calc(max(0.5rem, env(safe-area-inset-top)) + 0.5rem)" }}
      >
        <CategorySelector onPress={() => setCategoryOpen(true)} />
        <BalancePill onAddFunds={() => setAddFundsOpen(true)} />
      </header>

      {loading && catalogPacksFlat.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-[15px] text-[var(--rip-text-muted)]">
          Loading drops…
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-hidden">
            <div
              ref={scrollRef}
              onScroll={updateActiveFromScroll}
              className="rip-hide-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-none"
              style={{
                scrollPaddingInline: `${(100 - SLIDE_WIDTH_VW) / 2}vw`,
              }}
            >
              {catalogPacksFlat.map((pack, index) => (
                <div
                  key={pack.id}
                  data-pack-slide
                  className="flex h-full shrink-0 snap-center items-center justify-center pr-4 first:ml-[calc((100vw-46vw)/2-8px)] last:mr-[calc((100vw-46vw)/2-8px)]"
                  style={{ width: `${SLIDE_WIDTH_VW}vw` }}
                >
                  <div
                    className="relative aspect-[2/3] w-full overflow-hidden rounded-lg"
                    style={{ boxShadow: "var(--rip-shadow-pack)" }}
                  >
                    <PackCatalogImage
                      packId={pack.id}
                      src={pack.image}
                      alt={pack.name}
                      priority={index < 2}
                      className="h-full w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {activePack ? (
            <motion.div
              key={activePack.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="shrink-0 px-6"
              style={{ paddingBottom: `calc(${MOBILE_DOCK_CLEARANCE} + 1rem)` }}
            >
              <h1 className="mt-4 text-center text-lg font-semibold text-white">{activePack.name}</h1>

              <button
                type="button"
                onClick={() => {
                  void hapticTabSelect();
                  setWhatsInsideOpen(true);
                }}
                className="mx-auto mt-4 flex items-center gap-2 rounded-full border border-[var(--rip-border)] bg-[var(--rip-surface)] px-4 py-2.5 text-[14px] font-medium text-white"
              >
                <EyeIcon size={16} />
                What&apos;s inside
              </button>

              <div className="mt-5 grid grid-cols-3 items-end gap-2">
                <div className="text-center">
                  <p className="text-[12px] font-medium tracking-wide text-[var(--rip-text-muted)]">
                    Min Value
                  </p>
                  <p className="mt-1 text-[17px] font-bold text-white">{formatPackMinUsd(activePack)}</p>
                </div>

                <div className="text-center">
                  <div className="mb-1 flex items-center justify-center gap-2">
                    <span className="h-px w-[18px] bg-[var(--rip-border)]" aria-hidden />
                    <p className="-mt-2 text-[12px] font-medium tracking-wide text-[var(--rip-text-muted)]">
                      Max Pull
                    </p>
                    <span className="h-px w-[18px] bg-[var(--rip-border)]" aria-hidden />
                  </div>
                  <p className="text-[28px] font-bold leading-none text-white rip-glow-value">
                    {formatPackMaxUsd(activePack)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void hapticTabSelect();
                    setAdjustOddsOpen(true);
                  }}
                  className="text-center"
                >
                  <p className="text-[12px] font-medium tracking-wide text-[var(--rip-text-muted)]">
                    Adjust Odds
                  </p>
                  <p className="mt-1 flex items-center justify-center gap-0.5 text-[17px] font-bold text-white">
                    {oddsLabel}
                    <ChevronRight size={14} />
                  </p>
                </button>
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleBuy}
                className="mt-4 flex h-14 w-full items-center justify-center rounded-full bg-[var(--rip-orange)] text-[16px] font-semibold text-white active:bg-[var(--rip-orange-pressed)]"
              >
                Spin for {formatUsd(priceUsd)}
              </motion.button>
            </motion.div>
          ) : null}
        </div>
      )}

      <InsufficientBalanceToast
        visible={insufficientToast && !canAfford && Boolean(activePack)}
        onDeposit={() => {
          setInsufficientToast(false);
          setAddFundsOpen(true);
        }}
        onDismiss={() => setInsufficientToast(false)}
        bottomOffset={`calc(${MOBILE_DOCK_CLEARANCE} + 0.75rem)`}
      />

      <CategorySheet open={categoryOpen} onClose={() => setCategoryOpen(false)} />
      <AddFundsModal open={addFundsOpen} onClose={() => setAddFundsOpen(false)} />
      <WhatsInsideSheet
        pack={activePack}
        open={whatsInsideOpen}
        onClose={() => setWhatsInsideOpen(false)}
      />
      <AdjustOddsSheet
        pack={activePack}
        open={adjustOddsOpen}
        onClose={() => setAdjustOddsOpen(false)}
        selected={oddsMode}
        onSelect={setOddsMode}
      />
    </RipAmbientShell>
  );
}
