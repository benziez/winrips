import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Pack, Rarity } from "../../types";
import { useApp } from "../../context/AppContext";
import { useBoxesCatalog } from "../../context/BoxesCatalogContext";
import { LOBBY_SECTIONS, packsForLobbySection } from "../../data/lobbySections";
import { LOBBY_PACK_CATALOG } from "../../constants/packs";
import { formatUsd, gemsToUsd } from "../../constants/retail";
import { buildGlobalCardCatalog } from "../../utils/globalCardCatalog";
import { glowPaletteForCardRarity } from "../../utils/rarityGlowColors";
import { WinRipsLogo } from "../brand/WinRipsLogo";
import { PackCatalogImage } from "./PackCatalogImage";
import { CollectibleImage } from "../ui/CollectibleImage";
import { RipAmbientShell } from "./rip/RipAmbientShell";
import { BalancePill } from "./rip/BalancePill";
import { CategorySelector } from "./rip/CategorySelector";
import { CategorySheet } from "./rip/CategorySheet";
import { AddFundsModal } from "./rip/AddFundsModal";
import { hapticMediumImpact } from "../../utils/mobileHaptics";
import { mobileHeaderSafePaddingStyle } from "./mobileShellTheme";
import featuredWotcBanner from "../../assets/banners/featured-wotc-banner.png";

/**
 * Category picker is hidden while the catalog is Pokémon-only (a single-option
 * dropdown is pointless). Flip to `true` to re-enable once more categories exist —
 * all the underlying logic (CategorySelector, CategorySheet, handlers, filtering)
 * is left intact.
 */
const SHOW_CATEGORY_SELECTOR = false;

/** Only genuine chase tiers qualify for "Biggest Pulls" — never a high-priced Common. */
function isChaseRarity(rarity: Rarity): boolean {
  return rarity !== "Common";
}

interface JustWonTile {
  key: string;
  name: string;
  value: number;
  image: string;
  rarity: Rarity;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="px-6 text-[18px] font-semibold tracking-tight text-white">{title}</h2>
  );
}

