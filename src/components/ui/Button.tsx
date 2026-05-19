import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
  | "primary"
  | "open"
  | "wallet"
  | "gold"
  | "fuchsia"
  | "ghost"
  | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: "bg-fuchsia text-white font-bold hover:bg-fuchsia-dim",
  open: "bg-fuchsia text-white font-bold uppercase tracking-wide hover:bg-fuchsia-dim",
  wallet:
    "bg-white text-obsidian font-bold glow-fuchsia-hover hover:bg-white/95",
  gold: "bg-[#FFD700] text-black font-bold hover:brightness-105",
  fuchsia: "bg-fuchsia text-white font-semibold hover:bg-fuchsia-dim",
  ghost:
    "bg-transparent text-muted hover:text-white border border-border hover:border-fuchsia/40",
  outline:
    "bg-transparent border border-border text-white hover:border-fuchsia hover:text-fuchsia",
};

const sizes: Record<"sm" | "md" | "lg", string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg font-semibold",
  md: "px-4 py-2.5 text-xs rounded-lg font-bold",
  lg: "px-6 py-3 text-sm rounded-lg font-bold",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
