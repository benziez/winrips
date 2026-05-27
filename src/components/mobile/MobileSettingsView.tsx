import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { useApp } from "../../context/AppContext";
import type { FooterPageSlug } from "../../constants/footerContent";
import { RipAmbientShell } from "./rip/RipAmbientShell";
import { ChevronLeft } from "../icons/AppIcons";
import { hapticTabSelect } from "../../utils/mobileHaptics";

const LINK_ROWS: { label: string; slug?: FooterPageSlug; action?: "login" }[] = [
  { label: "Login", action: "login" },
  { label: "Terms of Use", slug: "terms" },
  { label: "Privacy Policy", slug: "privacy" },
  { label: "Tax Information", slug: "purchase-agreement" },
  { label: "Responsible Purchasing", slug: "responsible-play" },
  { label: "Data Preferences", slug: "privacy" },
];

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "1.26.0";
const BUILD_NUMBER = import.meta.env.VITE_BUILD_NUMBER ?? "199";

async function openExternalUrl(url: string) {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function MobileSettingsView() {
  const { navigateToView, openInfoPage, openAuthModal, isLoggedIn } = useApp();

  return (
    <RipAmbientShell>
      <header
        className="px-6"
        style={{ paddingTop: "calc(max(0.5rem, env(safe-area-inset-top)) + 0.5rem)" }}
      >
        <button
          type="button"
          onClick={() => {
            void hapticTabSelect();
            navigateToView("account");
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--rip-surface)] text-white"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="mt-4 text-[40px] font-bold text-white">Settings</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10">
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void openExternalUrl("mailto:support@winrips.com")}
            className="rounded-2xl bg-[var(--rip-surface)] p-5 text-left"
          >
            <p className="text-[20px] font-semibold text-[var(--rip-green-bright)]">Customer Support</p>
            <p className="mt-1 text-[15px] text-[var(--rip-text-muted)]">Questions or concerns</p>
          </button>
          <button
            type="button"
            onClick={() => openInfoPage("help-desk")}
            className="rounded-2xl bg-[var(--rip-surface)] p-5 text-left"
          >
            <p className="text-[20px] font-semibold text-white">Preferences</p>
            <p className="mt-1 text-[15px] text-[var(--rip-text-muted)]">Update your user preferences</p>
          </button>
          <button
            type="button"
            onClick={() => openInfoPage("help-desk")}
            className="rounded-2xl bg-[var(--rip-surface)] p-5 text-left"
          >
            <p className="text-[20px] font-semibold text-white">FAQ</p>
            <p className="mt-1 text-[15px] text-[var(--rip-text-muted)]">Get answers to common questions</p>
          </button>
        </div>

        <ul className="mx-2 mt-8">
          {LINK_ROWS.map((row) => (
            <li key={row.label} className="border-b border-[var(--rip-border)]">
              <button
                type="button"
                onClick={() => {
                  void hapticTabSelect();
                  if (row.action === "login") {
                    if (!isLoggedIn) openAuthModal("login");
                    return;
                  }
                  if (row.slug) openInfoPage(row.slug);
                }}
                className="flex w-full py-4 text-left text-[17px] font-medium text-white"
              >
                {row.label}
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-[13px] text-[var(--rip-text-muted)]">
          Version {APP_VERSION} ({BUILD_NUMBER})
        </p>
      </div>
    </RipAmbientShell>
  );
}
