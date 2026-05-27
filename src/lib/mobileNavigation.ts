import type { NavigateFunction } from "react-router-dom";

let mobileNavigate: NavigateFunction | null = null;

export function registerMobileNavigator(navigate: NavigateFunction): void {
  mobileNavigate = navigate;
}

export function unregisterMobileNavigator(): void {
  mobileNavigate = null;
}

/** Navigate within the native shell (no-op when react-router is not mounted). */
export function navigateMobilePath(path: string): void {
  if (mobileNavigate) {
    mobileNavigate(path);
    return;
  }
  window.history.pushState({}, "", path);
}
