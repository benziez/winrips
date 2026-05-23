import type { NavIconName } from "./icons/AppIcons";
import { NavIcon } from "./icons/AppIcons";
import type { FooterPageSlug } from "../constants/footerContent";
import type { AppView } from "../types";
import { useApp } from "../context/AppContext";
import { useNavDrawer } from "./layout/Sidebar";

export interface NavDrawerLink {
  id: string;
  label: string;
  icon: NavIconName;
}

export const USER_HUB_LINKS: NavDrawerLink[] = [
  { id: "inventory", label: "Inventory", icon: "wallet" },
  { id: "play-history", label: "Play History", icon: "scroll" },
  { id: "exchange", label: "Exchange", icon: "exchange" },
  { id: "withdrawals", label: "Withdrawals", icon: "withdraw" },
  { id: "affiliate", label: "Affiliate", icon: "users" },
  { id: "settings", label: "Settings", icon: "settings" },
];

export const PLATFORM_CORE_LINKS: NavDrawerLink[] = [
  { id: "provably-fair", label: "Provably Fair", icon: "shield" },
  { id: "faq", label: "FAQ", icon: "help" },
  { id: "support", label: "Support", icon: "message" },
  { id: "psa-grading", label: "PSA Grading", icon: "award" },
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
    "play-history": "play-history",
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

function hubButtonClass(expanded: boolean): string {
  if (expanded) {
    return "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[13px] font-medium tracking-tight text-muted transition-colors duration-200 hover:bg-slate hover:text-white";
  }
  return "flex h-10 w-10 items-center justify-center rounded-md p-0 text-muted transition-colors duration-200 hover:bg-slate hover:text-white";
}

function isHubLinkActive(linkId: string, currentView: AppView): boolean {
  if (linkId === "play-history") return currentView === "play-history";
  if (linkId === "inventory") {
    return currentView === "vault" || currentView === "inventory";
  }
  return false;
}

function HubNavLink({ link, expanded }: { link: NavDrawerLink; expanded: boolean }) {
  const { currentView, navigateToView, openInfoPage } = useApp();
  const { closeMenu } = useNavDrawer();
  const active = isHubLinkActive(link.id, currentView);

  return (
    <li>
      <button
        type="button"
        aria-label={link.label}
        aria-current={active ? "page" : undefined}
        title={!expanded ? link.label : undefined}
        onClick={() => {
          closeMenu();
          resolveHubLink(link.id, navigateToView, openInfoPage);
        }}
        className={`${hubButtonClass(expanded)} ${
          active ? "bg-slate-elevated text-white shadow-[inset_2px_0_0_0_#ff007a]" : ""
        }`}
      >
        <NavIcon name={link.icon} size={18} className="shrink-0" />
        {expanded ? (
          <span className="truncate text-left leading-snug">{link.label}</span>
        ) : null}
      </button>
    </li>
  );
}

function HubNavSection({
  title,
  links,
  expanded,
  showDivider,
}: {
  title: string;
  links: NavDrawerLink[];
  expanded: boolean;
  showDivider?: boolean;
}) {
  return (
    <section
      className={
        expanded
          ? ""
          : `flex w-full flex-col items-center ${showDivider ? "border-t border-border/60 pt-2" : ""}`
      }
    >
      {expanded ? (
        <h3 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
          {title}
        </h3>
      ) : null}
      <ul
        className={
          expanded ? "space-y-0.5" : "flex w-full flex-col items-center gap-1"
        }
      >
        {links.map((link) => (
          <HubNavLink key={link.id} link={link} expanded={expanded} />
        ))}
      </ul>
    </section>
  );
}

export function SidebarHubNav({ expanded }: { expanded: boolean }) {
  return (
    <div
      className={
        expanded
          ? "mt-4 w-full space-y-4 border-t border-border pt-4"
          : "mt-2 flex w-full flex-col items-center gap-1 border-t border-border pt-2"
      }
    >
      <HubNavSection title="User Hub" links={USER_HUB_LINKS} expanded={expanded} />
      <HubNavSection
        title="Platform Core"
        links={PLATFORM_CORE_LINKS}
        expanded={expanded}
        showDivider={!expanded}
      />
    </div>
  );
}
