import { useMemo } from "react";
import type { Pack } from "../../types";
import { formatGems } from "../../constants/retail";
import { useApp } from "../../context/AppContext";
import { CollectibleImage } from "../ui/CollectibleImage";
import { getLiveActivity } from "../../utils/liveCounter";

function tierBadgeClass(pack: Pack): string {
  const label = (pack.accentLabel ?? pack.ribbon ?? "").toUpperCase();

  if (pack.theme === "fuchsia" || label.includes("VARIANCE") || label.includes("HIGH")) {
    return "bg-fuchsia/15 text-fuchsia border-fuchsia/35";
  }
  if (pack.theme === "mystic" || label.includes("CEILING") || label.includes("GOD")) {
    return "bg-gold/15 text-gold border-gold/40";
  }
  if (label.includes("BUDGET")) {
    return "bg-slate-elevated text-muted border-border";
  }
  return "bg-slate-elevated/80 text-white/90 border-border";
}

function TierBadge({ pack, label }: { pack: Pack; label: string }) {
  return (
    <span
      className={`pointer-events-none absolute left-3 top-3 z-10 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] border ${tierBadgeClass(pack)}`}
    >
      {label}
    </span>
  );
}

function displayName(name: string): string {
  return name.replace(/ Pack$| Box$| Drop$| Edition$| Booster$/, "");
}

interface PackCardProps {
  pack: Pack;
}

export function PackCard({ pack }: PackCardProps) {
  const { selectPack } = useApp();
  const liveLabel = useMemo(() => getLiveActivity(pack.id, "lobby"), [pack.id]);
  const accent = pack.accentLabel ?? pack.ribbon;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => selectPack(pack)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectPack(pack);
        }
      }}
      className="vault-door group relative flex w-full cursor-pointer flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia"
    >
      {accent && <TierBadge pack={pack} label={accent} />}

      <div className="relative aspect-square w-full bg-slate-elevated/40 p-4 sm:p-5">
        <CollectibleImage
          src={pack.image}
          alt={pack.name}
          category={pack.category}
          className="h-full w-full object-contain"
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border bg-slate px-3 py-3 sm:px-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="truncate text-[9px] font-medium uppercase tracking-wide text-muted">
              {liveLabel}
            </span>
          </div>
          <h3 className="line-clamp-2 text-xs font-bold leading-snug text-white sm:text-sm">
            {displayName(pack.name)}
          </h3>
        </div>
        <span className="shrink-0 rounded-md border border-border bg-slate-elevated px-2.5 py-1.5 text-[10px] font-bold tabular-nums text-white transition-colors group-hover:border-fuchsia/40 group-hover:text-fuchsia">
          {formatGems(pack.cost)}
        </span>
      </div>
    </article>
  );
}
