import { Capacitor } from "@capacitor/core";

/** Strip leading slash so paths work as Capacitor-relative (`images/...` not `/images/...`). */
export function normalizeLocalAssetPath(path: string): string {
  return path.replace(/^\.?\//, "");
}

/**
 * Resolves public and remote image URLs for web, Vite dev, and Capacitor native shells.
 * Local assets must use `images/...` or `assets/...` (no leading slash) — iOS WebViews
 * fail on bare root-relative `/images/...` src values.
 */
export function resolveAssetUrl(src: string | null | undefined): string {
  const trimmed = src?.trim() ?? "";
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;

  const relative = normalizeLocalAssetPath(trimmed);

  if (typeof window === "undefined") {
    return relative;
  }

  const { origin } = window.location;

  try {
    const base = import.meta.env.BASE_URL ?? "/";
    if (base && base !== "/" && !Capacitor.isNativePlatform()) {
      const basePath = base.endsWith("/") ? base : `${base}/`;
      return new URL(relative, new URL(basePath, origin)).href;
    }
    const root = origin.endsWith("/") ? origin.slice(0, -1) : origin;
    return `${root}/${relative}`;
  } catch {
    return relative;
  }
}

export function isRenderableAssetUrl(src: string | null | undefined): boolean {
  const resolved = resolveAssetUrl(src);
  return (
    resolved.startsWith("https://") ||
    resolved.startsWith("http://") ||
    resolved.startsWith("data:") ||
    resolved.startsWith("blob:") ||
    resolved.startsWith("capacitor://")
  );
}
