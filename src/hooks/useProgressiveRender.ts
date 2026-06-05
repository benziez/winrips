import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  PROGRESSIVE_LIST_BATCH,
  PROGRESSIVE_LIST_INITIAL,
} from "../constants/progressiveList";

interface ProgressiveRenderOptions {
  initialCount?: number;
  batchSize?: number;
  /** When false, renders the full list (small catalogs). */
  enabled?: boolean;
}

export function useProgressiveRender<T>(
  items: readonly T[],
  scrollRootRef?: RefObject<HTMLElement | null>,
  options?: ProgressiveRenderOptions,
) {
  const initialCount = options?.initialCount ?? PROGRESSIVE_LIST_INITIAL;
  const batchSize = options?.batchSize ?? PROGRESSIVE_LIST_BATCH;
  const enabled = options?.enabled ?? items.length > initialCount;

  const [limit, setLimit] = useState(() =>
    enabled ? Math.min(initialCount, items.length) : items.length,
  );
  const sentinelRef = useRef<HTMLDivElement>(null);

  const itemsLength = items.length;

  useEffect(() => {
    setLimit(enabled ? Math.min(initialCount, itemsLength) : itemsLength);
  }, [enabled, initialCount, itemsLength]);

  const visibleItems = useMemo(
    () => (enabled ? items.slice(0, limit) : items),
    [enabled, items, limit],
  );

  const hasMore = enabled && limit < itemsLength;
  const remaining = Math.max(0, itemsLength - limit);

  const loadMore = useCallback(() => {
    setLimit((prev) => Math.min(prev + batchSize, itemsLength));
  }, [batchSize, itemsLength]);

  useEffect(() => {
    if (!hasMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const root = scrollRootRef?.current ?? null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      { root, rootMargin: "280px 0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, scrollRootRef]);

  return {
    visibleItems,
    hasMore,
    remaining,
    loadMore,
    sentinelRef,
  };
}
