import { Capacitor } from "@capacitor/core";
import { isAppStoreCommerce } from "../constants/commerce";
import { iapProductIdForPack } from "../data/iapProducts";
import { logger } from "./logger";

let configuredForUser: string | null = null;

function iosApiKey(): string | undefined {
  const key = import.meta.env.VITE_REVENUECAT_IOS_API_KEY;
  return typeof key === "string" && key.trim() ? key.trim() : undefined;
}

export function isRevenueCatConfigured(): boolean {
  if (!isAppStoreCommerce()) return false;
  if (Capacitor.getPlatform() !== "ios") return false;
  return Boolean(iosApiKey()) || import.meta.env.VITE_IAP_DEV_BYPASS === "true";
}

export async function configureRevenueCat(appUserId: string): Promise<void> {
  if (!isAppStoreCommerce() || Capacitor.getPlatform() !== "ios") return;
  if (configuredForUser === appUserId) return;

  const apiKey = iosApiKey();
  if (!apiKey) {
    logger.warn("[RevenueCat] VITE_REVENUECAT_IOS_API_KEY not set — IAP disabled");
    return;
  }

  const { Purchases, LOG_LEVEL } = await import("@revenuecat/purchases-capacitor");
  await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
  await Purchases.configure({
    apiKey,
    appUserID: appUserId,
  });
  configuredForUser = appUserId;
}

export interface PackPurchaseResult {
  ok: true;
  productId: string;
  transactionId: string;
}

export interface PackPurchaseFailure {
  ok: false;
  error: string;
  cancelled?: boolean;
}

export type PurchasePackResult = PackPurchaseResult | PackPurchaseFailure;

export async function purchasePackProduct(
  packId: string,
  quantity: number,
): Promise<PurchasePackResult> {
  if (!isAppStoreCommerce()) {
    return { ok: false, error: "In-app purchases are only available in the native app." };
  }

  if (import.meta.env.VITE_IAP_DEV_BYPASS === "true") {
    return {
      ok: true,
      productId: iapProductIdForPack(packId),
      transactionId: `dev-${packId}-${Date.now()}`,
    };
  }

  const apiKey = iosApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: "Purchases are not configured yet. Add VITE_REVENUECAT_IOS_API_KEY.",
    };
  }

  const productId = iapProductIdForPack(packId);
  const { Purchases } = await import("@revenuecat/purchases-capacitor");

  try {
    const offerings = await Purchases.getOfferings();
    const packages = offerings.current?.availablePackages ?? [];
    const match =
      packages.find((pkg) => pkg.product.identifier === productId) ??
      packages.find((pkg) => pkg.identifier === productId);

    if (!match) {
      return {
        ok: false,
        error: `Store product not found (${productId}). Configure it in RevenueCat.`,
      };
    }

    for (let i = 0; i < quantity; i += 1) {
      const { customerInfo, productIdentifier, transaction } = await Purchases.purchasePackage({
        aPackage: match,
      });

      if (i === quantity - 1) {
        return {
          ok: true,
          productId: productIdentifier,
          transactionId: transaction?.transactionIdentifier ?? customerInfo.originalAppUserId,
        };
      }
    }

    return { ok: false, error: "Purchase could not be completed." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Purchase failed.";
    const cancelled =
      message.toLowerCase().includes("cancel") || message.toLowerCase().includes("cancelled");
    return { ok: false, error: message, cancelled };
  }
}
