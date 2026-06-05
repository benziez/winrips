import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Pack } from "../../types";
import { useApp } from "../../context/AppContext";
import { useBoxesCatalog } from "../../context/BoxesCatalogContext";
import { LOBBY_SECTIONS, packsForLobbySection } from "../../data/lobbySections";
import { formatUsd, gemsToUsd } from "../../constants/retail";
import { findPackForCatalogItemId } from "../../data/boxCatalog";
import {
  buildLobbySimTierPools,
  spawnLobbySimPullTile,
  type LobbySimPullTile,
} from "../../utils/lobbyJustPulledSim";
import { resolveCollectibleImageSrc } from "../../utils/collectibleImageSrc";
import { MobileHomeLogoButton } from "./MobileHomeLogoButton";
import { JustPulledDetailModal } from "./JustPulledDetailModal";
import { JustPulledHorizontalFeed } from "./JustPulledHorizontalFeed";
import type { JustPulledFeedHandle } from "./JustPulledHorizontalFeed";
import { PackCatalogImage } from "./PackCatalogImage";
import { PackTileTopBadges } from "./PackTileTopBadges";
import { RipAmbientShell } from "./rip/RipAmbientShell";
import { BalancePill } from "./rip/BalancePill";
import { CategorySelector } from "./rip/CategorySelector";
import { CategorySheet } from "./rip/CategorySheet";
import { AddFundsModal } from "./rip/AddFundsModal";
import { hapticMediumImpact } from "../../utils/mobileHaptics";
import { mobileHeaderSafePaddingStyle } from "./mobileShellTheme";
import { isLimitedDropPackId, isInfiniteSeriesPackId, type LimitedDropPackId } from "../../constants/packs";
import { normalizePackId } from "../../constants/packIdAliases";
import { getLimitedDropWindowState } from "../../utils/limitedDropWindows";
import { formatPackTopHitUsd } from "../../utils/packValueRange";
import { preloadImageUrls, resolvePackCoverUrl } from "../../utils/packCoverUrl";
import featuredWotcBanner from "../../assets/banners/featured-wotc-banner.png";
import featured1999GodBanner from "../../assets/banners/featured-1999-god-banner.png";
import featuredLegendaryHuntBanner from "../../assets/banners/featured-legendary-hunt-banner.png";
import packBattlesBanner from "../../assets/banners/pack-battles-banner.png";

/**
 * Category picker is hidden while the catalog is Pokémon-only (a single-option
 * dropdown is pointless). Flip to `true` to re-enable once more categories exist —
 * all the underlying logic (CategorySelector, CategorySheet, handlers, filtering)
 * is left intact.
 */
const SHOW_CATEGORY_SELECTOR = false;

const JUST_PULLED_REFRESH_MS = 3_000;
const JUST_PULLED_WINDOW_MS = 60_000;
const LOBBY_SIM_SEED_AGES_SEC = [2, 5, 11, 19, 28, 37, 48, 58];
const HERO_BANNER_ROTATE_MS = 4_000;
const LOBBY_SCROLL_STORAGE_KEY = "winrips.mobileLobby.scrollTop";

interface LimitedDropUiConfig {
  packId: LimitedDropPackId;
  badgeEmoji: string;
  badgeLabel: string;
  badgeClass: string;
  overlayClass: string;
  borderClass: string;
  showCountdown: boolean;
}

