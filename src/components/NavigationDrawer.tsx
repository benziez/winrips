import type { FooterPageSlug } from "../constants/footerContent";
import type { AppView } from "../types";
import { useApp } from "../context/AppContext";
import { useNavDrawer } from "./layout/Sidebar";

export interface NavDrawerLink {
  id: string;
  label: string;
  icon: string;
}

export const USER_HUB_LINKS: NavDrawerLink[] = [
  { id: "inventory", label: "Inventory", icon: "🎒" },
  { id: "exchange", label: "Exchange", icon: "💱" },
  { id: "withdrawals", label: "Withdrawals", icon: "💸" },
  { id: "affiliate", label: "Affiliate", icon: "🤝" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export const PLATFORM_CORE_LINKS: NavDrawerLink[] = [
  { id: "provably-fair", label: "Provably Fair", icon: "📜" },
  { id: "faq", label: "FAQ", icon: "❓" },
  { id: "support", label: "Support", icon: "💬" },
  { id: "psa-grading", label: "PSA Grading", icon: "🏅" },
];

function resolveHubLink(
  id: string,
  navigateToView: (view: AppView) => void,
  openInfoPage: (slug: FooterPageSlug) => void,
) {
  const infoSlugs: Record<string, FooterPageSlug> = {
    affiliate: "affiliate",
    "provably-fair": "provably-fair",
    faq: "help-desk",
  };

  const viewMap: Record<string, AppView> = {
    inventory: "vault",
    exchange: "marketplace",
    withdrawals: "rewards",
    settings: "help-desk",
    support: "help-desk",
  };

  if (id === "psa-grading") return;

  if (infoSlugs[id]) {
    openInfoPage(infoSlugs[id]);
  } else if (viewMap[id]) {
    navigateToView(viewMap[id]);
  }
}

function HubNavSection({
  title,
  links,
  expanded,
}: {
  title: string;
  links: NavDrawerLink[];
  expanded: boolean;
}) {
  const { navigateToView, openInfoPage } = useApp();
  const { closeMenu } = useNavDrawer();

  return (
    <section>
      <h3
        className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted transition-opacity duration-300 ${
          expanded ? "opacity-100" : "sr-only"
        }`}
      >
        {title}
      </h3>
      <ul className="space-y-0.5">
        {links.map((link) => (
          <li key={link.id}>
            <button
              type="button"
              title={!expanded ? link.label : undefined}
              aria-label={link.label}
              onClick={() => {
                closeMenu();
                resolveHubLink(link.id, navigateToView, openInfoPage);
              }}
              className={`flex w-full items-center rounded-lg text-sm font-medium text-muted transition-colors hover:bg-metallic hover:text-white ${
                expanded ? "gap-2.5 px-3 py-2" : "justify-center px-2 py-2.5"
              }`}
            >
              <span className="shrink-0 text-base">{link.icon}</span>
              <span
                className={`truncate text-left leading-snug transition-opacity duration-300 ${
                  expanded ? "opacity-100" : "hidden"
                }`}
              >
                {link.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** In-flow sidebar hub links (User Hub + Platform Core) — no overlay positioning. */
export function SidebarHubNav({ expanded }: { expanded: boolean }) {
  return (
    <div className={`space-y-4 border-t border-border pt-4 ${expanded ? "" : "pt-3"}`}>
      <HubNavSection title="User Hub" links={USER_HUB_LINKS} expanded={expanded} />
      <HubNavSection title="Platform Core" links={PLATFORM_CORE_LINKS} expanded={expanded} />
    </div>
  );
}
