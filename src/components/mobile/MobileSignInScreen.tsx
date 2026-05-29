import { useMemo } from "react";
import { WinRipsLogo } from "../brand/WinRipsLogo";
import { BTN_GHOST_OUTLINE } from "./mobileTheme";
import { POKEMON_ITEMS } from "../../constants/pokemonCatalog";

const COLLAGE_TILE_COUNT = 12;

/** Highest-value grail card art, deduped, padded to fill the collage grid. */
function useGrailCollageImages(): string[] {
  return useMemo(() => {
    const seen = new Set<string>();
    const urls: string[] = [];
    for (const item of [...POKEMON_ITEMS].sort((a, b) => b.value - a.value)) {
      const src = item.image?.trim();
      if (!src || seen.has(src)) continue;
      seen.add(src);
      urls.push(src);
      if (urls.length >= COLLAGE_TILE_COUNT) break;
    }
    if (urls.length === 0) return [];
    const filled = [...urls];
    for (let i = 0; filled.length < COLLAGE_TILE_COUNT; i += 1) {
      filled.push(urls[i % urls.length]!);
    }
    return filled;
  }, []);
}

export function MobileSignInScreen({ onBrowsePacks, onSignIn }: MobileSignInScreenProps) {
  const collageImages = useGrailCollageImages();

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-black"
      data-shell="mobile"
    >
      {/* Blurred grail-card collage backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="grid h-full w-full scale-110 grid-cols-3 grid-rows-4 gap-2 opacity-50 blur-2xl">
          {collageImages.map((src, index) => (
            <img
              key={`${src}-${index}`}
              src={src}
              alt=""
              className="h-full w-full rounded-lg object-cover"
              loading="eager"
              decoding="async"
              draggable={false}
            />
          ))}
        </div>
      </div>

      {/* Gold glow accent */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 12%, rgba(212, 175, 55, 0.18), transparent 55%)",
        }}
        aria-hidden
      />

      {/* Dark scrim — darker toward the bottom where the buttons sit */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.32) 28%, rgba(0,0,0,0.78) 66%, rgba(0,0,0,0.97) 100%)",
        }}
        aria-hidden
      />

      <div
        className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6"
        style={{ paddingTop: "max(0px, env(safe-area-inset-top))" }}
      >
        <WinRipsLogo className="block h-16 w-auto object-contain" maxWidth={300} />

        <h1 className="mt-9 text-center text-[27px] font-extrabold leading-[1.15] tracking-tight text-white">
          Rip packs. Pull grails.
          <br />
          Real cards.
        </h1>
        <p className="mt-3 max-w-xs text-center text-[14px] leading-relaxed text-white/70">
          Open premium trading card packs — then cash out or ship the real thing.
        </p>
      </div>

      <div
        className="relative shrink-0 space-y-3 overflow-hidden px-6 pt-4"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={onBrowsePacks}
          className="w-full rounded-full bg-[#FF007F] py-4 text-center text-[15px] font-bold tracking-wide text-white shadow-[0_0_40px_rgba(255,0,127,0.22)] transition-transform active:scale-[0.98]"
        >
          Browse Packs
        </button>

        <button type="button" onClick={onSignIn} className={`w-full ${BTN_GHOST_OUTLINE}`}>
          Sign In
        </button>
      </div>
    </div>
  );
}

interface MobileSignInScreenProps {
  onBrowsePacks: () => void;
  onSignIn: () => void;
}
