const DEFAULT_SKELETON_COUNT = 4;

const SECTION_SKELETON_STYLES: Record<
  string,
  { border: string; badge: string; glow: string }
> = {
  pokemon: {
    border: "border-fuchsia/25",
    badge: "text-fuchsia",
    glow: "bg-fuchsia/5",
  },
  nba: {
    border: "border-gold/25",
    badge: "text-gold",
    glow: "bg-gold/5",
  },
  nfl: {
    border: "border-gold/20",
    badge: "text-gold",
    glow: "bg-gold/[0.04]",
  },
  mlb: {
    border: "border-[#00e701]/20",
    badge: "text-[#00e701]",
    glow: "bg-[#00e701]/[0.04]",
  },
  yugioh: {
    border: "border-purple/25",
    badge: "text-purple",
    glow: "bg-purple/5",
  },
};

const DEFAULT_STYLE = SECTION_SKELETON_STYLES.pokemon!;

export function ComingSoonPackSkeletons({
  sectionId = "default",
  count = DEFAULT_SKELETON_COUNT,
}: {
  sectionId?: string;
  count?: number;
}) {
  const style = SECTION_SKELETON_STYLES[sectionId] ?? DEFAULT_STYLE;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={`${sectionId}-placeholder-${index}`}
          className={`relative flex flex-col overflow-hidden rounded-lg border bg-slate/60 ${style.border} ${style.glow}`}
          aria-hidden
        >
          <div className="aspect-square w-full bg-slate-elevated/30" />
          <div className="h-10 border-t border-[#213743]/80 bg-slate/80" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span
              className={`rounded border border-border/80 bg-obsidian/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${style.badge}`}
            >
              Coming Soon
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
