import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";

type GlassVariant = "default" | "dock" | "none";

interface GlassSurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  variant?: GlassVariant;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  type?: "button" | "submit" | "reset";
}

const VARIANT_CLASS: Record<Exclude<GlassVariant, "none">, string> = {
  default: "obsidian-glass",
  dock: "obsidian-glass-dock",
};

/**
 * Single glass primitive — all panels, dock, modals, and frames compose from this.
 * Avoid nesting multiple blurred surfaces (WKWebView stutter during rip).
 */
export function GlassSurface({
  as: Component = "div",
  variant = "default",
  className = "",
  children,
  style,
  ...rest
}: GlassSurfaceProps) {
  const glassClass = variant === "none" ? "" : VARIANT_CLASS[variant];

  return (
    <Component className={`${glassClass} ${className}`.trim()} style={style} {...rest}>
      {children}
    </Component>
  );
}
