import { useMemo } from "react";
import type { Pack } from "../../types";
import { formatGems } from "../../constants/retail";
import { useApp } from "../../context/AppContext";
import { CollectibleImage } from "../ui/CollectibleImage";
import { getLiveActivity } from "../../utils/liveCounter";

function tierAccentBorder(pack: Pack): string {
  const label = (pack.accentLabel ?? pack.ribbon ?? "").toUpperCase();

  if (pack.theme === "fuchsia" || label.includes("VARIANCE") || label.includes("HIGH")) {
    return "border-l-2 border-l-[#FF007F]";
  }
  if (pack.theme === "mystic" || label.includes("CEILING") || label.includes("GOD")) {
    return "border-l-2 border-l-amber-400";
  }
  if (label.includes("BUDGET")) {
    return "border-l-2 border-l-[#4B5563]";
  }
  if (label.includes("MID")) {
    return "border-l-2 border-l-[#6B7280]";
  }
  return "border-l-2 border-l-[#3D424C]";
}

function TierBadge({ pack, label }: { pack: Pack; label: string }) {
  return (
    <span
      className={`pointer-events-none absolute left-3 top-3 z-10 rounded-md border border-[#2A2D34] bg-[#1A1C20]/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm ${tierAccentBorder(pack)}`}
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
      className="group relative flex w-full flex-col overflow-hidden rounded-lg cursor-pointer border border-border bg-[#121318] transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia/50 hover:shadow-[0_0_28px_rgba(255,0,127,0.25),0_16px_48px_rgba(0,0,0,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-fuchsia"
    >
      {accent && <TierBadge pack={pack} label={accent} />}

      <div className="relative aspect-[4/3] w-full border-b border-border p-3 sm:p-4">
        <CollectibleImage src={pack.image} alt={pack.name} />
      </div>

      <div className="flex flex-col px-3 py-3 sm:px-3.5 sm:py-3.5">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e701] opacity-70" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00e701] shadow-[0_0_6px_#00e701]" />
          </span>
          <span className="text-[9px] sm:text-[10px] font-medium text-muted truncate">
            {liveLabel}
          </span>
        </div>

        <div className="flex items-end justify-between gap-2">
          <h3 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 flex-1">
            {displayName(pack.name)}
          </h3>
          <span className="shrink-0 rounded-md bg-metallic border border-border px-2 py-1 text-[10px] font-bold tabular-nums text-white font-mono">
            {formatGems(pack.cost)}
          </span>
        </div>
      </div>
    </article>
  );
}
