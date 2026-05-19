const OPTIONS = [1, 5, 10] as const;

export type OpenQuantity = (typeof OPTIONS)[number];

interface QuantitySelectorProps {
  value: OpenQuantity;
  onChange: (q: OpenQuantity) => void;
  disabled?: boolean;
}

export function QuantitySelector({ value, onChange, disabled }: QuantitySelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <span className="text-xs uppercase tracking-wider text-muted font-medium">
        Open quantity
      </span>
      <div className="inline-flex rounded-md border border-border bg-obsidian p-0.5">
        {OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className={`min-w-[3rem] px-4 py-2 rounded text-sm font-bold transition-colors ${
              value === n
                ? "bg-fuchsia text-white"
                : "text-muted hover:text-white"
            }`}
          >
            {n}x
          </button>
        ))}
      </div>
    </div>
  );
}
