import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  clearRemoteBoxCatalog,
  getLobbyPackCatalog,
  hasRemoteBoxCatalog,
  initBoxCatalogFallback,
  setRemoteBoxCatalog,
} from "../data/boxCatalog";
import { LOBBY_PACK_CATALOG } from "../constants/packs";
import { fetchRemoteBoxCatalog } from "../lib/boxesApi";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import type { CatalogPack } from "../types/box";
import type { StoreItem } from "../types/store";

interface BoxesCatalogContextValue {
  packs: CatalogPack[];
  storeItemsByPackId: Record<string, StoreItem[]>;
  loading: boolean;
  usingRemote: boolean;
  refreshBoxesCatalog: () => Promise<void>;
}

const BoxesCatalogContext = createContext<BoxesCatalogContextValue | null>(null);

initBoxCatalogFallback(LOBBY_PACK_CATALOG);

function buildStoreItemsMap(
  catalog: CatalogPack[],
  remoteItems?: Record<string, StoreItem[]>,
): Record<string, StoreItem[]> {
  if (!remoteItems) return {};
  return Object.fromEntries(catalog.map((pack) => [pack.id, remoteItems[pack.id] ?? []]));
}

function catalogsEqual(a: CatalogPack[], b: CatalogPack[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((pack, index) => {
    const other = b[index];
    return (
      other != null &&
      pack.id === other.id &&
      pack.name === other.name &&
      pack.cost === other.cost &&
      pack.image === other.image
    );
  });
}

export function BoxesCatalogProvider({ children }: { children: ReactNode }) {
  const [packs, setPacks] = useState<CatalogPack[]>(() => getLobbyPackCatalog());
  const [storeItemsByPackId, setStoreItemsByPackId] = useState<Record<string, StoreItem[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [usingRemote, setUsingRemote] = useState(false);

  const fetchGenerationRef = useRef(0);
  const packsRef = useRef(packs);
  packsRef.current = packs;

  const setCatalogData = useCallback(
    (nextPacks: CatalogPack[], nextStoreItems: Record<string, StoreItem[]>, remote: boolean) => {
      setPacks((previousPacks) => {
        if (nextPacks.length === 0 && previousPacks.length > 0) {
          if (import.meta.env.DEV) {
            console.warn(
              "[boxes-catalog] Ignoring empty catalog fetch — keeping previous packs.",
            );
          }
          return previousPacks;
        }
        if (remote && nextPacks.length > 0 && previousPacks.length > 0) {
          const nextIds = new Set(nextPacks.map((pack) => pack.id));
          const missingFromPrevious = previousPacks.some((pack) => !nextIds.has(pack.id));
          if (missingFromPrevious && nextPacks.length < previousPacks.length) {
            if (import.meta.env.DEV) {
              console.warn(
                "[boxes-catalog] Ignoring partial catalog fetch — keeping previous packs.",
              );
            }
            return previousPacks;
          }
        }
        return catalogsEqual(previousPacks, nextPacks) ? previousPacks : nextPacks;
      });

      setStoreItemsByPackId((previousStoreItems) => {
        const previousKeys = Object.keys(previousStoreItems);
        const nextKeys = Object.keys(nextStoreItems);

        if (nextKeys.length === 0 && previousKeys.length > 0 && remote) {
          if (import.meta.env.DEV) {
            console.warn(
              "[boxes-catalog] Ignoring empty store-items fetch — keeping previous items.",
            );
          }
          return previousStoreItems;
        }

        if (
          previousKeys.length === nextKeys.length &&
          previousKeys.every((key) => previousStoreItems[key] === nextStoreItems[key])
        ) {
          return previousStoreItems;
        }
        return nextStoreItems;
      });

      setUsingRemote(remote);
    },
    [],
  );

  const refreshBoxesCatalog = useCallback(async (options?: { silent?: boolean }) => {
    const generation = ++fetchGenerationRef.current;
    const hasExistingCatalog = packsRef.current.length > 0;

    if (!options?.silent && !hasExistingCatalog) {
      setLoading(true);
    }

    try {
      initBoxCatalogFallback(LOBBY_PACK_CATALOG);
      const remote = await fetchRemoteBoxCatalog();

      if (generation !== fetchGenerationRef.current) {
        return;
      }

      if (remote?.packs.length) {
        setRemoteBoxCatalog(remote.packs, remote.storeItemsByPackId);
        const nextPacks = getLobbyPackCatalog();
        setCatalogData(nextPacks, buildStoreItemsMap(nextPacks, remote.storeItemsByPackId), true);
      } else if (!hasRemoteBoxCatalog() && !hasExistingCatalog) {
        clearRemoteBoxCatalog();
        const fallbackPacks = getLobbyPackCatalog();
        setCatalogData(fallbackPacks, {}, false);
      } else {
        const nextPacks = getLobbyPackCatalog();
        setCatalogData(
          nextPacks,
          buildStoreItemsMap(nextPacks, remote?.storeItemsByPackId),
          hasRemoteBoxCatalog(),
        );
      }
    } finally {
      if (generation === fetchGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [setCatalogData]);

  useEffect(() => {
    void refreshBoxesCatalog();
  }, [refreshBoxesCatalog]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const client = supabase;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        void refreshBoxesCatalog({ silent: true });
      }, 400);
    };

    const channel = client
      .channel("lobby-boxes-catalog")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "boxes" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "box_items" },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      void client.removeChannel(channel);
    };
  }, [refreshBoxesCatalog]);

  const value = useMemo(
    () => ({
      packs,
      storeItemsByPackId,
      loading,
      usingRemote,
      refreshBoxesCatalog: () => refreshBoxesCatalog(),
    }),
    [packs, storeItemsByPackId, loading, usingRemote, refreshBoxesCatalog],
  );

  return (
    <BoxesCatalogContext.Provider value={value}>{children}</BoxesCatalogContext.Provider>
  );
}

export function useBoxesCatalog() {
  const ctx = useContext(BoxesCatalogContext);
  if (!ctx) {
    throw new Error("useBoxesCatalog must be used within BoxesCatalogProvider");
  }
  return ctx;
}
