import type { Pack } from "../../types";
import { PackCard } from "./PackCard";

interface PackGridProps {
  title: string;
  packs: Pack[];
  showTitle?: boolean;
}

export function PackGrid({ title, packs, showTitle = true }: PackGridProps) {
  if (packs.length === 0) return null;

  return (
    <section className="w-full">
      {showTitle && title ? (
        <h2 className="mb-5 pl-0.5 text-xs font-bold uppercase tracking-[0.18em] text-muted sm:text-sm">
          {title}
        </h2>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {packs.map((pack) => (
          <PackCard key={pack.id} pack={pack} />
        ))}
      </div>
    </section>
  );
}
