import { useState } from "react";
import type { AppView } from "../../types";
import { PRIMARY_NAV, isNavActive, type NavItem } from "../../data/navigation";
import { useApp } from "../../context/AppContext";
import { useNavDrawer } from "./Sidebar";

function LockedLabel({ label, expanded }: { label: string; expanded: boolean }) {
  if (!expanded) return null;
  return (
    <span className="truncate text-left leading-snug">
      {label}
      <span className="ml-1 text-[10px] text-muted/60">· Coming Soon</span>
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
      className={`flex w-full items-center rounded-lg text-sm font-medium transition-colors ${
        expanded ? "gap-2.5 px-3 py-2" : "justify-center px-2 py-2.5"
      } ${
        locked
          ? "cursor-not-allowed text-muted/50 opacity-70"
          : active
            ? "border border-fuchsia/20 bg-metallic text-fuchsia"
            : "text-muted hover:bg-metallic hover:text-white"
      }`}
    >
      <span className="shrink-0 text-base">{item.icon}</span>
      {locked ? (
        <LockedLabel label={item.label} expanded={expanded} />
      ) : (
        <span
          className={`truncate text-left leading-snug ${
            expanded ? "" : "hidden"
          }`}
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
        className={`flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium transition-colors ${
          active
            ? "border border-fuchsia/20 bg-metallic text-fuchsia"
            : "text-muted hover:bg-metallic hover:text-white"
        }`}
      >
        <span className="text-base">{item.icon}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          active
            ? "border border-fuchsia/20 bg-metallic text-fuchsia"
            : "text-muted hover:bg-metallic hover:text-white"
        }`}
      >
        <span className="shrink-0 text-base">{item.icon}</span>
        <span className="flex-1 truncate text-left">{item.label}</span>
        <span
          className={`text-[10px] text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▼
        </span>
      </button>
      {open && item.children && (
        <ul className="mt-0.5 ml-3 space-y-0.5 border-l border-border pl-3">
          {item.children.map((child) => (
            <li key={child.view}>
              <button
                type="button"
                onClick={() => goTo(child.view)}
                className="w-full rounded-md px-3 py-1.5 text-left text-xs text-muted transition-colors hover:bg-metallic/50 hover:text-fuchsia"
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
    <nav className="space-y-0.5">
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
