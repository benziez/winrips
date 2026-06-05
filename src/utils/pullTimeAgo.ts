/** Lobby-style relative timestamp for pulls within the last minute. */
export function formatPullTimeAgo(iso: string, nowMs: number): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "Just now";

  const diffSec = Math.max(0, Math.floor((nowMs - then) / 1000));
  if (diffSec < 2 || diffSec > 60) return "Just now";
  return `${diffSec} second${diffSec === 1 ? "" : "s"} ago`;
}
