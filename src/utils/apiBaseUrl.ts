import { isNativeCapacitorApp } from "./platform";

const DEFAULT_API_BASE_URL = "https://www.winrips.com";

function readNativeApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim();
  const base = fromEnv || DEFAULT_API_BASE_URL;
  return base.replace(/\/$/, "");
}

/**
 * Resolves a Vercel API path for the current runtime.
 * Web/dev: relative path (same-origin or Vite dev middleware).
 * Native Capacitor: absolute URL against production (or VITE_API_BASE_URL).
 */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (isNativeCapacitorApp()) {
    return `${readNativeApiBaseUrl()}${normalized}`;
  }
  return normalized;
}
