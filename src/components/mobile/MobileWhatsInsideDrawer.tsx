import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getPackDropTable, formatProbability } from "../../data/packDropTables";
import { formatUsd, gemsToUsd } from "../../constants/retail";
import { MOBILE_COLORS, PAGE_STACK_SPRING } from "./mobileTheme";
import {
  OVERLAY_DISMISS_EXIT,
  OVERLAY_DISMISS_TRANSITION,
} from "./rip/ripMotion";
import { useFallbackImageSrc, IMAGE_PLACEHOLDER } from "../../hooks/useFallbackImageSrc";
import { resolveAssetUrl, isRenderableAssetUrl } from "../../utils/resolveAssetUrl";
import { CARD_PLACEHOLDER_IMAGE } from "../../constants/cardAssets";
import { GlassSurface } from "./GlassSurface";
import { DismissPill } from "./DismissPill";
import { ObsidianImage } from "./ObsidianImage";

interface MobileWhatsInsideDrawerProps {
  packId: string;
  packName: string;
  open: boolean;
  onClose: () => void;
}

function DrawerRow({
  name,
  image,
  tier,
  price,
  odds,
}: {
  name: string;
  image: string;
  tier: string;
  price: string;
  odds: string;
}) {
  const remoteSrc = (() => {
    const trimmed = image?.trim() ?? "";
    const candidate = isRenderableAssetUrl(trimmed) ? trimmed : CARD_PLACEHOLDER_IMAGE;
    return resolveAssetUrl(candidate);
  })();
  const { imgSrc, onError } = useFallbackImageSrc(remoteSrc, IMAGE_PLACEHOLDER);

  return (
    <div className="flex items-center gap-3 bg-transparent py-3">
      <GlassSurface variant="default" className="h-14 w-10 shrink-0 overflow-hidden rounded-lg p-0">
        <ObsidianImage
          imgSrc={imgSrc}
          fallbackSrc={IMAGE_PLACEHOLDER}
          alt=""
          onError={onError}
          imgClassName="h-full w-full object-cover"
        />
      </GlassSurface>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-white">{name}</p>
        <p
          className="text-[11px] font-medium uppercase tracking-wide"
          style={{ color: MOBILE_COLORS.textMuted }}
        >
          {tier}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-white">{price}</p>
        <p className="text-xs" style={{ color: MOBILE_COLORS.textMuted }}>
          {odds}
        </p>
      </div>
    </div>
  );
}

/** `fixed inset-0` glass sheet — minimalist list, no row borders. */
export function MobileWhatsInsideDrawer({
  packId,
  packName,
  open,
  onClose,
}: MobileWhatsInsideDrawerProps) {
  const entries = useMemo(() => getPackDropTable(packId), [packId]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Dismiss"
            className="fixed inset-0 z-[110] bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={OVERLAY_DISMISS_TRANSITION}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-[111] flex flex-col overflow-hidden bg-black"
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: 0, transition: PAGE_STACK_SPRING }}
            exit={OVERLAY_DISMISS_EXIT}
            transition={OVERLAY_DISMISS_TRANSITION}
          >
            <header
              className="relative flex shrink-0 items-center justify-center px-5 pb-2"
              style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
            >
              <DismissPill onClick={onClose} className="absolute right-5" />
              <div className="min-w-0 text-center">
                <h2 className="text-lg font-semibold text-white">What&apos;s inside</h2>
                <p className="text-xs" style={{ color: MOBILE_COLORS.textMuted }}>
                  {packName}
                </p>
              </div>
            </header>

            <GlassSurface variant="default" className="mx-5 mb-3 rounded-2xl px-4 py-2">
              <p
                className="text-center text-[11px] uppercase tracking-widest"
                style={{ color: MOBILE_COLORS.textMuted }}
              >
                Price · Odds
              </p>
            </GlassSurface>

            <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-safe">
              {entries.map((entry) => (
                <li key={entry.card.id}>
                  <DrawerRow
                    name={entry.card.name}
                    image={entry.card.image}
                    tier={entry.storeRarity}
                    price={formatUsd(gemsToUsd(entry.card.value))}
                    odds={formatProbability(entry.probability)}
                  />
                </li>
              ))}
            </ul>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
