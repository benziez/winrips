import { useEffect, useMemo, useState } from "react";
import type { Pack } from "../../types";
import { formatGems } from "../../constants/retail";
import { useApp } from "../../context/AppContext";
import { CollectibleImage } from "../ui/CollectibleImage";
import { CYCLE_MS, getTopValueDropImages } from "../../utils/packPreviewImages";

function displayName(name: string): string {
  return name.replace(/ Pack$| Box$| Drop$| Edition$| Booster$/, "");
}

const LAYER_BASE = "pointer-events-none absolute inset-0";
const FADE_CLASS = "transition-opacity duration-500 ease-in-out";

interface PackCardCompactProps {
  pack: Pack;
}

export function PackCardCompact({ pack }: PackCardCompactProps) {
  const { selectPack } = useApp();

  const dropsSignature = useMemo(
    () => getTopValueDropImages(pack).join("\u0000"),
    [pack.id, pack.cost],
  );

  const cycleSlides = useMemo(() => {
    const drops = getTopValueDropImages(pack);
    const slides = [pack.image];
    for (const url of drops) {
      if (!slides.includes(url)) slides.push(url);
    }
    return slides;
  }, [pack.id, pack.image, dropsSignature]);

  const [cycleIndex, setCycleIndex] = useState(0);

  useEffect(() => {
    setCycleIndex(0);
  }, [pack.id, dropsSignature]);

  useEffect(() => {
    if (cycleSlides.length <= 1) return;

    const intervalId = setInterval(() => {
      setCycleIndex((current) => (current + 1) % cycleSlides.length);
    }, CYCLE_MS);

    return () => clearInterval(intervalId);
  }, [cycleSlides.length, dropsSignature]);

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
      className="vault-door group relative flex w-full cursor-pointer flex-col overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fuchsia"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-elevated/50 p-2">
        {cycleSlides.map((src, index) => (
          <CollectibleImage
            key={`${pack.id}-${index}-${src}`}
            src={src}
            category={pack.category}
            alt={index === 0 ? pack.name : ""}
            frameClassName={`${LAYER_BASE} ${FADE_CLASS} p-1 ${
              index === cycleIndex ? "opacity-100" : "opacity-0"
            }`}
            className={`h-full w-full object-contain ${
              index === 0 ? "transition-transform duration-200 group-hover:scale-[1.03]" : ""
            }`}
          />
        ))}
      </div>

      <div className="border-t border-border bg-slate px-2 py-2">
        <p className="truncate text-[10px] font-semibold leading-tight text-white">
          {displayName(pack.name)}
        </p>
        <p className="mt-0.5 text-[9px] font-bold tabular-nums text-slate-400 group-hover:text-fuchsia">
          {formatGems(pack.cost)}
        </p>
      </div>
    </article>
  );
}
