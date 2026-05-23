import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearRemoteBoxCatalog,
  getLobbyPackCatalog,
  initBoxCatalogFallback,
  setRemoteBoxCatalog,
} from "../data/boxCatalog";
import { LOBBY_PACK_CATALOG } from "../constants/packs";
import { fetchRemoteBoxCatalog } from "../lib/boxesApi";
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

export function BoxesCatalogProvider({ children }: { children: ReactNode }) {
  const [packs, setPacks] = useState<CatalogPack[]>([]);
  const [storeItemsByPackId, setStoreItemsByPackId] = useState<Record<string, StoreItem[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [usingRemote, setUsingRemote] = useState(false);

  const refreshBoxesCatalog = useCallback(async () => {
    setLoading(true);
    try {
      initBoxCatalogFallback(LOBBY_PACK_CATALOG);
      const remote = await fetchRemoteBoxCatalog();
      if (remote?.packs.length) {
        setRemoteBoxCatalog(remote.packs, remote.storeItemsByPackId);
        setUsingRemote(true);
      } else {
        clearRemoteBoxCatalog();
        setUsingRemote(false);
      }
      setPacks(getLobbyPackCatalog());
      setStoreItemsByPackId(
        remote?.storeItemsByPackId
          ? Object.fromEntries(
              getLobbyPackCatalog().map((pack) => [
                pack.id,
                remote.storeItemsByPackId[pack.id] ?? [],
              ]),
            )
          : {},
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshBoxesCatalog();
  }, [refreshBoxesCatalog]);

  const value = useMemo(
    () => ({
      packs,
      storeItemsByPackId,
      loading,
      usingRemote,
      refreshBoxesCatalog,
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
