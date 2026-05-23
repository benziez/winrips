import type { Pack } from "../../types";
import type { LobbySection } from "../../data/lobbySections";
import { LobbyPackRow } from "./LobbyPackRow";

interface LobbyCategorySectionProps {
  section: LobbySection;
  packs: Pack[];
  showComingSoon?: boolean;
}

export function LobbyCategorySection({
  section,
  packs,
  showComingSoon = false,
}: LobbyCategorySectionProps) {
  const hasPacks = packs.length > 0;

  if (!hasPacks && !showComingSoon) {
    return null;
  }

  return (
    <section
      id={`lobby-section-${section.id}`}
      className="scroll-mt-24 space-y-3"
      aria-labelledby={`lobby-heading-${section.id}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff007a]"
            aria-hidden
          />
          <h2
            id={`lobby-heading-${section.id}`}
            className="truncate text-sm font-bold tracking-tight text-white sm:text-base"
          >
            {section.title}
          </h2>
        </div>
        {hasPacks ? (
          <button
            type="button"
            onClick={() => {
              document
                .getElementById(`lobby-section-${section.id}`)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="shrink-0 text-[11px] font-semibold text-slate-400 transition-colors duration-200 hover:text-white"
          >
            View All
          </button>
        ) : null}
      </div>

      <LobbyPackRow section={section} packs={packs} showComingSoon={showComingSoon} />
    </section>
  );
}
