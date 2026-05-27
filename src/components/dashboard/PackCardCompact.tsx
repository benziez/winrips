import { useEffect, useMemo, useRef, useState } from "react";
import type { Pack } from "../../types";
import { formatGems } from "../../constants/retail";
import { useApp } from "../../context/AppContext";
import { CollectibleImage } from "../ui/CollectibleImage";
import { CYCLE_MS, getTopValueDropImages } from "../../utils/packPreviewImages";
import { resolvePackCycleSlides, resolvePackLobbyCover } from "../../utils/packLobbyImages";

function displayName(name: string): string {
  return name.replace(/ Pack$| Box$| Drop$| Edition$| Booster$/, "");
}

interface PackCardCompactProps {
  pack: Pack;
  priority?: boolean;
  index?: number;
}

interface StablePackCardSnapshot {
  pack: Pack;
  packImage: string;
  cycleSlides: string[];
}

function isPackDataEmpty(pack: Pack): boolean {
  return !pack.id?.trim() || !pack.name?.trim();
}

function resolveStablePackCardState(
  pack: Pack,
  stableRef: React.MutableRefObject<StablePackCardSnapshot | null>,
): StablePackCardSnapshot {
  const previous = stableRef.current;
  const incomingImage = pack.image?.trim() ?? "";
  const incomingSlides = resolvePackCycleSlides(pack.id, pack, getTopValueDropImages(pack));
  const packDataEmpty = isPackDataEmpty(pack);
  const imageEmpty = !incomingImage;

  const incomingLooksEmpty = packDataEmpty || imageEmpty;

  if (previous && (incomingLooksEmpty || (pack.id === previous.pack.id && imageEmpty))) {
    if (incomingLooksEmpty || imageEmpty) {
      console.warn(`PackCardCompact: Blocked empty re-render for packId ${pack.id || previous.pack.id}`);
    }
    return previous;
  }

  const packImage =
    incomingImage ||
    previous?.packImage ||
    resolvePackLobbyCover(pack.id, pack.image);
  const cycleSlides = incomingSlides.length > 0 ? incomingSlides : (previous?.cycleSlides ?? []);

  const displayPack: Pack = packDataEmpty && previous
    ? previous.pack
    : {
        ...pack,
        image: packImage,
      };

  const next: StablePackCardSnapshot = {
    pack: displayPack,
    packImage,
    cycleSlides,
  };

  stableRef.current = next;
  return next;
}

export function PackCardCompact({ pack, priority = false, index = 0 }: PackCardCompactProps) {
  const { selectPack } = useApp();
  const stableDataRef = useRef<StablePackCardSnapshot | null>(null);

  const display = useMemo(
    () => resolveStablePackCardState(pack, stableDataRef),
    [pack],
  );

  const { pack: displayPack, packImage, cycleSlides } = display;
  const [cycleIndex, setCycleIndex] = useState(0);
  const [overlayVisible, setOverlayVisible] = useState(true);

  useEffect(() => {
    setCycleIndex(0);
    setOverlayVisible(true);
  }, [displayPack.id, cycleSlides.length]);

  useEffect(() => {
    if (cycleSlides.length <= 1) return;

    const intervalId = setInterval(() => {
      setOverlayVisible(false);
      setTimeout(() => {
        setCycleIndex((current) => (current + 1) % cycleSlides.length);
        setOverlayVisible(true);
      }, 80);
    }, CYCLE_MS);

    return () => clearInterval(intervalId);
  }, [cycleSlides.length]);

  const overlaySrc = cycleSlides[cycleIndex] ?? "";

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => selectPack(displayPack)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectPack(displayPack);
        }
      }}
      className="vault-door group relative flex w-full animate-fade-in-up cursor-pointer flex-col overflow-hidden transition-transform duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fuchsia group-hover:scale-[1.02] group-hover:-translate-y-1 group-hover:shadow-[0_10px_40px_-10px_rgba(217,70,239,0.4)]"
      style={{ animationDelay: `${index * 75}ms` }}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-elevated/50 p-2">
        <CollectibleImage
          src={packImage}
          category={displayPack.category}
          alt={displayPack.name}
          priority={priority}
          thumbnail={false}
          optimize={false}
          forceShow
          aspectRatio="1 / 1"
          frameClassName="relative h-full w-full p-1"
          className="h-full w-full object-contain"
        />
        <div
          className={`pointer-events-none absolute inset-0 z-10 p-2 transition-opacity duration-500 ${
            overlayVisible && overlaySrc ? "opacity-100" : "opacity-0"
          }`}
        >
          <CollectibleImage
            src={overlaySrc}
            category={displayPack.category}
            alt=""
            thumbnail={false}
            optimize={false}
            forceShow
            aspectRatio="1 / 1"
            frameClassName="relative h-full w-full p-1"
            className="h-full w-full object-contain"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute inset-0 translate-x-full bg-gradient-to-tr from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:-translate-x-full" />
        </div>
      </div>

      <div className="border-t border-border bg-slate px-2 py-2">
        <p className="truncate text-[10px] font-semibold leading-tight text-white">
          {displayName(displayPack.name)}
        </p>
        <p className="mt-0.5 text-[9px] font-bold tabular-nums text-slate-400 group-hover:text-fuchsia">
          {formatGems(displayPack.cost)}
        </p>
      </div>
    </article>
  );
}
