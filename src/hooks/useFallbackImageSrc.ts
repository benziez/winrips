import { useEffect, useState } from "react";
import placeholder from "@/assets/placeholder.png";

/**
 * Resilient image src — falls back to bundled placeholder on load failure.
 */
export function useFallbackImageSrc(
  src?: string | null,
  fallback: string = placeholder,
): { imgSrc: string; onError: () => void } {
  const initial = src?.trim() || fallback;
  const [imgSrc, setImgSrc] = useState(initial);

  useEffect(() => {
    setImgSrc(src?.trim() || fallback);
  }, [src, fallback]);

  function onError() {
    setImgSrc(fallback);
  }

  return { imgSrc, onError };
}

export { placeholder as IMAGE_PLACEHOLDER };
