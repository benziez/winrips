import type { CSSProperties } from "react";
import { WINRIPS_LOGO_ALT, WINRIPS_LOGO_SRC } from "../../constants/brandAssets";

type LogoVariant = "hero" | "nav" | "sidebar";

const MATTE_STRIP_FILTER =
  "brightness(1) drop-shadow(0 0 1px rgba(0,0,0,0))";

const VARIANT_CONFIG: Record<
  LogoVariant,
  { className: string; style: CSSProperties }
> = {
  hero: {
    className:
      "mx-auto mb-2 block h-32 w-auto object-contain md:h-40 [filter:brightness(1)_drop-shadow(0_0_1px_rgba(0,0,0,0))]",
    style: {
      mixBlendMode: "screen",
      filter: MATTE_STRIP_FILTER,
      WebkitFilter: MATTE_STRIP_FILTER,
    },
  },
  nav: {
    className: "block h-14 w-auto object-contain",
    style: { mixBlendMode: "screen" },
  },
  sidebar: {
    className: "block h-14 w-auto object-contain object-left",
    style: { mixBlendMode: "screen" },
  },
};

export function WinRipsLogo({
  variant = "nav",
  className = "",
}: {
  variant?: LogoVariant;
  className?: string;
}) {
  const config = VARIANT_CONFIG[variant];

  return (
    <img
      src={WINRIPS_LOGO_SRC}
      alt={WINRIPS_LOGO_ALT}
      className={`${config.className} ${className}`.trim()}
      style={config.style}
      decoding="async"
    />
  );
}
