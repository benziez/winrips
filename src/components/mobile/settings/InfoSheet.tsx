import { FOOTER_CONTENT, type FooterPageSlug } from "../../../constants/footerContent";
import { RipBottomSheet } from "../rip/RipBottomSheet";

interface InfoSheetProps {
  open: boolean;
  onClose: () => void;
  contentKey: FooterPageSlug | null;
}

export function InfoSheet({ open, onClose, contentKey }: InfoSheetProps) {
  if (!contentKey) return null;

  const page = FOOTER_CONTENT[contentKey];

  return (
    <RipBottomSheet open={open} onClose={onClose} heightClass="h-auto max-h-[85dvh]">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-14">
        <div className="mt-4 px-6">
          <p className="text-[12px] font-medium uppercase tracking-wider text-[var(--rip-text-muted)]">
            {page.eyebrow}
          </p>
          <h2 className="mt-1 text-[26px] font-bold leading-tight text-white">{page.title}</h2>
        </div>

        <div className="mt-6 space-y-4 px-6">
          {page.paragraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 48)}
              className="text-[15px] leading-relaxed text-[var(--rip-text-primary)]"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </RipBottomSheet>
  );
}
