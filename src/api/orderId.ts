/** order_id format: winrips-{userId}-{timestamp} */
export function buildWinripsOrderId(userId: string): string {
  return `winrips-${userId}-${Date.now()}`;
}

export function parseWinripsOrderId(
  orderId: string,
): { userId: string; timestamp: string } | null {
  if (!orderId.startsWith("winrips-")) return null;

  const parts = orderId.split("-");
  if (parts.length < 3) return null;

  const timestamp = parts[parts.length - 1]!;
  const userId = parts.slice(1, -1).join("-");

  if (!userId || !/^\d+$/.test(timestamp)) return null;

  return { userId, timestamp };
}
