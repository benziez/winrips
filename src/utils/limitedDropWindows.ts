import type { LimitedDropPackId } from "../constants/packs";
import { isLimitedDropPackId } from "../constants/packs";

const DROP_TZ = "America/New_York";

interface ZonedParts {
  hour: number;
  minute: number;
  weekday: string;
}

function getZonedParts(date: Date): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: DROP_TZ,
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  let hour = Number(read("hour"));
  if (hour === 24) hour = 0;

  return {
    hour,
    minute: Number(read("minute")),
    weekday: read("weekday"),
  };
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function findNextWindowStartMs(fromMs: number, startHour: number): number {
  let probe = new Date(fromMs);
  probe.setSeconds(0, 0);

  for (let step = 0; step <= 48 * 60; step += 1) {
    if (step > 0) {
      probe = new Date(probe.getTime() + 60_000);
    }

    const { hour, minute } = getZonedParts(probe);
    if (hour === startHour && minute === 0) {
      const startMs = probe.getTime();
      if (startMs > fromMs) return startMs;
    }
  }

  return fromMs + 24 * 60 * 60_000;
}

function isWeekendInEst(now: Date): boolean {
  const { weekday } = getZonedParts(now);
  return weekday === "Sat" || weekday === "Sun";
}

function findNextWeekendStartMs(fromMs: number): number {
  let probe = new Date(fromMs);
  probe.setSeconds(0, 0);

  for (let step = 0; step <= 7 * 24 * 60; step += 1) {
    if (step > 0) {
      probe = new Date(probe.getTime() + 60_000);
    }

    const parts = getZonedParts(probe);
    if ((parts.weekday === "Sat" || parts.weekday === "Sun") && parts.hour === 0 && parts.minute === 0) {
      const startMs = probe.getTime();
      if (startMs > fromMs) return startMs;
    }
  }

  return fromMs + 7 * 24 * 60 * 60_000;
}

export interface LimitedDropWindowState {
  isLive: boolean;
  isDisabled: boolean;
  countdownMs: number;
  countdownLabel: string;
}

export function getLimitedDropWindowState(
  packId: LimitedDropPackId,
  nowMs: number,
): LimitedDropWindowState {
  const now = new Date(nowMs);

  if (packId === "flash") {
    return {
      isLive: true,
      isDisabled: false,
      countdownMs: 0,
      countdownLabel: "",
    };
  }

  if (packId === "weekend-warrior") {
    const live = isWeekendInEst(now);
    if (live) {
      return {
        isLive: true,
        isDisabled: false,
        countdownMs: 0,
        countdownLabel: "LIVE NOW",
      };
    }

    const nextStartMs = findNextWeekendStartMs(nowMs);
    return {
      isLive: false,
      isDisabled: true,
      countdownMs: Math.max(0, nextStartMs - nowMs),
      countdownLabel: formatCountdown(Math.max(0, nextStartMs - nowMs)),
    };
  }

  const startHour = packId === "power-hour" ? 20 : 0;
  const endHour = packId === "power-hour" ? 22 : 1;
  const { hour } = getZonedParts(now);
  const live = hour >= startHour && hour < endHour;

  if (live) {
    return {
      isLive: true,
      isDisabled: false,
      countdownMs: 0,
      countdownLabel: "LIVE NOW",
    };
  }

  const nextStartMs = findNextWindowStartMs(nowMs, startHour);
  const countdownMs = Math.max(0, nextStartMs - nowMs);

  return {
    isLive: false,
    isDisabled: false,
    countdownMs,
    countdownLabel: formatCountdown(countdownMs),
  };
}

const LIMITED_DROP_OPEN_MESSAGES: Partial<Record<LimitedDropPackId, string>> = {
  "power-hour": "Available 8–10PM EST",
  "midnight-grail": "Available 12–1AM EST",
  "weekend-warrior": "Available Sat & Sun only",
};

/** When non-null, the pack detail screen should disable Open Pack and show this label. */
export function getLimitedDropOpenBlockMessage(
  packId: string,
  nowMs: number = Date.now(),
): string | null {
  if (!isLimitedDropPackId(packId)) return null;

  const dropId = packId as LimitedDropPackId;
  const state = getLimitedDropWindowState(dropId, nowMs);
  if (dropId === "flash" || state.isLive) return null;

  return LIMITED_DROP_OPEN_MESSAGES[dropId] ?? null;
}

/** Same window rules as the lobby — battles and pack opens must not bypass this. */
export function isLimitedDropAvailable(
  packId: string,
  nowMs: number = Date.now(),
): boolean {
  return getLimitedDropOpenBlockMessage(packId, nowMs) === null;
}
