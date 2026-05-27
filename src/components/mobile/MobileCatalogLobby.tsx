import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Pack } from "../../types";
import { useBoxesCatalog } from "../../context/BoxesCatalogContext";
import { LOBBY_SECTIONS, packsForLobbySection } from "../../data/lobbySections";
import { MobileCatalogPackTile } from "./MobileCatalogPackTile";
import { PackDetailSheet } from "./PackDetailSheet";
import { WhatsInsideModal } from "./WhatsInsideModal";
import { OBSIDIAN_GOLD, mobileSafeAreaTopStyle } from "./mobileTheme";

const SLIDE_WIDTH_VW = 88;

export function MobileCatalogLobby() {
  const { packs: catalogPacks, loading } = useBoxesCatalog();
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [whatsInsidePack, setWhatsInsidePack] = useState<Pack | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
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
    updateActiveFromScroll();
  }, [catalogPacksFlat.length, updateActiveFromScroll]);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-black">
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <div
          className="h-[min(80vw,420px)] w-[min(80vw,420px)] rounded-full opacity-40 blur-[120px]"
          style={{ backgroundColor: OBSIDIAN_GOLD.glow }}
        />
      </div>

      <header className="relative z-10 shrink-0 px-6 pb-3" style={mobileSafeAreaTopStyle}>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Drops</h1>
        <p className="mt-1 text-sm font-light text-[#A1A1AA]">Swipe · tap to view</p>
      </header>

      {loading && catalogPacks.length === 0 ? (
        <p className="relative z-10 flex flex-1 items-center justify-center text-sm text-[#A1A1AA]">
          Loading drops…
        </p>
      ) : (
        <div className="relative z-10 min-h-0 flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            onScroll={updateActiveFromScroll}
            className="mobile-snap-carousel flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-none"
            style={{
              scrollPaddingInline: `${(100 - SLIDE_WIDTH_VW) / 2}vw`,
            }}
          >
            {catalogPacksFlat.map((pack, index) => (
              <div
                key={pack.id}
                data-pack-slide
                className="flex h-full w-[88vw] shrink-0 snap-center items-center justify-center"
              >
                <MobileCatalogPackTile
                  pack={pack}
                  priority={index < 3}
                  isActive={index === activeIndex}
                  onSelect={() => setSelectedPack(pack)}
                />
              </div>
            ))}
          </div>

          {catalogPacksFlat.length > 1 ? (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
              {catalogPacksFlat.map((pack, index) => (
                <span
                  key={pack.id}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === activeIndex ? "w-6" : "w-1 bg-white/15"
                  }`}
                  style={
                    index === activeIndex
                      ? { backgroundColor: OBSIDIAN_GOLD.bright }
                      : undefined
                  }
                  aria-hidden
                />
              ))}
            </div>
          ) : null}
        </div>
      )}

      {selectedPack ? (
        <PackDetailSheet
          pack={selectedPack}
          onClose={() => setSelectedPack(null)}
          onWhatsInside={() => {
            setWhatsInsidePack(selectedPack);
            setSelectedPack(null);
          }}
        />
      ) : null}

      {whatsInsidePack ? (
        <WhatsInsideModal
          packId={whatsInsidePack.id}
          packName={whatsInsidePack.name}
          onClose={() => setWhatsInsidePack(null)}
        />
      ) : null}
    </div>
  );
}
