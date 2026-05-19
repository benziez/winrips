import type { AppView } from "../types";

export type NavItemKind = "route" | "locked" | "group";

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  kind: NavItemKind;
  view?: AppView;
  children?: { label: string; view: AppView }[];
}

export const PRIMARY_NAV: NavItem[] = [
  { id: "lobby", label: "Mystery Drops", icon: "📦", kind: "route", view: "lobby" },
  {
    id: "box-battles",
    label: "Box Battles",
    icon: "⚔️",
    kind: "route",
    view: "battles",
  },
  {
    id: "item-upgrader",
    label: "Item Upgrader",
    icon: "🔄",
    kind: "route",
    view: "upgrader",
  },
  { id: "inventory", label: "Your Vault", icon: "🎒", kind: "route", view: "vault" },
  {
    id: "leaderboard",
    label: "Collector Leaderboard",
    icon: "🏆",
    kind: "route",
    view: "leaderboard",
  },
  { id: "rewards", label: "Rewards & Clubs", icon: "🎁", kind: "route", view: "rewards" },
  {
    id: "fairness",
    label: "Fairness",
    icon: "📜",
    kind: "group",
    children: [
      { label: "Provably Fair Hub", view: "fairness" },
      { label: "Help Desk", view: "help-desk" },
    ],
  },
];

/** @deprecated Utility links merged into PRIMARY_NAV Fairness group — kept for module compat */
export const UTILITY_NAV: NavItem[] = [];

export const SOCIAL_LINKS = [
  { id: "x", label: "X (Twitter)", href: "https://x.com" },
  { id: "discord", label: "Discord", href: "https://discord.com" },
  { id: "telegram", label: "Telegram", href: "https://telegram.org" },
] as const;

export function isNavActive(view: AppView, item: NavItem): boolean {
  if (item.kind === "group" && item.children) {
    return item.children.some((c) => c.view === view);
  }
  if (item.kind !== "route" || !item.view) return false;
  if (item.view === "lobby") return view === "lobby" || view === "pack-open";
  if (item.view === "vault") return view === "vault" || view === "inventory";
  return view === item.view;
}
