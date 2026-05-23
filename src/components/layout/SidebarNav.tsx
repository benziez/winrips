import { useState } from "react";
import { ChevronDown, NavIcon } from "../icons/AppIcons";
import type { AppView } from "../../types";
import { PRIMARY_NAV, isNavActive, type NavItem } from "../../data/navigation";
import { useApp } from "../../context/AppContext";
import { useNavDrawer } from "./Sidebar";

function navButtonClass(active: boolean, expanded: boolean, locked: boolean): string {
  const base = expanded
    ? "w-full gap-3 px-2.5 py-2"
    : "h-10 w-10 justify-center p-0";

  if (locked) {
    return `${base} flex items-center rounded-md opacity-40 cursor-not-allowed`;
  }
  if (active) {
    return `${base} flex items-center rounded-md bg-slate-elevated text-white shadow-[inset_2px_0_0_0_#ff007a]`;
  }
  return `${base} flex items-center rounded-md text-muted transition-colors duration-200 hover:bg-slate hover:text-white`;
}

function LockedLabel({ label, expanded }: { label: string; expanded: boolean }) {
  if (!expanded) return null;
  return (
    <span className="truncate text-left text-[13px] font-medium leading-snug tracking-tight">
      {label}
      <span className="ml-1 text-[10px] text-muted/70">Soon</span>
    </span>
  );
}

function NavButton({
  item,
  active,
  expanded,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
  onNavigate: (view: AppView) => void;
}) {
  const locked = item.kind === "locked";
  const { closeMenu } = useNavDrawer();

  return (
    <button
      type="button"
      disabled={locked}
      title={!expanded ? item.label : undefined}
      aria-label={item.label}
      onClick={() => {
        if (!item.view) return;
        closeMenu();
        onNavigate(item.view);
      }}
      className={navButtonClass(active, expanded, locked)}
    >
      <NavIcon name={item.icon} size={18} className="shrink-0" />
      {locked ? (
        <LockedLabel label={item.label} expanded={expanded} />
      ) : (
        <span
          className={`truncate text-left text-[13px] font-medium leading-snug tracking-tight transition-opacity duration-200 ${
            expanded ? "opacity-90" : "sr-only"
          } ${active ? "text-white" : ""}`}
        >
          {item.label}
        </span>
      )}
    </button>
  );
}

function FairnessGroup({
  item,
  active,
  expanded,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
  onNavigate: (view: AppView) => void;
}) {
  const [open, setOpen] = useState(active);
  const { closeMenu } = useNavDrawer();

  const goTo = (view: AppView) => {
    closeMenu();
    onNavigate(view);
  };

  if (!expanded) {
    return (
      <button
        type="button"
        title={item.label}
        aria-label={item.label}
        onClick={() => goTo("fairness")}
        className={navButtonClass(active, false, false)}
      >
        <NavIcon name={item.icon} size={18} />
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${navButtonClass(active, true, false)} w-full`}
      >
        <NavIcon name={item.icon} size={18} className="shrink-0" />
        <span className="flex-1 truncate text-left text-[13px] font-medium tracking-tight">
          {item.label}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && item.children && (
        <ul className="ml-5 mt-0.5 space-y-0.5 border-l border-border/80 pl-3">
          {item.children.map((child) => (
            <li key={child.view}>
              <button
                type="button"
                onClick={() => goTo(child.view)}
                className="w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-muted transition-colors duration-200 hover:bg-slate hover:text-white"
              >
                {child.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SidebarNav({ expanded = true }: { expanded?: boolean }) {
  const { currentView, navigateToView } = useApp();

  return (
    <nav
      className={`flex w-full flex-col gap-1 ${
        expanded ? "" : "items-center"
      }`}
    >
      {PRIMARY_NAV.map((item) =>
        item.kind === "group" ? (
          <FairnessGroup
            key={item.id}
            item={item}
            active={isNavActive(currentView, item)}
            expanded={expanded}
            onNavigate={navigateToView}
          />
        ) : (
          <NavButton
            key={item.id}
            item={item}
            active={isNavActive(currentView, item)}
            expanded={expanded}
            onNavigate={navigateToView}
          />
        ),
      )}
    </nav>
  );
}
