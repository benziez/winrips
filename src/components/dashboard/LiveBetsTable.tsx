import { useCallback, useEffect, useMemo, useState } from "react";
import { formatGems } from "../../constants/retail";
import {
  createRecentOrder,
  prependRecentOrder,
  RECENT_ORDER_INTERVAL_MS,
  RECENT_ORDER_VISIBLE_COUNT,
  seedRecentOrders,
  type RecentOrder,
} from "../../data/recentOrders";
import { LIVE_FEED_POOL_VERSION } from "../../data/liveFeed";
import type { LobbyCategoryFilter } from "../../types";
import { UserProfileModal } from "./UserProfileModal";

function HiddenCollectorCell() {
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-400">
      <svg
        className="h-3.5 w-3.5 shrink-0 text-slate-500"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
      </svg>
      <span className="text-sm font-medium">Hidden Collector</span>
    </span>
  );
}

interface CollectorCellProps {
  name: string;
  onOpenProfile: (username: string) => void;
}

function CollectorCell({ name, onOpenProfile }: CollectorCellProps) {
  return (
    <button
      type="button"
      onClick={() => onOpenProfile(name)}
      className="text-sm font-medium text-white transition-colors hover:text-[#FF007F] hover:underline underline-offset-2"
    >
      {name}
    </button>
  );
}

interface LiveBetsTableProps {
  categoryFilter?: LobbyCategoryFilter;
}

/** Fixed tbody height — 5 rows × 52px, never expands the lobby viewport. */
const FEED_ROW_HEIGHT_PX = 52;
const FEED_BODY_HEIGHT_PX = RECENT_ORDER_VISIBLE_COUNT * FEED_ROW_HEIGHT_PX;

interface OrderRowProps {
  order: RecentOrder;
  isNewest: boolean;
  onOpenProfile: (username: string) => void;
}

function OrderRow({ order, isNewest, onOpenProfile }: OrderRowProps) {
  return (
    <tr
      className={`h-[52px] border-b border-neutral-900 transition-colors ${
        isNewest ? "animate-feed-row-enter bg-[#FF007F]/[0.06]" : "hover:bg-[#121318]/60"
      }`}
    >
      <td className="whitespace-nowrap px-4 py-0 align-middle">
        {order.isHidden ? (
          <HiddenCollectorCell />
        ) : (
          <CollectorCell name={order.collector} onOpenProfile={onOpenProfile} />
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-0 align-middle font-medium text-white">
        {order.boxOpened}
      </td>
      <td className="max-w-[200px] truncate px-4 py-0 align-middle text-white/95">
        {order.itemUnboxed}
      </td>
      <td className="whitespace-nowrap px-4 py-0 align-middle text-right">
        <span className="font-bold tabular-nums text-[#FF007F]">
          {formatGems(order.marketValueGems)}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-0 align-middle text-right text-xs tabular-nums text-slate-500">
        {order.time}
      </td>
    </tr>
  );
}

/** Luxury storefront recent-unbox feed (replaces legacy bet ledger). */
export function LiveBetsTable({ categoryFilter = "all" }: LiveBetsTableProps) {
  const [orders, setOrders] = useState<RecentOrder[]>(() =>
    seedRecentOrders(RECENT_ORDER_VISIBLE_COUNT, categoryFilter),
  );
  const [profileUser, setProfileUser] = useState<string | null>(null);
  const [enteringId, setEnteringId] = useState<string | null>(null);

  const visibleOrders = useMemo(
    () => orders.slice(0, RECENT_ORDER_VISIBLE_COUNT),
    [orders],
  );

  useEffect(() => {
    setEnteringId(null);
    setOrders(seedRecentOrders(RECENT_ORDER_VISIBLE_COUNT, categoryFilter));
  }, [categoryFilter, LIVE_FEED_POOL_VERSION]);

  const pushOrder = useCallback(() => {
    const next = createRecentOrder(categoryFilter);
    setEnteringId(next.id);
    setOrders((prev) => prependRecentOrder(prev, next));
  }, [categoryFilter]);

  useEffect(() => {
    if (!enteringId) return;
    const timer = setTimeout(() => setEnteringId(null), 420);
    return () => clearTimeout(timer);
  }, [enteringId]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function scheduleNext() {
      const delay = RECENT_ORDER_INTERVAL_MS + Math.random() * 800;
      timeoutId = setTimeout(() => {
        pushOrder();
        scheduleNext();
      }, delay);
    }

    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, [pushOrder]);

  return (
    <>
      <section className="rounded-xl border border-border bg-[#0A0A0C]">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-900 bg-[#121318]/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF007F] opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF007F]" />
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Recent Orders</h2>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Live Unboxings
          </span>
        </div>

        <div className="w-full overflow-x-auto scrollbar-none [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-900 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                <th className="px-4 py-3 font-semibold">Collector</th>
                <th className="px-4 py-3 font-semibold">Box Opened</th>
                <th className="px-4 py-3 font-semibold">Item Unboxed</th>
                <th className="px-4 py-3 font-semibold text-right">Market Value</th>
                <th className="px-4 py-3 font-semibold text-right">Time</th>
              </tr>
            </thead>
          </table>

          <div
            className="overflow-hidden"
            style={{ height: FEED_BODY_HEIGHT_PX }}
          >
            <table className="w-full min-w-[720px] text-left text-sm">
              <tbody>
                {visibleOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    isNewest={order.id === enteringId}
                    onOpenProfile={setProfileUser}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {profileUser && (
        <UserProfileModal username={profileUser} onClose={() => setProfileUser(null)} />
      )}
    </>
  );
}

/** @alias LiveBetsTable */
export const RecentOrdersFeed = LiveBetsTable;
