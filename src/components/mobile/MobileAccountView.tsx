import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { deleteAccount } from "../../lib/deleteAccountApi";
import { clearLoggedIn } from "../../constants/userSession";
import { AppleSignInButton } from "../auth/AppleSignInButton";
import { MobileRipSettingsToggle } from "./MobileRipSettingsToggle";
import { GlassSurface } from "./GlassSurface";
import type { FooterPageSlug } from "../../constants/footerContent";
import { hapticTabSelect } from "../../utils/mobileHaptics";
import {
  MOBILE_COLORS,
  OBSIDIAN_GOLD,
  BTN_GHOST_OUTLINE,
  BTN_PRIMARY,
  mobileSafeAreaTopStyle,
} from "./mobileTheme";
import { MOBILE_DOCK_CLEARANCE } from "./MobileFloatingDock";

const LEGAL_LINKS: { label: string; slug: FooterPageSlug }[] = [
  { label: "Privacy Policy", slug: "privacy" },
  { label: "Terms of Service", slug: "terms" },
];

function AccountLegalSection({ onOpen }: { onOpen: (slug: FooterPageSlug) => void }) {
  return (
    <GlassSurface variant="default" className="rounded-2xl px-4 py-3">
      <p
        className="text-[11px] font-medium uppercase tracking-wider"
        style={{ color: MOBILE_COLORS.textMuted }}
      >
        Legal
      </p>
      <ul className="mt-2 divide-y divide-white/10">
        {LEGAL_LINKS.map((link) => (
          <li key={link.slug}>
            <button
              type="button"
              onClick={() => {
                void hapticTabSelect();
                onOpen(link.slug);
              }}
              className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm font-medium text-white"
            >
              <span>{link.label}</span>
              <span className="text-base" style={{ color: MOBILE_COLORS.textMuted }} aria-hidden>
                ›
              </span>
            </button>
          </li>
        ))}
      </ul>
    </GlassSurface>
  );
}

function readAuthMetadataUsername(
  metadata: Record<string, unknown> | undefined,
): string | null {
  const raw = metadata?.username;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

function formatJoinedLabel(createdAt: string | undefined): string | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function profileInitial(label: string): string {
  const char = label.trim().charAt(0);
  return char ? char.toUpperCase() : "?";
}

const DELETE_CONFIRM_WORD = "DELETE";

function DeleteAccountModal({
  open,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!open) {
      setTyped("");
    }
  }, [open]);

  const canConfirm = typed === DELETE_CONFIRM_WORD && !loading;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Dismiss"
            className="fixed inset-0 z-[80] bg-black/75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={loading ? undefined : onCancel}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="fixed inset-x-6 z-[81] mx-auto max-w-md"
            style={{ top: "max(4rem, calc(env(safe-area-inset-top) + 2rem))" }}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
          >
            <GlassSurface variant="default" className="rounded-2xl p-6">
              <h2 id="delete-account-title" className="text-lg font-semibold text-white">
                Delete account?
              </h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: MOBILE_COLORS.textMuted }}>
                This is permanent and cannot be undone. You will lose:
              </p>
              <ul
                className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed"
                style={{ color: MOBILE_COLORS.textMuted }}
              >
                <li>Your vault collection and any vaulted cards</li>
                <li>Your play and pull history</li>
                <li>Your profile and username</li>
                <li>Your battle history</li>
              </ul>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: MOBILE_COLORS.textMuted }}>
                If you have a shipment in progress, complete it or contact support before
                deleting your account.
              </p>
              <label className="mt-5 block">
                <span className="text-xs font-medium uppercase tracking-wider text-white/80">
                  Type {DELETE_CONFIRM_WORD} to confirm
                </span>
                <input
                  type="text"
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  disabled={loading}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-red-500/40"
                  placeholder={DELETE_CONFIRM_WORD}
                />
              </label>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={!canConfirm}
                  className={`${BTN_PRIMARY} border-red-500/40 !text-red-200 disabled:opacity-40`}
                >
                  {loading ? "Deleting…" : "Delete account"}
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={loading}
                  className={BTN_GHOST_OUTLINE}
                >
                  Cancel
                </button>
              </div>
            </GlassSurface>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