export function MobileRipLobby() {
  const { packs: catalogPacks, loading } = useBoxesCatalog();
  const { selectPack, vaultItems } = useApp();

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [addFundsOpen, setAddFundsOpen] = useState(false);

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

  // "Open a Pack" row: cheapest -> most expensive, left to right.
  const openPackRow = useMemo(
    () => [...catalogPacksFlat].sort((a, b) => a.cost - b.cost),
    [catalogPacksFlat],
  );

  const featuredPack = useMemo(() => {
    if (catalogPacksFlat.length === 0) return null;
    return catalogPacksFlat.reduce(
      (best, pack) => (pack.cost > best.cost ? pack : best),
      catalogPacksFlat[0]!,
    );
  }, [catalogPacksFlat]);

  const biggestPulls = useMemo<JustWonTile[]>(() => {
    const seen = new Set<string>();
    const tiles: JustWonTile[] = [];

    // Dedup by card id (vault pull wins over the same catalog card).
    const pushUnique = (tile: JustWonTile) => {
      if (seen.has(tile.key)) return;
      seen.add(tile.key);
      tiles.push(tile);
    };

    // Real big pulls first — chase tiers only, never a high-priced Common.
    for (const item of vaultItems) {
      if (!isChaseRarity(item.rarity)) continue;
      pushUnique({
        key: item.id,
        name: item.name,
        value: item.value,
        image: item.image,
        rarity: item.rarity,
      });
    }

    // Backfill from the full static catalog's highest-value chase cards.
    for (const card of buildGlobalCardCatalog(LOBBY_PACK_CATALOG)) {
      if (!isChaseRarity(card.rarity)) continue;
      pushUnique({
        key: card.id,
        name: card.name,
        value: card.value,
        image: card.image,
        rarity: card.rarity,
      });
    }

    return tiles.sort((a, b) => b.value - a.value).slice(0, 10);
  }, [vaultItems]);

  const handleSelectPack = useCallback(
    (pack: Pack) => {
      void hapticMediumImpact();
      selectPack(pack);
    },
    [selectPack],
  );

  return (
    <RipAmbientShell scratch>
      <header
        className="relative z-[10000] flex shrink-0 items-center justify-between border-none px-6 pb-3 shadow-none"
        style={{ ...mobileHeaderSafePaddingStyle, background: "#000000" }}
      >
        {SHOW_CATEGORY_SELECTOR ? (
          <CategorySelector onPress={() => setCategoryOpen(true)} />
        ) : (
          <WinRipsLogo className="block h-9 w-auto object-contain" maxWidth={160} glow={false} />
        )}
        <BalancePill onAddFunds={() => setAddFundsOpen(true)} />
      </header>

      {loading && catalogPacksFlat.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-[15px] text-[var(--rip-text-muted)]">
          Loading drops…
        </p>
      ) : (
        <div className="rip-hide-scrollbar min-h-0 flex-1 space-y-7 overflow-y-auto overflow-x-hidden pb-4 pt-1">
          {/* Hero banner */}
          {featuredPack ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectPack(featuredPack)}
              aria-label={`Open ${featuredPack.name}`}
              className="relative mx-6 flex h-[200px] w-[calc(100%-3rem)] items-end overflow-hidden rounded-2xl bg-[#0a0c10] text-left"
              style={{ boxShadow: "var(--rip-shadow-pack)" }}
            >
              <img
                src={featuredWotcBanner}
                alt={featuredPack.name}
                className="absolute inset-0 h-full w-full object-cover object-center"
                draggable={false}
              />
            </motion.button>
          ) : null}

          {/* Open a Pack */}
          {openPackRow.length > 0 ? (
            <section className="space-y-3">
              <SectionHeader title="Open a Pack" />
              <div className="rip-hide-scrollbar flex snap-x gap-3 overflow-x-auto overflow-y-hidden pl-4 pr-6 pb-1">
                {openPackRow.map((pack, index) => (
                  <motion.button
                    key={pack.id}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelectPack(pack)}
                    className="flex w-[44vw] shrink-0 snap-start flex-col text-left"
                  >
                    <div
                      className="relative aspect-[2/3] w-full overflow-hidden rounded-xl"
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
                    <p className="mt-2 truncate text-[14px] font-semibold text-white">
                      {pack.name}
                    </p>
                    <p className="text-[13px] font-bold tabular-nums text-[var(--rip-green-bright)]">
                      {formatUsd(gemsToUsd(pack.cost))}
                    </p>
                  </motion.button>
                ))}
              </div>
            </section>
          ) : null}

          {/* Biggest Pulls */}
          {biggestPulls.length > 0 ? (
            <section className="space-y-3">
              <SectionHeader title="Biggest Pulls" />
              <div className="rip-hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden pl-4 pr-4 pb-1">
                {biggestPulls.map((tile) => (
                  <div key={tile.key} className="flex w-[30vw] shrink-0 snap-start flex-col">
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[var(--rip-surface)]">
                      <CollectibleImage
                        src={tile.image}
                        alt={tile.name}
                        className="h-full w-full object-contain"
                        optimize={false}
                        loading="lazy"
                        placeholderTintRgb={glowPaletteForCardRarity(tile.rarity).rgb}
                      />
                    </div>
                    <p className="mt-1.5 truncate text-[12px] font-medium text-white">
                      {tile.name}
                    </p>
                    <p className="text-[12px] font-bold tabular-nums text-[var(--rip-green-bright)]">
                      {formatUsd(gemsToUsd(tile.value))}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <CategorySheet open={categoryOpen} onClose={() => setCategoryOpen(false)} />
      <AddFundsModal open={addFundsOpen} onClose={() => setAddFundsOpen(false)} />
    </RipAmbientShell>
  );
}
