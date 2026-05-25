import { useState, type CSSProperties } from "react";
import { BRAND_FUCHSIA, BRAND_GOLD } from "../../constants/theme";

function brandInputStyle(focused: boolean): CSSProperties {
  return {
    borderColor: focused
      ? BRAND_FUCHSIA
      : `color-mix(in srgb, ${BRAND_GOLD} 28%, transparent)`,
    boxShadow: focused
      ? `0 0 0 2px color-mix(in srgb, ${BRAND_FUCHSIA} 22%, transparent), 0 0 18px color-mix(in srgb, ${BRAND_FUCHSIA} 12%, transparent)`
      : "none",
  };
}

export function BrandTextField({
  label,
  value,
  disabled = false,
  placeholder,
  autoComplete,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  placeholder: string;
  autoComplete?: string;
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
        {label}
      </label>
      <input
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-lg border bg-obsidian px-3 py-2.5 text-sm text-white placeholder:text-muted/60 transition-all duration-200 focus:outline-none disabled:opacity-50"
        style={brandInputStyle(focused)}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

export function ReleaseSpinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
      aria-hidden
    />
  );
}
