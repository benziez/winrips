import type { RefObject } from "react";

interface ProgressiveLoadFooterProps {
  sentinelRef: RefObject<HTMLDivElement | null>;
  hasMore: boolean;
  remaining: number;
  onLoadMore: () => void;
}

export function ProgressiveLoadFooter({
  sentinelRef,
  hasMore,
  remaining,
  onLoadMore,
}: ProgressiveLoadFooterProps) {
  if (!hasMore) return null;

  return (
    <div ref={sentinelRef} className="flex flex-col items-center gap-3 py-6">
      <button
        type="button"
        onClick={onLoadMore}
        className="rounded-full bg-white/10 px-5 py-2.5 text-[13px] font-semibold text-white active:bg-white/15"
      >
        Load more ({remaining} remaining)
      </button>
    </div>
  );
}
