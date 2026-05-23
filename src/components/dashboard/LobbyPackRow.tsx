import type { Pack } from "../../types";
import type { LobbySection } from "../../data/lobbySections";
import { PackCardCompact } from "./PackCardCompact";
import { ComingSoonPackSkeletons } from "./ComingSoonPackSkeleton";

interface LobbyPackRowProps {
  packs: Pack[];
  section: Pick<LobbySection, "id" | "placeholderCount">;
  showComingSoon?: boolean;
}

export function LobbyPackRow({ packs, section, showComingSoon = false }: LobbyPackRowProps) {
  if (packs.length > 0) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        {packs.map((pack) => (
          <PackCardCompact key={pack.id} pack={pack} />
        ))}
      </div>
    );
  }

  if (showComingSoon) {
    return (
      <ComingSoonPackSkeletons
        sectionId={section.id}
        count={section.placeholderCount ?? 4}
      />
    );
  }

  return null;
}
