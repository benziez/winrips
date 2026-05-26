import { useMemo } from "react";
import type { Pack } from "../../types";
import { formatPackPriceUsd } from "../../constants/retail";
import { COMMERCE_COPY } from "../../constants/commerce";
import { useApp } from "../../context/AppContext";
import { PackCatalogImage } from "./PackCatalogImage";
import { hapticTabSelect } from "../../utils/mobileHaptics";
import { MobilePageStack } from "./MobilePageStack";
import { BTN_GHOST_OUTLINE, BTN_PRIMARY, OBSIDIAN_GOLD } from "./mobileTheme";
import { GlassSurface } from "./GlassSurface";

function displayName(name: string): string {
  return name.replace(/ Pack$| Box$| Drop$| Edition$| Booster$/, "");
}

interface PackDetailSheetProps {
  pack: Pack;
  onClose: () => void;
  onWhatsInside: () => void;
}

export function PackDetailSheet({ pack, onClose, onWhatsInside }: PackDetailSheetProps) {
  const { selectPack } = useApp();
  const title = useMemo(() => displayName(pack.name), [pack.name]);
  const priceLabel = formatPackPriceUsd(pack.cost);

  function handleOpen() {
    void hapticTabSelect();
    selectPack(pack);
    onClose();
  }

  return (
    <MobilePageStack open onClose={onClose} zIndex={85}>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <PackCatalogImage
          packId={pack.id}
          src={pack.image}
          alt={pack.name}
          priority
          className="h-full min-h-[55dvh]"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/85 via-transparent to-black"
          aria-hidden
        />
      </div>

      <GlassSurface
        variant="default"
        className="mx-4 shrink-0 rounded-t-3xl px-6 pt-5 pb-safe"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-1 text-xl font-bold" style={{ color: OBSIDIAN_GOLD.bright }}>
          {priceLabel}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              void hapticTabSelect();
              onWhatsInside();
            }}
            className={BTN_GHOST_OUTLINE}
          >
            {COMMERCE_COPY.whatsInside}
          </button>
          <button type="button" onClick={handleOpen} className={BTN_PRIMARY}>
            Open Drop
          </button>
        </div>
      </GlassSurface>
    </MobilePageStack>
  );
}
