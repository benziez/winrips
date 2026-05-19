type TileKind = "psa-slab" | "sports-slab" | "charizard" | "mystery-box" | "holo-pack" | "gold-slab";

const TILE_KINDS: TileKind[] = [
  "psa-slab",
  "sports-slab",
  "charizard",
  "mystery-box",
  "holo-pack",
  "gold-slab",
];

const REEL_COUNT = 7;
const TILES_PER_REEL = 14;

function buildReelTiles(seed: number): TileKind[] {
  const tiles: TileKind[] = [];
  for (let i = 0; i < TILES_PER_REEL; i++) {
    tiles.push(TILE_KINDS[(seed * 13 + i * 5) % TILE_KINDS.length]!);
  }
  return tiles;
}

function CollectibleTile({ kind }: { kind: TileKind }) {
  if (kind === "mystery-box") {
    return (
      <div className="mx-auto flex h-[5.5rem] w-[4.25rem] shrink-0 flex-col overflow-hidden rounded-md border border-[#FF007F]/25 bg-gradient-to-br from-[#1A1020] via-[#121318] to-[#0A0A0C] shadow-[0_0_24px_rgba(255,0,127,0.12)]">
        <div className="h-2 bg-[#FF007F]/80" />
        <div className="flex flex-1 items-center justify-center p-1.5">
          <div className="h-full w-full rounded border border-white/10 bg-gradient-to-br from-fuchsia/30 to-[#2A1030]" />
        </div>
        <span className="py-0.5 text-center text-[6px] font-bold uppercase tracking-widest text-[#FF007F]/70">
          Vault
        </span>
      </div>
    );
  }

  if (kind === "holo-pack") {
    return (
      <div className="mx-auto h-[5.5rem] w-[4.25rem] shrink-0 overflow-hidden rounded-md border border-cyan/20 bg-gradient-to-br from-[#0C1820] to-[#06080C] shadow-[0_0_18px_rgba(0,229,255,0.08)]">
        <div className="h-full w-full bg-[linear-gradient(135deg,rgba(0,229,255,0.15)_0%,transparent_40%,rgba(255,0,127,0.12)_100%)] p-1.5">
          <div className="h-full w-full rounded border border-white/10 bg-gradient-to-b from-slate-600/40 to-slate-900/80" />
        </div>
      </div>
    );
  }

  const labelBar =
    kind === "psa-slab" ? "bg-red-600" : kind === "sports-slab" ? "bg-blue-700" : "bg-amber-500";

  const cardGradient =
    kind === "charizard"
      ? "from-orange-500/50 via-amber-400/30 to-red-700/40"
      : kind === "gold-slab"
        ? "from-amber-300/40 via-yellow-500/25 to-amber-800/35"
        : kind === "sports-slab"
          ? "from-slate-400/35 via-slate-600/25 to-slate-900/50"
          : "from-violet-400/30 via-fuchsia/20 to-indigo-900/40";

  return (
    <div className="mx-auto h-[5.5rem] w-[3.5rem] shrink-0 overflow-hidden rounded-sm border border-white/15 bg-gradient-to-b from-[#2A2D34] to-[#0D0E12] shadow-lg">
      <div className={`h-2.5 ${labelBar}`} />
      <div className="p-1">
        <div
          className={`h-[3.75rem] w-full rounded-sm border border-white/10 bg-gradient-to-br ${cardGradient} blur-[0.5px]`}
        />
      </div>
      <span className="block py-0.5 text-center text-[5px] font-bold uppercase tracking-wider text-white/40">
        {kind === "psa-slab" ? "PSA 10" : kind === "sports-slab" ? "GEM MT" : "GRAIL"}
      </span>
    </div>
  );
}

function SpinReel({ index }: { index: number }) {
  const tiles = buildReelTiles(index + 1);
  const loop = [...tiles, ...tiles];
  const duration = 5.5 + index * 0.65;
  const reverse = index % 2 === 1;

  return (
    <div className="relative h-full min-w-0 flex-1 overflow-hidden">
      <div
        className="spin-reel-track flex flex-col items-center gap-4 py-4"
        style={{
          animationDuration: `${duration}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {loop.map((kind, tileIndex) => (
          <CollectibleTile key={`${index}-${tileIndex}-${kind}`} kind={kind} />
        ))}
      </div>
    </div>
  );
}

export function SpinMatrixBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#050505]"
      aria-hidden
    >
      <div className="absolute inset-0 flex h-[140vh] -translate-y-[12vh] blur-[6px] saturate-125 sm:blur-[9px]">
        <div className="grid h-full w-full grid-cols-7 gap-1 opacity-[0.55] sm:gap-2 sm:opacity-50">
          {Array.from({ length: REEL_COUNT }, (_, index) => (
            <SpinReel key={index} index={index} />
          ))}
        </div>
      </div>

      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,#050505_0%,transparent_15%,transparent_85%,#050505_100%)]"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#050505]/70" aria-hidden />
    </div>
  );
}
