/** Shimmer placeholder shown while collectible/pack images load. */
export function ImageLoadingShimmer({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 animate-pulse ${className}`}
    />
  );
}
