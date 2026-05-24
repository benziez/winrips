import { useMemo } from "react";
import { useBoxesCatalog } from "../../context/BoxesCatalogContext";
import { LOBBY_SECTIONS, packsForLobbySection } from "../../data/lobbySections";
import { HeroBanner } from "./HeroBanner";
import { LobbyCategorySection } from "./LobbyCategorySection";
import { LobbyFaq } from "./LobbyFaq";

export function PackLobby() {
  const { packs: catalogPacks, loading } = useBoxesCatalog();

  const rows = useMemo(
    () =>
      LOBBY_SECTIONS.map((section) => {
        const packs = packsForLobbySection(section, catalogPacks);
        const showComingSoon =
          !loading && packs.length === 0 && section.showComingSoonWhenEmpty !== false;
        return { section, packs, showComingSoon };
      }),
    [catalogPacks, loading],
  );

  return (
    <div className="w-full space-y-8 sm:space-y-10">
      <HeroBanner />

      <div className="space-y-7 sm:space-y-8">
        {rows.map(({ section, packs, showComingSoon }) => (
          <LobbyCategorySection
            key={section.id}
            section={section}
            packs={packs}
            showComingSoon={showComingSoon}
          />
        ))}
      </div>

      <LobbyFaq />
    </div>
  );
}
