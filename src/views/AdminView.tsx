import { useCallback, useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { CollectibleImage } from "../components/ui/CollectibleImage";
import {
  fetchPendingShipmentsAdmin,
  markVaultItemShipped,
  type PendingShipmentOrder,
} from "../lib/adminLogic";
import { fetchCurrentUserProfile } from "../lib/userProfile";
import { formatGems } from "../constants/retail";

const PAGE_SHELL =
  "mx-auto w-full max-w-[1600px] space-y-8 overflow-x-hidden px-4 pb-8 pt-3 sm:px-6 sm:pb-10 sm:pt-4 lg:px-8";

function formatOrderDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function redirectToHomepage(goToLobby: () => void) {
  window.history.replaceState({}, "", "/");
  goToLobby();
}

function buyerLabel(order: PendingShipmentOrder): string {
  if (order.username && order.email) {
    return `${order.username} · ${order.email}`;
  }
  return order.username ?? order.email ?? "Unknown buyer";
}

function PendingOrderCard({
  order,
  trackingValue,
  onTrackingChange,
  onMarkShipped,
  isShipping,
}: {
  order: PendingShipmentOrder;
  trackingValue: string;
  onTrackingChange: (orderId: string, value: string) => void;
  onMarkShipped: (order: PendingShipmentOrder) => void;
  isShipping: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-slate-elevated/40">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
        <div className="mx-auto w-28 shrink-0 rounded-lg border border-border bg-slate p-2 sm:mx-0">
          <CollectibleImage
            src={order.imageUrl}
            alt={order.itemName}
            className="aspect-[2.5/3.5] w-full object-contain"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
              Pending Shipment
            </p>
            <h3 className="mt-1 text-base font-bold text-white">{order.itemName}</h3>
            <p className="mt-1 text-sm text-gold">{formatGems(order.gemValue)}</p>
          </div>

          <div className="grid gap-2 text-sm">
            <p className="text-muted">
              <span className="font-semibold text-white/90">Buyer:</span> {buyerLabel(order)}
            </p>
            <p className="text-muted">
              <span className="font-semibold text-white/90">Ship To:</span> {order.shippingName}
            </p>
            <p className="whitespace-pre-wrap text-muted">
              <span className="font-semibold text-white/90">Address:</span>{" "}
              {order.shippingAddress}
            </p>
            <p className="text-xs text-muted">Requested {formatOrderDate(order.createdAt)}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={trackingValue}
              onChange={(event) => onTrackingChange(order.id, event.target.value)}
              placeholder="Tracking number"
              disabled={isShipping}
              className="w-full rounded-lg border border-border bg-slate px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-fuchsia/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => onMarkShipped(order)}
              disabled={isShipping || !trackingValue.trim()}
              className="shrink-0 rounded-lg bg-[#FF007F] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-[160px]"
            >
              {isShipping ? "Saving…" : "Mark as Shipped"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function AdminView() {
  const { goToLobby, showCashoutToast } = useApp();
  const { user, authLoading, isAuthenticated } = useAuth();

  const [accessState, setAccessState] = useState<"checking" | "granted" | "denied">("checking");
  const [orders, setOrders] = useState<PendingShipmentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [trackingByOrderId, setTrackingByOrderId] = useState<Record<string, string>>({});
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);

  const loadPendingOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const result = await fetchPendingShipmentsAdmin();
      if (!result.ok) {
        showCashoutToast(result.error);
        setOrders([]);
        return;
      }
      setOrders(result.orders);
    } finally {
      setOrdersLoading(false);
    }
  }, [showCashoutToast]);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function verifyAccess() {
      if (!isAuthenticated || !user?.id) {
        if (!cancelled) {
          setAccessState("denied");
          redirectToHomepage(goToLobby);
        }
        return;
      }

      const profile = await fetchCurrentUserProfile(user.id);
      if (cancelled) return;

      if (!profile?.isAdmin) {
        setAccessState("denied");
        redirectToHomepage(goToLobby);
        return;
      }

      setAccessState("granted");
      await loadPendingOrders();
    }

    void verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user?.id, goToLobby, loadPendingOrders]);

  function handleTrackingChange(orderId: string, value: string) {
    setTrackingByOrderId((current) => ({ ...current, [orderId]: value }));
  }

  async function handleMarkShipped(order: PendingShipmentOrder) {
    if (shippingOrderId) return;

    const trackingNumber = (trackingByOrderId[order.id] ?? "").trim();
    if (!trackingNumber) {
      showCashoutToast("Enter a tracking number before marking as shipped.");
      return;
    }

    setShippingOrderId(order.id);
    try {
      const result = await markVaultItemShipped(order.id, trackingNumber);
      if (!result.ok) {
        showCashoutToast(result.error);
        return;
      }

      setOrders((current) => current.filter((entry) => entry.id !== order.id));
      setTrackingByOrderId((current) => {
        const next = { ...current };
        delete next[order.id];
        return next;
      });
      showCashoutToast(`Order shipped — tracking ${result.trackingNumber} saved.`);
    } finally {
      setShippingOrderId(null);
    }
  }

  if (accessState === "checking" || authLoading) {
    return (
      <div className={PAGE_SHELL}>
        <p className="py-16 text-center text-sm text-muted">Verifying admin access…</p>
      </div>
    );
  }

  if (accessState === "denied") {
    return null;
  }

  return (
    <div className={PAGE_SHELL}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-fuchsia">
            Fulfillment
          </p>
          <h1 className="mt-1 text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
            Admin Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Review pending physical shipment requests, attach carrier tracking numbers, and mark
            orders as shipped.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadPendingOrders()}
          disabled={ordersLoading || Boolean(shippingOrderId)}
          className="rounded-lg border border-border bg-slate-elevated/60 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted transition-colors hover:border-fuchsia/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Refresh Queue
        </button>
      </header>

      <section aria-labelledby="pending-orders-heading">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            id="pending-orders-heading"
            className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted"
          >
            Pending Orders
          </h2>
          <p className="text-sm text-muted">
            <span className="font-semibold tabular-nums text-white">{orders.length}</span> awaiting
            shipment
          </p>
        </div>

        {ordersLoading ? (
          <p className="py-16 text-center text-sm text-muted">Loading pending orders…</p>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-border bg-slate-elevated/30 py-16 text-center">
            <p className="text-base font-semibold text-white">No pending shipments</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              New vault shipping requests will appear here for fulfillment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <PendingOrderCard
                key={order.id}
                order={order}
                trackingValue={trackingByOrderId[order.id] ?? ""}
                onTrackingChange={handleTrackingChange}
                onMarkShipped={handleMarkShipped}
                isShipping={shippingOrderId === order.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
