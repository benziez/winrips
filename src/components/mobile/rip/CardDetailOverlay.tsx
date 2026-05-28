import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Card, VaultedCard } from "../../../types";
import { canShipCardValue, formatUsd, gemsToUsd } from "../../../constants/retail";
import { useFallbackImageSrc, IMAGE_PLACEHOLDER } from "../../../hooks/useFallbackImageSrc";
import { resolveAssetUrl, isRenderableAssetUrl } from "../../../utils/resolveAssetUrl";
import { CARD_PLACEHOLDER_IMAGE } from "../../../constants/cardAssets";
import { ChevronLeft, InfoIcon } from "../../icons/AppIcons";
import { ObsidianImage } from "../ObsidianImage";
import { RipBottomSheet } from "./RipBottomSheet";
import { ShipCardSheet } from "../vault/ShipCardSheet";
import { useApp } from "../../../context/AppContext";
import { hapticTabSelect } from "../../../utils/mobileHaptics";

interface CardDetailOverlayProps {
  card: Card | VaultedCard | null;
  open: boolean;
  onClose: () => void;
}

function isVaultedCard(card: Card | VaultedCard): card is VaultedCard {
  return "vaultId" in card && typeof card.vaultId === "string";
}

export function CardDetailOverlay({ card, open, onClose }: CardDetailOverlayProps) {
  const { showErrorToast, setCardDetailOverlayOpen } = useApp();
  const [infoOpen, setInfoOpen] = useState(false);
  const [shipSheetOpen, setShipSheetOpen] = useState(false);

  const remoteSrc = useMemo(() => {
    if (!card) return CARD_PLACEHOLDER_IMAGE;
    const trimmed = card.image?.trim() ?? "";
    const candidate = isRenderableAssetUrl(trimmed) ? trimmed : CARD_PLACEHOLDER_IMAGE;
    return resolveAssetUrl(candidate);
  }, [card]);

  const { imgSrc, onError } = useFallbackImageSrc(remoteSrc, IMAGE_PLACEHOLDER);
  const priceLabel = card ? formatUsd(gemsToUsd(card.value)) : "";
  const vaultedCard = card && isVaultedCard(card) ? card : null;
  const canShip = vaultedCard ? canShipCardValue(vaultedCard.value) : false;

  useEffect(() => {
    setCardDetailOverlayOpen(open);
    return () => setCardDetailOverlayOpen(false);
  }, [open, setCardDetailOverlayOpen]);

  function handleShipTap() {
    if (!vaultedCard) return;
    if (!canShip) {
      showErrorToast("Cards under $50 auto-sell only");
      return;
    }
    void hapticTabSelect();
    setShipSheetOpen(true);
  }

  return (
    <>
      <AnimatePresence>
        {open && card ? (
          <motion.div
            className="fixed inset-0 z-[70] flex flex-col rip-ambient-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <header
              className="flex shrink-0 items-center justify-between px-6"
              style={{ paddingTop: "calc(max(0.5rem, env(safe-area-inset-top)) + 0.5rem)" }}
            >
              <button
                type="button"
                onClick={() => {
                  void hapticTabSelect();
                  onClose();
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--rip-surface)] text-white"
                aria-label="Back"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={() => {
                  void hapticTabSelect();
                  setInfoOpen(true);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--rip-surface)] text-white"
                aria-label="Card info"
              >
                <InfoIcon size={20} />
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-4">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-[min(60vw,280px)]"
              >
                <div
                  className="pointer-events-none absolute -bottom-4 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-full bg-white/10 blur-2xl"
                  aria-hidden
                />
                <ObsidianImage
                  imgSrc={imgSrc}
                  fallbackSrc={IMAGE_PLACEHOLDER}
                  alt={card.name}
                  onError={onError}
                  imgClassName="w-full object-contain"
                />
              </motion.div>

              <p className="rip-glow-value mt-10 text-center text-[48px] font-bold tabular-nums text-white">
                {priceLabel}
              </p>
              <p className="mt-2 text-center text-[20px] text-[var(--rip-text-muted)]">{card.name}</p>
            </div>

            <div
              className="shrink-0 px-6 pt-2"
              style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
            >
              {vaultedCard ? (
                <button
                  type="button"
                  onClick={handleShipTap}
                  className={`flex h-14 w-full flex-col items-center justify-center rounded-full bg-[var(--rip-surface)] ${
                    canShip ? "text-white" : "text-[var(--rip-text-muted)]"
                  }`}
                >
                  <span className="text-[16px] font-semibold">Ship</span>
                  {!canShip ? (
                    <span className="text-[10px] text-[var(--rip-text-muted)]">Min $50 to ship</span>
                  ) : null}
                </button>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <RipBottomSheet open={infoOpen} onClose={() => setInfoOpen(false)} heightClass="h-auto max-h-[50dvh]">
        {card ? (
          <div className="px-6 pb-8 pt-14">
            <h3 className="text-xl font-bold text-white">Card details</h3>
            <dl className="mt-4 space-y-3 text-[15px]">
              <div>
                <dt className="text-[var(--rip-text-muted)]">Name</dt>
                <dd className="text-white">{card.name}</dd>
              </div>
              <div>
                <dt className="text-[var(--rip-text-muted)]">Rarity</dt>
                <dd className="text-white">{card.rarity}</dd>
              </div>
              <div>
                <dt className="text-[var(--rip-text-muted)]">Fair market value</dt>
                <dd className="text-white">{priceLabel}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </RipBottomSheet>

      <ShipCardSheet
        open={shipSheetOpen}
        onClose={() => setShipSheetOpen(false)}
        card={vaultedCard}
        onSuccess={onClose}
      />
    </>
  );
}
