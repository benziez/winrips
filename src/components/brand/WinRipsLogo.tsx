import { BRAND_FUCHSIA } from "../../constants/theme";
import { WINRIPS_LOGO_SRC } from "../../constants/brandAssets";
import { resolveAssetUrl } from "../../utils/resolveAssetUrl";

interface WinRipsLogoProps {
  className?: string;
  maxWidth?: number;
}

export function WinRipsLogo({
  className = "block h-10 w-auto object-contain lg:h-11",
  maxWidth = 160,
}: WinRipsLogoProps = {}) {
  return (
    <img
      src={resolveAssetUrl(WINRIPS_LOGO_SRC)}
      alt="WinRips"
      className={className}
      loading="eager"
      fetchPriority="high"
      style={{
        maxWidth: `${maxWidth}px`,
        filter: `drop-shadow(0 0 10px color-mix(in srgb, ${BRAND_FUCHSIA} 30%, transparent))`,
      }}
      decoding="async"
    />
  );
}
