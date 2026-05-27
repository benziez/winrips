/**
 * Maps pack IDs to RevenueCat / App Store product identifiers.
 * Configure matching products in App Store Connect + RevenueCat dashboard.
 *
 * Override mapping via VITE_IAP_PRODUCT_MAP JSON: { "pack-id": "product_id" }
 */
const DEFAULT_PREFIX = "com.winrips.pack";

function readEnvProductMap(): Record<string, string> {
  const raw = import.meta.env.VITE_IAP_PRODUCT_MAP;
  if (!raw || typeof raw !== "string") return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

const ENV_PRODUCT_MAP = readEnvProductMap();

export function iapProductIdForPack(packId: string): string {
  const trimmed = packId.trim();
  if (ENV_PRODUCT_MAP[trimmed]) return ENV_PRODUCT_MAP[trimmed];
  const slug = trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${DEFAULT_PREFIX}.${slug}`;
}
