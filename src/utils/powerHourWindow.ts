import type { LimitedDropPackId } from "../constants/packs";
import { getLimitedDropWindowState } from "./limitedDropWindows";

export const POWER_HOUR_PACK_ID: LimitedDropPackId = "power-hour";

/** @deprecated Use getLimitedDropWindowState("power-hour", nowMs) */
export function isPowerHourLive(now: Date = new Date()): boolean {
  return getLimitedDropWindowState("power-hour", now.getTime()).isLive;
}

/** @deprecated Use getLimitedDropWindowState("power-hour", nowMs) */
export function getPowerHourState(nowMs: number) {
  const state = getLimitedDropWindowState("power-hour", nowMs);
  return {
    isLive: state.isLive,
    countdownMs: state.countdownMs,
    countdownLabel: state.isLive ? "LIVE NOW" : state.countdownLabel,
  };
}