const LIMITED_DROP_UI: LimitedDropUiConfig[] = [
  {
    packId: "power-hour",
    badgeEmoji: "⚡",
    badgeLabel: "Power Hour",
    badgeClass: "bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.45)]",
    overlayClass: "from-amber-400/35 via-amber-500/12 to-transparent",
    borderClass: "border-amber-400/25",
    showCountdown: true,
  },
  {
    packId: "midnight-grail",
    badgeEmoji: "🌙",
    badgeLabel: "Midnight Grail",
    badgeClass: "bg-violet-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.45)]",
    overlayClass: "from-violet-500/35 via-purple-900/15 to-transparent",
    borderClass: "border-violet-400/25",
    showCountdown: true,
  },
  {
    packId: "flash",
    badgeEmoji: "🔥",
    badgeLabel: "Flash Pack",
    badgeClass: "bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.45)]",
    overlayClass: "from-orange-500/35 via-red-900/15 to-transparent",
    borderClass: "border-orange-400/25",
    showCountdown: false,
  },
  {
    packId: "weekend-warrior",
    badgeEmoji: "👑",
    badgeLabel: "Weekend Warrior",
    badgeClass: "bg-yellow-400 text-black shadow-[0_0_12px_rgba(234,179,8,0.45)]",
    overlayClass: "from-yellow-400/30 via-amber-900/12 to-transparent",
    borderClass: "border-yellow-400/25",
    showCountdown: true,
  },
];

interface HeroBannerSlide {
  id: string;
  title: string;
  packId: string;
  imageSrc: string;
  targetView?: "battles";
}

const HERO_BANNER_SLIDES: HeroBannerSlide[] = [
  {
    id: "featured-wotc",
    title: "WOTC First Edition",
    packId: "wotc-first-edition",
    imageSrc: featuredWotcBanner,
  },
  {
    id: "featured-1999-god",
    title: "1999 God Pack",
    packId: "god-pack-1999",
    imageSrc: featured1999GodBanner,
  },
  {
    id: "featured-legendary-hunt",
    title: "Legendary Hunt",
    packId: "legendary-hunt",
    imageSrc: featuredLegendaryHuntBanner,
  },
  {
    id: "featured-pack-battles",
    title: "Pack Battles",
    packId: "",
    imageSrc: packBattlesBanner,
    targetView: "battles",
  },
];

const HERO_BANNER_OVERLAY = "bg-gradient-to-t from-black/40 via-transparent to-transparent";

/** Dominant accent per regular pack — subtle image glow in the lobby row. */
const REGULAR_PACK_GLOW_COLORS: Record<string, string> = {
  "trainers-starter": "#FF007F",
  "mega-evolution": "#9B59B6",
  "151-booster-collector": "#3498DB",
  "legendary-hunt": "#27AE60",
  "shiny-vault": "#BDC3C7",
  "prismatic-sir": "#FF6B9D",
  "evolving-skies": "#1ABC9C",
  "psa-10-chaser": "#E74C3C",
  "obsidian-vault": "#6C3483",
  "god-pack-1999": "#F39C12",
  "wotc-first-edition": "#D4AC0D",
  "waifu-vault": "#FF69B4",
};

function regularPackGlowColor(packId: string): string | undefined {
  return REGULAR_PACK_GLOW_COLORS[normalizePackId(packId)];
}

/** Gold accent for Infinite Series high-roller row. */
const INFINITE_SERIES_GLOW = "#D4AF37";

function InfiniteSeriesSectionHeader() {
  return (
    <div className="flex items-center gap-2.5 px-6">
      <span
        className="h-2 w-2 shrink-0 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.75)]"
        style={{ backgroundColor: INFINITE_SERIES_GLOW }}
        aria-hidden
      />
      <h2 className="text-[18px] font-semibold tracking-tight text-white">Infinite Series</h2>
      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200/90">
        High Roller
      </span>
    </div>
  );
}

type JustPulledTile = LobbySimPullTile;

function buildJustPulledDisplay(items: JustPulledTile[], nowMs: number): JustPulledTile[] {
  const sortedNewestFirst = [...items].sort(
    (a, b) => new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime(),
  );

  const recentNewestFirst = sortedNewestFirst.filter((item) => {
    const ageMs = nowMs - new Date(item.acquiredAt).getTime();
    return ageMs >= 0 && ageMs <= JUST_PULLED_WINDOW_MS;
  });

  if (recentNewestFirst.length > 0) {
    return [...recentNewestFirst].reverse();
  }

  return sortedNewestFirst.slice(0, 20).reverse();
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="px-6 text-[18px] font-semibold tracking-tight text-white">{title}</h2>
  );
}

function LiveSectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2.5 px-6">
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--rip-green-bright)] opacity-50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--rip-green-bright)]" />
      </span>
      <h2 className="text-[18px] font-semibold tracking-tight text-white">{title}</h2>
    </div>
  );
}

function FeaturedHeroBannerSlide({
  slide,
  pack,
  onSelectPack,
  onSelectView,
}: {
  slide: HeroBannerSlide;
  pack?: Pack;
  onSelectPack: (pack: Pack) => void;
  onSelectView: () => void;
}) {
  const canOpenBattleView = slide.targetView === "battles";
  const disabled = !pack && !canOpenBattleView;
  const label = canOpenBattleView
    ? "Open Pack Battles"
    : `Open ${pack?.name ?? slide.title}`;

  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={() => {
        if (disabled) return;
        if (canOpenBattleView) {
          onSelectView();
          return;
        }
        if (pack) onSelectPack(pack);
      }}
      disabled={disabled}
      aria-label={label}
      className={`relative flex h-[200px] w-full shrink-0 snap-center items-end overflow-hidden rounded-2xl bg-black text-left${
        disabled ? " opacity-50" : ""
      }`}
      style={{ boxShadow: "var(--rip-shadow-pack)" }}
    >
      <img
        src={slide.imageSrc}
        alt={slide.title}
        className="absolute inset-0 h-full w-full object-cover object-center"
        draggable={false}
      />
      <div className={`pointer-events-none absolute inset-0 ${HERO_BANNER_OVERLAY}`} aria-hidden />
    </motion.button>
  );
}

