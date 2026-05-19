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
        <h2 className="text-sm sm:text-base font-bold text-white tracking-tight mb-4 pl-0.5">
          {title}
        </h2>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {packs.map((pack) => (
          <PackCard key={pack.id} pack={pack} />
        ))}
      </div>
    </section>
  );
}
