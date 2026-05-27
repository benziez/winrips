import { purchasePackProduct } from "./revenueCat";
import { fulfillIapPackOpen } from "./iapFulfillApi";

export interface NativePackPurchaseOutcome {
  ok: true;
  transactionId: string;
}

export interface NativePackPurchaseError {
  ok: false;
  error: string;
  cancelled?: boolean;
}

export type NativePackPurchaseResult = NativePackPurchaseOutcome | NativePackPurchaseError;

/**
 * App Store purchase + server fulfillment before a pack rip.
 * Server credits internal ledger / validates transaction for spin RPC.
 */
export async function purchasePackForOpening(
  packId: string,
  gemCost: number,
  quantity: number,
  accessToken: string,
): Promise<NativePackPurchaseResult> {
  const purchase = await purchasePackProduct(packId, quantity);
  if (!purchase.ok) {
    return { ok: false, error: purchase.error, cancelled: purchase.cancelled };
  }

  const fulfill = await fulfillIapPackOpen({
    packId,
    gemCost,
    quantity,
    productId: purchase.productId,
    transactionId: purchase.transactionId,
    accessToken,
  });

  if (!fulfill.ok) {
    return { ok: false, error: fulfill.error };
  }

  return { ok: true, transactionId: purchase.transactionId };
}
