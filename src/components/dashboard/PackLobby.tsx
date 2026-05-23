import { LOBBY_SECTIONS, packsForLobbySection } from "../../data/lobbySections";
import { HeroBanner } from "./HeroBanner";
import { LobbyCategorySection } from "./LobbyCategorySection";
import { LobbyFaq } from "./LobbyFaq";

export function PackLobby() {
  const rows = LOBBY_SECTIONS.map((section) => {
    const packs = packsForLobbySection(section);
    const showComingSoon =
      packs.length === 0 && section.showComingSoonWhenEmpty !== false;
    return { section, packs, showComingSoon };
  });

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
