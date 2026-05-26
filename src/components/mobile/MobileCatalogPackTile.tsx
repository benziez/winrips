import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Pack } from "../../types";
import { formatPackPriceUsd } from "../../constants/retail";
import { PackCatalogImage } from "./PackCatalogImage";
import { OBSIDIAN_GOLD } from "./mobileTheme";

const TILE_SPRING = { type: "spring" as const, stiffness: 400, damping: 28 };

function displayName(name: string): string {
  return name.replace(/ Pack$| Box$| Drop$| Edition$| Booster$/, "");
}

interface MobileCatalogPackTileProps {
  pack: Pack;
  priority?: boolean;
  isActive?: boolean;
  onSelect: () => void;
}

export function MobileCatalogPackTile({
  pack,
  priority = false,
  isActive = false,
  onSelect,
}: MobileCatalogPackTileProps) {
  const title = useMemo(() => displayName(pack.name), [pack.name]);
  const priceLabel = formatPackPriceUsd(pack.cost);

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className="relative block w-full overflow-hidden text-left"
      aria-label={`View ${pack.name}, ${priceLabel}`}
      animate={{
        scale: isActive ? 1 : 0.9,
        opacity: isActive ? 1 : 0.5,
      }}
      transition={TILE_SPRING}
      whileTap={{ scale: isActive ? 0.98 : 0.88 }}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <PackCatalogImage
          packId={pack.id}
          src={pack.image}
          alt={pack.name}
          priority={priority}
          framed={isActive}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-5 pt-16">
          <h3 className="text-xl font-semibold leading-tight text-white">{title}</h3>
          <p className="mt-1 text-lg font-bold" style={{ color: OBSIDIAN_GOLD.bright }}>
            {priceLabel}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
