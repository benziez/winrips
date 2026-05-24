import { BRAND_FUCHSIA } from "../../constants/theme";

export function WinRipsLogo() {
  return (
    <img
      src="/logo-fixed.png"
      alt="WinRips"
      className="block h-10 w-auto object-contain lg:h-11"
      style={{
        maxWidth: "160px",
        filter: `drop-shadow(0 0 10px color-mix(in srgb, ${BRAND_FUCHSIA} 30%, transparent))`,
      }}
      decoding="async"
    />
  );
}
