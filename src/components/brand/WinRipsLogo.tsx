import { BRAND_FUCHSIA } from "../../constants/theme";
import { WINRIPS_LOGO_SRC } from "../../constants/brandAssets";
import { resolveAssetUrl } from "../../utils/resolveAssetUrl";

export function WinRipsLogo() {
  return (
    <img
      src={resolveAssetUrl(WINRIPS_LOGO_SRC)}
      alt="WinRips"
      className="block h-10 w-auto object-contain lg:h-11"
      loading="eager"
      fetchPriority="high"
      style={{
        maxWidth: "160px",
        filter: `drop-shadow(0 0 10px color-mix(in srgb, ${BRAND_FUCHSIA} 30%, transparent))`,
      }}
      decoding="async"
    />
  );
}
