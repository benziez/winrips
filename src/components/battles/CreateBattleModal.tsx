import { useMemo, useState } from "react";
import type { CatalogPack } from "../../types/box";
import { formatGems } from "../../constants/retail";
import { CollectibleImage } from "../ui/CollectibleImage";

export interface CreateBattleModalProps {
  open: boolean;
  packs: CatalogPack[];
  loading?: boolean;
  creating?: boolean;
  onClose: () => void;
  onCreate: (boxIds: string[]) => void;
}

export function CreateBattleModal({
  open,
  packs,
  loading = false,
  creating = false,
  onClose,
  onCreate,
}: CreateBattleModalProps) {
  const [selectedBoxIds, setSelectedBoxIds] = useState<string[]>([]);

  const selectedCost = useMemo(
    () =>
      selectedBoxIds.reduce((sum, boxId) => {
        const pack = packs.find((entry) => entry.id === boxId);
        return sum + (pack?.cost ?? 0);
      }, 0),
    [selectedBoxIds, packs],
  );

  if (!open) return null;

  function toggleBox(boxId: string) {
    setSelectedBoxIds((current) =>
      current.includes(boxId) ? current.filter((id) => id !== boxId) : [...current, boxId],
    );
  }

  function handleCreate() {
    if (selectedBoxIds.length === 0 || creating) return;
    onCreate(selectedBoxIds);
  }

  function handleClose() {
    if (creating) return;
    setSelectedBoxIds([]);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-battle-title"
    >
      <div className="flex max-h-[min(90vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111115] shadow-[0_0_40px_rgba(255,0,127,0.12)]">
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF007F]">
              Box Battles
            </p>
            <h2 id="create-battle-title" className="mt-1 text-lg font-black uppercase text-white">
              Create Battle
            </h2>
            <p className="mt-2 text-sm text-muted">
              Select the boxes each player will open. Entry cost equals the combined box price.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={creating}
            className="text-xl text-muted transition-colors hover:text-white disabled:opacity-40"
            aria-label="Close create battle modal"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="py-12 text-center text-sm text-muted">Loading box catalog…</p>
          ) : packs.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">
              No active boxes found in the catalog.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {packs.map((pack) => {
                const selected = selectedBoxIds.includes(pack.id);
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => toggleBox(pack.id)}
                    disabled={creating}
                    aria-pressed={selected}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
                      selected
                        ? "border-amber-500/40 bg-amber-950/15 shadow-[0_0_15px_rgba(234,179,8,0.25)] ring-1 ring-yellow-500"
                        : "border-white/10 bg-[#0A0A0C]/50 hover:border-white/20 hover:bg-[#0A0A0C]/80"
                    }`}
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/5 bg-[#08080A] p-1.5">
                      <CollectibleImage
                        src={pack.image}
                        alt={pack.name}
                        className={`h-full w-full object-contain transition-opacity duration-300 ${
                          selected ? "opacity-100" : "opacity-70"
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{pack.name}</p>
                      <p className="mt-1 text-xs font-bold tabular-nums text-amber-400/90">
                        {formatGems(pack.cost)}
                      </p>
                    </div>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                        selected
                          ? "border-amber-500 bg-amber-500 text-black"
                          : "border-white/15 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-6 py-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted">
              {selectedBoxIds.length}{" "}
              {selectedBoxIds.length === 1 ? "box selected" : "boxes selected"}
            </p>
            <p className="text-sm font-bold tabular-nums text-amber-400/90">
              Entry: {formatGems(selectedCost)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || selectedBoxIds.length === 0}
            className="w-full rounded-lg bg-[#FF007F] py-3.5 text-xs font-bold uppercase tracking-wide text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {creating ? "Creating Battle…" : "Create Battle"}
          </button>
        </div>
      </div>
    </div>
  );
}