function LimitedDropCard({
  pack,
  config,
  nowMs,
  index,
  onSelect,
}: {
  pack: Pack;
  config: LimitedDropUiConfig;
  nowMs: number;
  index: number;
  onSelect: (pack: Pack) => void;
}) {
  const windowState = useMemo(
    () => getLimitedDropWindowState(config.packId, nowMs),
    [config.packId, nowMs],
  );

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(pack)}
      aria-label={`View ${pack.name} details`}
      className={`flex w-[44vw] shrink-0 snap-start flex-col text-left${
        index === 0 ? " ml-4" : ""
      }`}
    >
      <div
        className={`flex aspect-[2/3.35] w-full flex-col overflow-hidden rounded-2xl border bg-[#111] ${config.borderClass}`}
        style={{ boxShadow: "var(--rip-shadow-pack)" }}
      >
        <div className="relative min-h-0 flex-[4] overflow-hidden">
          <PackCatalogImage
            packId={pack.id}
            src={pack.image}
            alt={pack.name}
            priority={index < 2}
            className="h-full w-full"
          />
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b ${config.overlayClass}`}
            aria-hidden
          />
          <div
            className={`absolute left-2 top-2 z-20 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${config.badgeClass}`}
          >
            <span aria-hidden>{config.badgeEmoji}</span>
            {config.badgeLabel}
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-b from-transparent to-[#111]"
            aria-hidden
          />
        </div>
        <div className="flex min-h-0 flex-[1] flex-col justify-center gap-1 px-2.5 py-2">
          <span className="w-fit rounded-full border border-amber-400/30 bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-300">
            ⚡ BOOSTED PULL RATES
          </span>
          <p className="truncate text-[14px] font-bold leading-tight text-white">{pack.name}</p>
          <p className="shrink-0 text-[12px] font-bold tabular-nums text-[var(--rip-green-bright)]">
            {formatUsd(gemsToUsd(pack.cost))}
          </p>
          {windowState.isLive ? (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--rip-green-bright)] opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--rip-green-bright)]" />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--rip-green-bright)]">
                Live now
              </p>
            </div>
          ) : config.showCountdown ? (
            <p className="text-[11px] font-semibold tabular-nums text-white/70">
              Starts in {windowState.countdownLabel}
            </p>
          ) : null}
        </div>
      </div>
    </motion.button>
  );
}

function FeaturedHeroCarousel({
  slides,
  packById,
  onSelectPack,
  onSelectBattle,
  isActive,
}: {
  slides: HeroBannerSlide[];
  packById: Map<string, Pack>;
  onSelectPack: (pack: Pack) => void;
  onSelectBattle: () => void;
  isActive: boolean;
}) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const userInteractingRef = useRef(false);
  const scrollEndTimerRef = useRef<number | null>(null);

  const resolvedSlides = useMemo(
    () =>
      slides
        .map((slide) => {
          if (slide.targetView === "battles") {
            return { slide, pack: undefined };
          }
          const pack = packById.get(slide.packId);
          return pack ? { slide, pack } : null;
        })
        .filter((entry): entry is { slide: HeroBannerSlide; pack?: Pack } => entry !== null),
    [slides, packById],
  );

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const scroller = carouselRef.current;
    if (!scroller || resolvedSlides.length === 0) return;

    const length = resolvedSlides.length;
    const current = activeIndexRef.current;
    const clamped = ((index % length) + length) % length;
    const isLoopReset = length > 1 && current === length - 1 && clamped === 0 && index >= length;

    if (isLoopReset) {
      scroller.style.scrollBehavior = "auto";
      scroller.scrollLeft = 0;
      activeIndexRef.current = 0;
      setActiveIndex(0);
      requestAnimationFrame(() => {
        if (carouselRef.current) {
          carouselRef.current.style.scrollBehavior = "";
        }
      });
      return;
    }

    scroller.scrollTo({ left: scroller.clientWidth * clamped, behavior });
    activeIndexRef.current = clamped;
    setActiveIndex(clamped);
  }, [resolvedSlides.length]);

  useEffect(() => {
    if (!isActive || resolvedSlides.length <= 1) return;

    const intervalId = window.setInterval(() => {
      if (userInteractingRef.current) return;
      scrollToIndex(activeIndexRef.current + 1);
    }, HERO_BANNER_ROTATE_MS);

    return () => window.clearInterval(intervalId);
  }, [isActive, resolvedSlides.length, scrollToIndex]);

  const handleScroll = useCallback(() => {
    userInteractingRef.current = true;
    if (scrollEndTimerRef.current !== null) {
      window.clearTimeout(scrollEndTimerRef.current);
    }

    scrollEndTimerRef.current = window.setTimeout(() => {
      const scroller = carouselRef.current;
      if (!scroller || scroller.clientWidth <= 0) return;

      const nextIndex = Math.round(scroller.scrollLeft / scroller.clientWidth);
      const clamped = Math.max(0, Math.min(nextIndex, resolvedSlides.length - 1));
      activeIndexRef.current = clamped;
      setActiveIndex(clamped);
      userInteractingRef.current = false;
    }, 120);
  }, [resolvedSlides.length]);

  useEffect(
    () => () => {
      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
    },
    [],
  );

  if (resolvedSlides.length === 0) return null;

  return (
    <div className="relative mx-6">
      <div
        ref={carouselRef}
        onScroll={handleScroll}
        className="rip-hide-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-2xl"
        aria-roledescription="carousel"
        aria-label="Featured pack banners"
      >
        {resolvedSlides.map(({ slide, pack }) => (
          <FeaturedHeroBannerSlide
            key={slide.id}
            slide={slide}
            pack={pack}
            onSelectPack={onSelectPack}
            onSelectView={() => onSelectBattle()}
          />
        ))}
      </div>

      {resolvedSlides.length > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {resolvedSlides.map(({ slide }, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={slide.packId}
                type="button"
                aria-label={`Go to banner ${index + 1}`}
                aria-current={selected ? "true" : undefined}
                onClick={() => {
                  userInteractingRef.current = true;
                  scrollToIndex(index);
                  window.setTimeout(() => {
                    userInteractingRef.current = false;
                  }, HERO_BANNER_ROTATE_MS);
                }}
                className={`pointer-events-auto rounded-full transition-all duration-300 ${
                  selected ? "h-1.5 w-5 bg-white" : "h-1.5 w-1.5 bg-white/40"
                }`}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const BATTLE_LIVE_COUNT = 47;
const BATTLE_PREVIEW_ROTATE_MS = 5_000;
const BATTLE_PREVIEW_COUNT = 3;

function pickRandomBattlePreviewPacks(allPacks: Pack[], count = BATTLE_PREVIEW_COUNT): Pack[] {
  if (allPacks.length === 0) return [];
  if (allPacks.length <= count) return [...allPacks];
  const pool = [...allPacks];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, count);
}

function BattlePreviewThumbnails({ packs }: { packs: Pack[] }) {
  if (packs.length === 0) return null;

  return (
    <div className="flex min-h-[72px] items-center justify-center py-0.5">
      {packs.map((pack, index) => (
        <div
          key={pack.id}
          className="relative h-[72px] w-[52px] overflow-hidden rounded-lg border border-red-900/50 bg-black/40"
          style={{
            marginLeft: index === 0 ? 0 : -14,
            zIndex: packs.length - index,
            transform: `rotate(${(index - 1) * 10}deg)`,
            boxShadow: "0 0 14px rgba(127,29,29,0.55), 0 0 6px rgba(220,38,38,0.35)",
          }}
        >
          <PackCatalogImage
            packId={pack.id}
            src={pack.image}
            alt={pack.name}
            className="h-full w-full"
          />
        </div>
      ))}
    </div>
  );
}

function BattleModePromoCard({
  onPress,
  allPacks,
  isActive,
}: {
  onPress: () => void;
  allPacks: Pack[];
  isActive: boolean;
}) {
  const [previewPacks, setPreviewPacks] = useState<Pack[]>(() =>
    pickRandomBattlePreviewPacks(allPacks),
  );

  useEffect(() => {
    if (allPacks.length === 0) {
      setPreviewPacks([]);
      return;
    }
    setPreviewPacks(pickRandomBattlePreviewPacks(allPacks));
  }, [allPacks]);

  useEffect(() => {
    if (!isActive || allPacks.length < BATTLE_PREVIEW_COUNT) return;

    const intervalId = window.setInterval(() => {
      setPreviewPacks(pickRandomBattlePreviewPacks(allPacks));
    }, BATTLE_PREVIEW_ROTATE_MS);

    return () => window.clearInterval(intervalId);
  }, [isActive, allPacks]);

  const previewKey = previewPacks.map((pack) => pack.id).join("|");

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        void hapticMediumImpact();
        onPress();
      }}
      aria-label="Open Pack Battles"
      className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a0000] to-[#0a0000] text-center"
    >
      <div
        aria-hidden
        className="battle-neon-border pointer-events-none absolute inset-0 rounded-2xl"
      />

      <div className="relative z-10 flex flex-col items-center gap-4 px-5 py-5">
        <p className="text-[18px] font-bold tracking-wide text-white">⚔️ BATTLE MODE</p>

        <p className="max-w-[300px] text-[12px] leading-relaxed text-white/50">
          Open the same pack as your opponent. Higher card value wins — you keep your card no
          matter what.
        </p>

        <div className="relative flex min-h-[72px] w-full items-center justify-center py-0.5">
          <AnimatePresence mode="sync">
            <motion.div
              key={previewKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <BattlePreviewThumbnails packs={previewPacks} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col items-center gap-3 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--rip-green-bright)] opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--rip-green-bright)]" />
            </span>
            <span className="text-[11px] font-semibold tabular-nums text-[var(--rip-green-bright)]">
              {BATTLE_LIVE_COUNT} battles live
            </span>
          </div>
          <span className="rounded-full bg-fuchsia-500 px-4 py-2 text-[12px] font-bold text-white shadow-[0_0_16px_rgba(236,72,153,0.35)]">
            Battle Now →
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export function MobileRipLobby({ isActive = true }: { isActive?: boolean }) {
  const { packs: catalogPacks, loading, refreshBoxesCatalog } = useBoxesCatalog();
  const { selectPack, navigateToView } = useApp();

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [justPulled, setJustPulled] = useState<JustPulledTile[]>([]);
  const [feedNow, setFeedNow] = useState(() => Date.now());
  const [selectedJustPulled, setSelectedJustPulled] = useState<JustPulledTile | null>(null);

  const justPulledListRef = useRef<JustPulledFeedHandle>(null);
  const lobbyScrollRef = useRef<HTMLDivElement>(null);

  const justPulledTiles = useMemo(
    () => buildJustPulledDisplay(justPulled, feedNow),
    [justPulled, feedNow],
  );

  useEffect(() => {
    if (!isActive || justPulledTiles.length === 0) return;

    for (const tile of justPulledTiles) {
      const url = resolveCollectibleImageSrc(tile.image, { thumbnail: false });
      if (!url) continue;
      const img = new Image();
      img.decoding = "sync";
      img.src = url;
    }
  }, [isActive, justPulledTiles]);

  const selectedJustPulledPack = useMemo(
    () =>
      selectedJustPulled
        ? findPackForCatalogItemId(selectedJustPulled.itemId, selectedJustPulled.value) ?? null
        : null,
    [selectedJustPulled],
  );

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

  useEffect(() => {
    if (catalogPacksFlat.length === 0) return;

    preloadImageUrls(
      catalogPacksFlat.map((pack) => resolvePackCoverUrl(pack.id, pack.image)),
    );
    preloadImageUrls(HERO_BANNER_SLIDES.map((slide) => slide.imageSrc));
  }, [catalogPacksFlat]);

  const packById = useMemo(() => {
    const map = new Map<string, Pack>();
    for (const pack of catalogPacksFlat) {
      map.set(pack.id, pack);
    }
    return map;
  }, [catalogPacksFlat]);

  // Regular Packs row: cheapest -> most expensive, left to right.
  const openPackRow = useMemo(
    () =>
      [...catalogPacksFlat]
        .filter((pack) => !isLimitedDropPackId(pack.id) && !isInfiniteSeriesPackId(pack.id))
        .sort((a, b) => a.cost - b.cost),
    [catalogPacksFlat],
  );

  const infiniteSeriesRow = useMemo(
    () =>
      [...catalogPacksFlat]
        .filter((pack) => isInfiniteSeriesPackId(pack.id))
        .sort((a, b) => a.cost - b.cost),
    [catalogPacksFlat],
  );

  const limitedDropEntries = useMemo(
    () =>
      LIMITED_DROP_UI.map((config) => {
        const pack = packById.get(config.packId);
        return pack ? { config, pack } : null;
      }).filter((entry): entry is { config: LimitedDropUiConfig; pack: Pack } => entry !== null),
    [packById],
  );

  useEffect(() => {
    if (!isActive) return;

    const clockId = window.setInterval(() => {
      setFeedNow(Date.now());
    }, 15_000);

    return () => window.clearInterval(clockId);
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    void refreshBoxesCatalog();
  }, [isActive, refreshBoxesCatalog]);

  useEffect(() => {
    const scroller = lobbyScrollRef.current;
    if (!scroller) return;
    const savedTop = window.sessionStorage.getItem(LOBBY_SCROLL_STORAGE_KEY);
    const parsedTop = Number(savedTop);
    if (Number.isFinite(parsedTop) && parsedTop > 0) {
      requestAnimationFrame(() => {
        scroller.scrollTop = parsedTop;
      });
    }
  }, []);

  const handleLobbyScroll = useCallback(() => {
    const scroller = lobbyScrollRef.current;
    if (!scroller) return;
    window.sessionStorage.setItem(LOBBY_SCROLL_STORAGE_KEY, String(scroller.scrollTop));
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const tierPools = buildLobbySimTierPools();
    let seq = 0;

    const spawn = (ageSec: number) => {
      seq += 1;
      return spawnLobbySimPullTile(tierPools, seq, ageSec);
    };

    setJustPulled(LOBBY_SIM_SEED_AGES_SEC.map((ageSec) => spawn(ageSec)));

    const intervalId = window.setInterval(() => {
      setJustPulled((prev) => [spawn(0), ...prev].slice(0, 20));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          justPulledListRef.current?.scrollByOneItem();
        });
      });
    }, JUST_PULLED_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, [isActive]);

  const handleSelectPack = useCallback(
    (pack: Pack) => {
      void hapticMediumImpact();
      selectPack(pack);
    },
    [selectPack],
  );

  const handleOpenPackFromJustPulled = useCallback(
    (pack: Pack) => {
      setSelectedJustPulled(null);
      handleSelectPack(pack);
    },
    [handleSelectPack],
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
          <MobileHomeLogoButton />
        )}
        <BalancePill onAddFunds={() => setAddFundsOpen(true)} />
      </header>

      {loading && catalogPacksFlat.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-[15px] text-[var(--rip-text-muted)]">
          Loading drops…
        </p>
      ) : (
        <div
          ref={lobbyScrollRef}
          onScroll={handleLobbyScroll}
          className="rip-hide-scrollbar min-h-0 flex-1 space-y-7 overflow-y-auto overflow-x-hidden pb-4 pt-1"
        >
          <FeaturedHeroCarousel
            slides={HERO_BANNER_SLIDES}
            packById={packById}
            isActive={isActive}
            onSelectPack={handleSelectPack}
            onSelectBattle={() => {
              void hapticMediumImpact();
              navigateToView("battles");
            }}
          />

          {/* Regular Packs */}
          {openPackRow.length > 0 ? (
            <section className="space-y-3">
              <SectionHeader title="Regular Packs" />
              <div className="rip-hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden scroll-pl-4 pr-6 pb-1">
                {openPackRow.map((pack, index) => {
                  const glowColor = regularPackGlowColor(pack.id);
                  const topHitLabel = formatPackTopHitUsd(pack.id);
                  return (
                    <motion.button
                      key={pack.id}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        handleSelectPack(pack);
                      }}
                      aria-label={`Open ${pack.name}`}
                      className={`flex w-[44vw] shrink-0 snap-start flex-col text-left${
                        index === 0 ? " ml-4" : ""
                      }`}
                    >
                      <div
                        className="flex aspect-[2/3.35] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111]"
                        style={{ boxShadow: "var(--rip-shadow-pack)" }}
                      >
                        <div className="relative min-h-0 flex-[4] overflow-hidden">
                          {glowColor ? (
                            <div
                              className="pointer-events-none absolute left-1/2 top-[45%] z-0 h-[72%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
                              style={{ backgroundColor: glowColor, opacity: 0.42 }}
                              aria-hidden
                            />
                          ) : null}
                          <div
                            className="relative z-[1] h-full w-full"
                            style={
                              glowColor
                                ? {
                                    filter: `drop-shadow(0 0 18px ${glowColor}99) drop-shadow(0 0 8px ${glowColor}66)`,
                                  }
                                : undefined
                            }
                          >
                            <PackCatalogImage
                              packId={pack.id}
                              src={pack.image}
                              alt={pack.name}
                              priority={index < 4}
                              className="h-full w-full"
                            />
                          </div>
                          <div
                            className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[45%] bg-gradient-to-b from-transparent to-[#111]"
                            aria-hidden
                          />
                          <PackTileTopBadges topHitLabel={topHitLabel} />
                        </div>
                        <div className="flex min-h-0 flex-[1] flex-col justify-center gap-0.5 px-2.5 py-2">
                          <p className="truncate text-[14px] font-bold leading-tight text-white">
                            {pack.name}
                          </p>
                          <p className="shrink-0 text-[12px] font-bold tabular-nums text-[var(--rip-green-bright)]">
                            {formatUsd(gemsToUsd(pack.cost))}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {limitedDropEntries.length > 0 ? (
            <section className="space-y-3">
              <SectionHeader title="Limited Drops" />
              <div className="rip-hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden scroll-pl-4 pr-6 pb-1">
                {limitedDropEntries.map(({ config, pack }, index) => (
                  <LimitedDropCard
                    key={config.packId}
                    pack={pack}
                    config={config}
                    nowMs={feedNow}
                    index={index}
                    onSelect={handleSelectPack}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {infiniteSeriesRow.length > 0 ? (
            <section className="space-y-3">
              <InfiniteSeriesSectionHeader />
              <div className="rip-hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden scroll-pl-4 pr-6 pb-1">
                {infiniteSeriesRow.map((pack, index) => {
                  const topHitLabel = formatPackTopHitUsd(pack.id);
                  const isOmega = pack.id === "infinite-omega";
                  return (
                    <motion.button
                      key={pack.id}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        handleSelectPack(pack);
                      }}
                      aria-label={`Open ${pack.name}`}
                      className={`flex w-[44vw] shrink-0 snap-start flex-col text-left${
                        index === 0 ? " ml-4" : ""
                      }`}
                    >
                      <div
                        className={`flex aspect-[2/3.35] w-full flex-col overflow-hidden rounded-2xl border bg-[#111] ${
                          isOmega
                            ? "infinite-omega-pack-frame border-amber-300/50"
                            : "border-amber-400/35"
                        }`}
                        style={{
                          boxShadow:
                            "0 0 22px rgba(212,175,55,0.22), 0 0 8px rgba(212,175,55,0.12), var(--rip-shadow-pack)",
                        }}
                      >
                        <div className="relative min-h-0 flex-[4] overflow-hidden">
                          <div
                            className="pointer-events-none absolute left-1/2 top-[45%] z-0 h-[72%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
                            style={{ backgroundColor: INFINITE_SERIES_GLOW, opacity: 0.48 }}
                            aria-hidden
                          />
                          <div
                            className="relative z-[1] h-full w-full"
                            style={{
                              filter: `drop-shadow(0 0 20px ${INFINITE_SERIES_GLOW}aa) drop-shadow(0 0 10px ${INFINITE_SERIES_GLOW}77)`,
                            }}
                          >
                            <PackCatalogImage
                              packId={pack.id}
                              src={pack.image}
                              alt={pack.name}
                              priority={index < 2}
                              className="h-full w-full"
                            />
                          </div>
                          <div
                            className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[45%] bg-gradient-to-b from-transparent to-[#111]"
                            aria-hidden
                          />
                          <PackTileTopBadges
                            topHitLabel={topHitLabel}
                            infiniteLabel={isOmega ? "∞ Legendary" : "∞ Infinite"}
                            compactTopHit
                          />
                        </div>
                        <div className="flex min-h-0 flex-[1] flex-col justify-center gap-0.5 px-2.5 py-2">
                          <p className="truncate text-[14px] font-bold leading-tight text-white">
                            {pack.name}
                          </p>
                          <p className="shrink-0 text-[12px] font-bold tabular-nums text-amber-200">
                            {formatUsd(gemsToUsd(pack.cost))}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="px-4">
            <BattleModePromoCard
              allPacks={catalogPacks}
              isActive={isActive}
              onPress={() => navigateToView("battles")}
            />
          </section>

          {/* Just Pulled */}
          {justPulledTiles.length > 0 ? (
            <section className="space-y-3">
              <LiveSectionHeader title="Just Pulled" />
              <JustPulledHorizontalFeed
                tiles={justPulledTiles}
                nowMs={feedNow}
                listRef={justPulledListRef}
                onTileClick={(tile) => {
                  void hapticMediumImpact();
                  setSelectedJustPulled(tile);
                }}
              />
            </section>
          ) : null}
        </div>
      )}

      <CategorySheet open={categoryOpen} onClose={() => setCategoryOpen(false)} />
      <AddFundsModal open={addFundsOpen} onClose={() => setAddFundsOpen(false)} />
      <JustPulledDetailModal
        open={selectedJustPulled !== null}
        tile={selectedJustPulled}
        pack={selectedJustPulledPack}
        onClose={() => setSelectedJustPulled(null)}
        onOpenPack={handleOpenPackFromJustPulled}
      />
    </RipAmbientShell>
  );
}
