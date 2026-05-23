import { ShieldIcon } from "../icons/AppIcons";

interface FairnessVerifiedBadgeProps {
  onClick: () => void;
}

export function FairnessVerifiedBadge({ onClick }: FairnessVerifiedBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-400/90 transition-colors hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-300"
      aria-label="Fairness verified — view verification details"
    >
      <ShieldIcon size={12} className="text-emerald-400/90 group-hover:text-emerald-300" />
      <span className="hidden sm:inline">Fairness Verified</span>
    </button>
  );
}
