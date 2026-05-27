import { useApp } from "../../context/AppContext";
import {
  getFooterPageContent,
  type FooterPageSlug,
} from "../../constants/footerContent";
import { MOBILE_COLORS, OBSIDIAN_GOLD } from "../mobile/mobileTheme";

interface InfoPageViewProps {
  pageSlug: FooterPageSlug;
  /** Native shell — Obsidian layout; use with external dismiss control. */
  mobile?: boolean;
  onBack?: () => void;
}

export function InfoPageView({ pageSlug, mobile = false, onBack }: InfoPageViewProps) {
  const { goToLobby } = useApp();
  const page = getFooterPageContent(pageSlug);
  const handleBack = onBack ?? goToLobby;

  if (!page) {
    const notFound = (
      <>
        <p style={{ color: mobile ? MOBILE_COLORS.textMuted : undefined }} className="text-slate-400">
          This page could not be found.
        </p>
        <button
          type="button"
          onClick={handleBack}
          className={
            mobile
              ? "mt-4 text-sm font-semibold"
              : "mt-4 text-sm font-semibold text-[#FF007F] hover:underline"
          }
          style={mobile ? { color: OBSIDIAN_GOLD.bright } : undefined}
        >
          Go back
        </button>
      </>
    );

    if (mobile) {
      return <div className="px-6 pb-8">{notFound}</div>;
    }

    return <div className="mx-auto max-w-4xl px-6 py-12">{notFound}</div>;
  }

  if (mobile) {
    return (
      <article className="px-6 pb-8">
        <header className="mb-6 border-b border-white/10 pb-5">
          <p
            className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{ color: OBSIDIAN_GOLD.bright }}
          >
            {page.eyebrow}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">{page.title}</h1>
        </header>

        <div
          className="space-y-5 text-sm leading-relaxed sm:text-[15px] sm:leading-relaxed"
          style={{ color: MOBILE_COLORS.textMuted }}
        >
          {page.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="text-[#D4D4D8]">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    );
  }

  return (
    <article className="mx-auto max-w-4xl px-6 py-12">
      <button
        type="button"
        onClick={handleBack}
        className="mb-6 text-xs font-semibold uppercase tracking-wider text-muted transition-colors hover:text-[#FF007F]"
      >
        ← Back to lobby
      </button>

      <header className="mb-8 border-b border-border pb-6">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF007F]">
          {page.eyebrow}
        </p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
          {page.title}
        </h1>
      </header>

      <div className="space-y-5 text-sm leading-relaxed text-slate-300 sm:text-[15px] sm:leading-relaxed">
        {page.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 48)}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
