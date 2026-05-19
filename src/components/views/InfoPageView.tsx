import { useApp } from "../../context/AppContext";
import {
  getFooterPageContent,
  type FooterPageSlug,
} from "../../constants/footerContent";

interface InfoPageViewProps {
  pageSlug: FooterPageSlug;
}

export function InfoPageView({ pageSlug }: InfoPageViewProps) {
  const { goToLobby } = useApp();
  const page = getFooterPageContent(pageSlug);

  if (!page) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-slate-400">This page could not be found.</p>
        <button
          type="button"
          onClick={goToLobby}
          className="mt-4 text-sm font-semibold text-[#FF007F] hover:underline"
        >
          Return to lobby
        </button>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-4xl px-6 py-12">
      <button
        type="button"
        onClick={goToLobby}
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
