import { useMemo } from "react";
import type { Pack } from "../../types";
import { formatPackPriceUsd, formatUsd, gemsToUsd } from "../../constants/retail";
import { getPackDropTable } from "../../data/packDropTables";
import { COMMERCE_COPY } from "../../constants/commerce";
import { useApp } from "../../context/AppContext";
import { PackCatalogImage } from "./PackCatalogImage";
import { hapticTabSelect } from "../../utils/mobileHaptics";
import { MobilePageStack } from "./MobilePageStack";
import { BTN_GHOST_OUTLINE, BTN_PRIMARY, MOBILE_COLORS, OBSIDIAN_GOLD } from "./mobileTheme";
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
  const valueRange = useMemo(() => {
    const table = getPackDropTable(pack.id);
    if (table.length === 0) return null;

    let minValue = table[0]!.card.value;
    let maxValue = table[0]!.card.value;
    for (const entry of table) {
      minValue = Math.min(minValue, entry.card.value);
      maxValue = Math.max(maxValue, entry.card.value);
    }

    return { minValue, maxValue };
  }, [pack.id]);

  function handleOpen() {
    void hapticTabSelect();
    selectPack(pack);
    onClose();
  }

  return (
    <MobilePageStack open onClose={onClose} zIndex={85}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1 basis-0 overflow-hidden">
          <PackCatalogImage
            packId={pack.id}
            src={pack.image}
            alt={pack.name}
            priority
            className="h-full w-full object-cover object-center"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/85 via-transparent to-black"
            aria-hidden
          />
        </div>

        <GlassSurface
          variant="default"
          className="mx-4 shrink-0 rounded-t-3xl px-6 pt-5"
          style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        >
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          <p className="mt-1 text-xl font-bold" style={{ color: OBSIDIAN_GOLD.bright }}>
            {priceLabel}
          </p>

          {valueRange ? (
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <p
                  className="text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: MOBILE_COLORS.textMuted }}
                >
                  Min Value
                </p>
                <p
                  className="mt-0.5 text-base font-semibold tabular-nums"
                  style={{ color: OBSIDIAN_GOLD.bright }}
                >
                  {formatUsd(gemsToUsd(valueRange.minValue))}
                </p>
              </div>
              <div>
                <p
                  className="text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: MOBILE_COLORS.textMuted }}
                >
                  Max Pull
                </p>
                <p
                  className="mt-0.5 text-base font-semibold tabular-nums"
                  style={{ color: OBSIDIAN_GOLD.bright }}
                >
                  {formatUsd(gemsToUsd(valueRange.maxValue))}
                </p>
              </div>
            </div>
          ) : null}

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
              View Pack
            </button>
          </div>
        </GlassSurface>
      </div>
    </MobilePageStack>
  );
}
