import { useMemo, useState } from "react";
import type { Card } from "../../types";
import { formatUsd, gemsToUsd } from "../../constants/retail";
import { useBoxesCatalog } from "../../context/BoxesCatalogContext";
import { getPackDropTable } from "../../data/packDropTables";
import { LOBBY_SECTIONS, packsForLobbySection } from "../../data/lobbySections";
import { MOBILE_DOCK_CLEARANCE } from "./MobileFloatingDock";
import { RipAmbientShell } from "./rip/RipAmbientShell";
import { BalancePill } from "./rip/BalancePill";
import { CategorySelector } from "./rip/CategorySelector";
import { CategorySheet } from "./rip/CategorySheet";
import { AddFundsModal } from "./rip/AddFundsModal";
import { CardDetailOverlay } from "./rip/CardDetailOverlay";
import { WinRipsLogo } from "../brand/WinRipsLogo";
import { CollectibleImage } from "../ui/CollectibleImage";
import { MOBILE_HEADER_BG, mobileHeaderSafePaddingStyle } from "./mobileShellTheme";
import { hapticTabSelect } from "../../utils/mobileHaptics";

// Single-category app for now — keep the selector code but hide it (re-enable when
// more categories ship). Mirrors the flag used on MobileRipLobby.
const SHOW_CATEGORY_SELECTOR = false;

function ShowroomPullTile({ card, onSelect }: { card: Card; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-52 shrink-0 flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-[var(--rip-surface)] to-[var(--rip-bg-elevated)] text-left"
    >
      <div className="p-2">
        <CollectibleImage
          src={card.image}
          alt={card.name}
          className="aspect-[3/4] w-full object-contain"
        />
      </div>
      <div className="shrink-0 border-t border-[var(--rip-border)] px-3 pb-1 pt-1">
        <p className="truncate text-[13px] font-medium leading-tight text-white">{card.name}</p>
        <p className="mt-0.5 text-[16px] font-bold leading-none text-[var(--rip-green-bright)]">
          {formatUsd(gemsToUsd(card.value))}
        </p>
      </div>
    </button>
  );
}

export function MobileShowroomView() {
  const { packs: catalogPacks } = useBoxesCatalog();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const sections = useMemo(() => {
    const result: { packName: string; cards: Card[] }[] = [];
    for (const section of LOBBY_SECTIONS) {
      for (const pack of packsForLobbySection(section, catalogPacks)) {
        const table = getPackDropTable(pack.id);
        const sorted = [...table].sort((a, b) => b.card.value - a.card.value);
        const cards = sorted.slice(0, 10).map((e) => e.card);
        if (cards.length > 0) {
          result.push({ packName: pack.name, cards });
        }
      }
    }
    return result.sort((a, b) => {
      const topA = a.cards[0]?.value ?? 0;
      const topB = b.cards[0]?.value ?? 0;
      return topB - topA;
    });
  }, [catalogPacks]);

  return (
    <RipAmbientShell>
      <header
        className="relative z-[10000] flex shrink-0 items-center justify-between border-none px-6 pb-3 shadow-none"
        style={{ ...mobileHeaderSafePaddingStyle, background: MOBILE_HEADER_BG }}
      >
        {SHOW_CATEGORY_SELECTOR ? (
          <CategorySelector onPress={() => setCategoryOpen(true)} />
        ) : (
          <WinRipsLogo className="block h-9 w-auto object-contain" maxWidth={160} glow={false} />
        )}
        <BalancePill onAddFunds={() => setAddFundsOpen(true)} />
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: MOBILE_DOCK_CLEARANCE }}
      >
        <h1 className="mb-5 px-6 pt-2 text-[32px] font-bold leading-tight text-white">Recent Wins</h1>

        {sections.length === 0 ? (
          <p className="mt-8 px-6 text-[15px] text-[var(--rip-text-muted)]">
            Featured pulls will appear here when the global wins feed is connected.
          </p>
        ) : (
          sections.map((section) => (
            <section key={section.packName} className="mb-7 mt-6">
              <h2 className="px-6 text-lg font-semibold text-white">{section.packName}</h2>
              <div className="mx-6 mt-3 border-b border-[var(--rip-border)]" />
              <div className="rip-hide-scrollbar mt-4 flex gap-3 overflow-x-auto px-6 pb-2">
                {section.cards.map((card) => (
                  <ShowroomPullTile
                    key={`${section.packName}-${card.id}`}
                    card={card}
                    onSelect={() => {
                      void hapticTabSelect();
                      setSelectedCard(card);
                    }}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <CategorySheet open={categoryOpen} onClose={() => setCategoryOpen(false)} />
      <AddFundsModal open={addFundsOpen} onClose={() => setAddFundsOpen(false)} />
      <CardDetailOverlay
        card={selectedCard}
        open={Boolean(selectedCard)}
        onClose={() => setSelectedCard(null)}
      />
    </RipAmbientShell>
  );
}
