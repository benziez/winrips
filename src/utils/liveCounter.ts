function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Stable pseudo-live activity label per pack + row (e-commerce copy). */
export function getLiveActivity(packId: string, rowId: string): string {
  const seed = hashString(`${packId}:${rowId}`);
  const count = 48 + (seed % 280);
  const variant = seed % 3;

  if (variant === 0) return `${count} collectors active`;
  if (variant === 1) return `${Math.max(12, Math.floor(count / 4))} opened recently`;
  return `${Math.max(24, Math.floor(count / 2))} viewing now`;
}
