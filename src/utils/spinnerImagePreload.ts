import type { Card } from "../types";
import { resolveCollectibleImageSrc } from "./collectibleImageSrc";

const DEFAULT_LEAD_COUNT = 20;

/** Must stay aligned with `UnboxingCarousel` compact reel art rules. */
export const SPIN_TAPE_LEAD_ART_MAX_INDEX = 6;
export const SPIN_ART_RENDER_WINDOW = 8;

export interface SpinnerStripPreload {
  /** Index-aligned map — slot N always maps to strip[N]'s preloaded bitmap. */
  byIndex: Map<number, HTMLImageElement>;
  /** URL-aligned cache — any slot can resolve art during spin. */
  byUrl: Map<string, HTMLImageElement>;
  /** All Image instances — pin in a ref so iOS WebKit does not GC them mid-spin. */
  pinned: HTMLImageElement[];
}

interface SlotImageLoad {
  slotIndex: number;
  url: string;
}

function collectSpinnerPreloadIndices(
  stripLength: number,
  winnerIndex: number,
  leadCount: number,
): number[] {
  const indices = new Set<number>();
  for (let i = 0; i < Math.min(leadCount, stripLength); i += 1) {
    indices.add(i);
  }
  if (winnerIndex >= 0 && winnerIndex < stripLength) {
    indices.add(winnerIndex);
  }
  return [...indices].sort((a, b) => a - b);
}

/** Every tape slot that renders real art during a compact mobile spin (landed). */
export function collectCompactSpinPreloadIndices(
  stripLength: number,
  winnerIndex: number,
  leadCount: number = DEFAULT_LEAD_COUNT,
): number[] {
  const indices = new Set<number>();

  for (const slotIndex of collectSpinnerPreloadIndices(stripLength, winnerIndex, leadCount)) {
    indices.add(slotIndex);
  }

  for (let i = 0; i <= Math.min(SPIN_TAPE_LEAD_ART_MAX_INDEX, stripLength - 1); i += 1) {
    indices.add(i);
  }

  for (let offset = -SPIN_ART_RENDER_WINDOW; offset <= SPIN_ART_RENDER_WINDOW; offset += 1) {
    const slotIndex = winnerIndex + offset;
    if (slotIndex >= 0 && slotIndex < stripLength) {
      indices.add(slotIndex);
    }
  }

  return [...indices].sort((a, b) => a - b);
}

/** All strip slots — used before mobile spin when every tile shows real art. */
export function collectFullStripPreloadIndices(stripLength: number): number[] {
  return Array.from({ length: stripLength }, (_, index) => index);
}

/** Strict network preload — resolves only after onload/decode (or onerror). */
export function preloadImageAtUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      void (async () => {
        try {
          if (typeof img.decode === "function") {
            await img.decode();
          }
        } catch {
          /* decode() can reject on some WebKit builds — bitmap is still usable */
        }
        resolve(img);
      })();
    };
    img.onerror = () => resolve(img);
    img.src = url;
  });
}

function collectSlotImageLoads(strip: Card[], indices: number[]): SlotImageLoad[] {
  const loads: SlotImageLoad[] = [];
  for (const slotIndex of indices) {
    const raw = strip[slotIndex]?.image?.trim();
    if (!raw) continue;
    loads.push({
      slotIndex,
      url: resolveCollectibleImageSrc(raw),
    });
  }
  return loads;
}

/** Await every URL — does not return until each promise has fired onload or onerror. */
export async function preloadImagesAtUrls(urls: string[]): Promise<HTMLImageElement[]> {
  if (typeof window === "undefined" || urls.length === 0) return [];

  const uniqueUrls = [...new Set(urls.map((url) => url.trim()).filter(Boolean))];
  const loadPromises = uniqueUrls.map((url) => preloadImageAtUrl(url));
  return Promise.all(loadPromises);
}

export interface PreloadSpinnerStripOptions {
  leadCount?: number;
  /** Include every compact mobile art slot (tape lead + winner neighborhood). */
  compactMobile?: boolean;
  /** Preload every slot in the strip before spin (mobile pack open). */
  preloadFullStrip?: boolean;
}

/** Preload tape art before a carousel spin (strict Promise.all). */
export async function preloadSpinnerStripImages(
  strip: Card[],
  winnerIndex: number,
  options?: PreloadSpinnerStripOptions,
): Promise<SpinnerStripPreload> {
  const empty: SpinnerStripPreload = { byIndex: new Map(), byUrl: new Map(), pinned: [] };

  if (typeof window === "undefined" || strip.length === 0) return empty;

  const leadCount = options?.leadCount ?? DEFAULT_LEAD_COUNT;
  const indices = options?.preloadFullStrip
    ? collectFullStripPreloadIndices(strip.length)
    : options?.compactMobile
      ? collectCompactSpinPreloadIndices(strip.length, winnerIndex, leadCount)
      : collectSpinnerPreloadIndices(strip.length, winnerIndex, leadCount);

  if (indices.length === 0) return empty;

  const slotLoads = collectSlotImageLoads(strip, indices);
  if (slotLoads.length === 0) return empty;

  const uniqueUrls = [...new Set(slotLoads.map((load) => load.url))];
  const urlImages = await Promise.all(uniqueUrls.map((url) => preloadImageAtUrl(url)));
  const imageByUrl = new Map<string, HTMLImageElement>();
  for (let i = 0; i < uniqueUrls.length; i += 1) {
    imageByUrl.set(uniqueUrls[i]!, urlImages[i]!);
  }

  const byIndex = new Map<number, HTMLImageElement>();
  const pinned: HTMLImageElement[] = [];
  const pinnedSet = new Set<HTMLImageElement>();

  for (const { slotIndex, url } of slotLoads) {
    const img = imageByUrl.get(url);
    if (!img || img.naturalWidth <= 0) continue;
    byIndex.set(slotIndex, img);
    if (!pinnedSet.has(img)) {
      pinnedSet.add(img);
      pinned.push(img);
    }
  }

  return { byIndex, byUrl: imageByUrl, pinned };
}

/** Resolve a preloaded bitmap for a card image URL. */
export function resolvePreloadedSpinImage(
  preloaded: SpinnerStripPreload | undefined,
  cardImage: string | undefined,
  slotIndex?: number,
): HTMLImageElement | undefined {
  if (!preloaded) return undefined;
  if (slotIndex != null) {
    const fromSlot = preloaded.byIndex.get(slotIndex);
    if (fromSlot && fromSlot.naturalWidth > 0) return fromSlot;
  }
  const raw = cardImage?.trim();
  if (!raw) return undefined;
  const url = resolveCollectibleImageSrc(raw);
  const fromUrl = preloaded.byUrl.get(url);
  return fromUrl && fromUrl.naturalWidth > 0 ? fromUrl : undefined;
}