/** Profile, manual rip preference, and sign-out for the mobile shell. */
export function MobileAccountView() {
  const {
    isLoggedIn,
    userId,
    profileUsername,
    profileLoading,
    syncUserProfileFromServer,
    logout,
    openAuthModal,
    openInfoPage,
    showCashoutToast,
    closeWalletModal,
    setPurchaseModalOpen,
    setDepositModalOpen,
  } = useApp();
  const { user, session, signOut } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const metadataUsername = readAuthMetadataUsername(user?.user_metadata);
  const displayUsername = profileUsername || metadataUsername;
  const displayEmail = user?.email?.trim() || null;
  const joinedLabel = formatJoinedLabel(user?.created_at);

  const avatarLabel = displayUsername || displayEmail || "Collector";
  const headerTitle = displayUsername || "Account";

  useEffect(() => {
    if (!userId) return;
    void syncUserProfileFromServer(userId);
  }, [userId, syncUserProfileFromServer]);

  async function handleSignOut() {
    closeWalletModal();
    setPurchaseModalOpen(false);
    setDepositModalOpen(false);

    try {
      await signOut();
    } finally {
      clearLoggedIn();
      logout();
    }
  }

  async function handleDeleteAccount() {
    const accessToken = session?.access_token?.trim();
    if (!accessToken || isDeletingAccount) return;

    setIsDeletingAccount(true);

    try {
      const result = await deleteAccount(accessToken);

      if (result.ok) {
        setDeleteModalOpen(false);
        closeWalletModal();
        setPurchaseModalOpen(false);
        setDepositModalOpen(false);

        try {
          await signOut();
        } finally {
          clearLoggedIn();
          logout();
        }

        showCashoutToast("Your account has been deleted.");
        return;
      }

      if (result.status === 401) {
        showCashoutToast("Your session expired. Please sign in again.");
        return;
      }

      if (result.status === 409 && result.code === "pending_shipment") {
        showCashoutToast(result.error);
        return;
      }

      showCashoutToast(
        result.error || "Account could not be deleted. Try again or contact support.",
      );
    } finally {
      setIsDeletingAccount(false);
    }
  }

  const guestCta = useMemo(
    () => (
      <GlassSurface variant="default" className="rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white">Sign in to WinRips</h2>
        <p className="mt-2 text-sm" style={{ color: MOBILE_COLORS.textMuted }}>
          Sync your vault, track pulls, and save your collection across devices.
        </p>
        <div className="mt-6 space-y-3">
          <AppleSignInButton
            onSuccess={() => showCashoutToast("Welcome to WinRips!")}
            onError={(message) => showCashoutToast(message)}
          />
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className={BTN_GHOST_OUTLINE}
          >
            Sign in with email
          </button>
        </div>
      </GlassSurface>
    ),
    [openAuthModal, showCashoutToast],
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-black">
      <header className="relative z-10 shrink-0 px-6 pb-4" style={mobileSafeAreaTopStyle}>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Account</h1>
      </header>

      <div
        className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-6"
        style={{ paddingBottom: MOBILE_DOCK_CLEARANCE }}
      >
        {isLoggedIn && userId ? (
          <div className="space-y-5 pb-4">
            <GlassSurface variant="default" className="rounded-2xl p-6">
              <div className="flex flex-col items-center text-center">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full border text-2xl font-bold"
                  style={{
                    borderColor: OBSIDIAN_GOLD.base,
                    color: OBSIDIAN_GOLD.bright,
                    backgroundColor: "rgba(212, 175, 55, 0.08)",
                  }}
                  aria-hidden
                >
                  {profileInitial(avatarLabel)}
                </div>
                <h2 className="mt-4 text-xl font-semibold text-white">
                  {profileLoading && !displayUsername ? "Loading…" : headerTitle}
                </h2>
                {displayEmail ? (
                  <p className="mt-1 text-sm" style={{ color: MOBILE_COLORS.textMuted }}>
                    {displayEmail}
                  </p>
                ) : null}
                {joinedLabel ? (
                  <p className="mt-2 text-xs" style={{ color: MOBILE_COLORS.textMuted }}>
                    Joined {joinedLabel}
                  </p>
                ) : null}
              </div>
            </GlassSurface>

            <MobileRipSettingsToggle />

            <AccountLegalSection onOpen={openInfoPage} />

            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              disabled={isDeletingAccount}
              className={`${BTN_GHOST_OUTLINE} w-full border-red-500/30 text-red-300 disabled:opacity-40`}
            >
              Delete account
            </button>

            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={isDeletingAccount}
              className={`${BTN_GHOST_OUTLINE} w-full border-red-500/30 text-red-300 disabled:opacity-40`}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="space-y-5 pb-4">
            {guestCta}
            <AccountLegalSection onOpen={openInfoPage} />
          </div>
        )}
      </div>

      <DeleteAccountModal
        open={deleteModalOpen}
        loading={isDeletingAccount}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={() => void handleDeleteAccount()}
      />
    </div>
  );
}
