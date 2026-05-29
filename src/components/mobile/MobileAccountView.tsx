import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { deleteAccount } from "../../lib/deleteAccountApi";
import { clearLoggedIn } from "../../constants/userSession";
import { fetchPlayHistory } from "../../lib/playHistory";
import { AppleSignInButton } from "../auth/AppleSignInButton";
import { formatUsd, gemsToUsd } from "../../constants/retail";
import { generatedHandleFromUserId } from "../../utils/generatedHandle";
import { MOBILE_DOCK_CLEARANCE } from "./MobileFloatingDock";
import { RipAmbientShell } from "./rip/RipAmbientShell";
import { BalancePill } from "./rip/BalancePill";
import { AddFundsModal } from "./rip/AddFundsModal";
import { WithdrawModal } from "./wallet/WithdrawModal";
import { SettingsIcon, TrophyIcon, PacksIcon, ArrowRightIcon } from "../icons/AppIcons";
import { hapticTabSelect } from "../../utils/mobileHaptics";
import { isFastModeEnabled, setFastModeEnabled } from "../../lib/mobileRipPreferences";
import { GlassSurface } from "./GlassSurface";
import { BTN_GHOST_OUTLINE, BTN_PRIMARY, MOBILE_COLORS } from "./mobileTheme";

const DELETE_CONFIRM_WORD = "DELETE";

function formatJoinedLabel(createdAt: string | undefined): string | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return `Joined ${date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
}

function profileInitial(label: string): string {
  const char = label.trim().charAt(0);
  return char ? char.toUpperCase() : "?";
}

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
    if (!open) setTyped("");
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
            className="fixed inset-x-6 z-[81] mx-auto max-w-md"
            style={{ top: "max(4rem, calc(env(safe-area-inset-top) + 2rem))" }}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
          >
            <GlassSurface variant="default" className="rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white">Delete account?</h2>
              <p className="mt-3 text-sm" style={{ color: MOBILE_COLORS.textMuted }}>
                This is permanent. Type {DELETE_CONFIRM_WORD} to confirm.
              </p>
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                disabled={loading}
                className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
                placeholder={DELETE_CONFIRM_WORD}
              />
              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={!canConfirm}
                  className={`${BTN_PRIMARY} disabled:opacity-40`}
                >
                  {loading ? "Deleting…" : "Delete account"}
                </button>
                <button type="button" onClick={onCancel} disabled={loading} className={BTN_GHOST_OUTLINE}>
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

export function MobileAccountView() {
  const {
    isLoggedIn,
    userId,
    profileUsername,
    profileLoading,
    vaultItems,
    syncUserProfileFromServer,
    navigateToView,
    logout,
    openAuthModal,
    showCashoutToast,
    showErrorToast,
    closeWalletModal,
    setPurchaseModalOpen,
    setDepositModalOpen,
    withdrawableBalance,
  } = useApp();
  const { user, session, signOut } = useAuth();

  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [packsOpened, setPacksOpened] = useState(0);
  const [fastMode, setFastMode] = useState(false);

  useEffect(() => {
    setFastMode(isFastModeEnabled());
  }, []);

  const displayUsername =
    profileUsername?.trim() ||
    (typeof user?.user_metadata?.username === "string" ? user.user_metadata.username.trim() : "") ||
    (userId ? generatedHandleFromUserId(userId) : "Guest");

  const joinedLabel = formatJoinedLabel(user?.created_at);

  const biggestPullUsd = useMemo(() => {
    if (vaultItems.length === 0) return 0;
    return Math.max(...vaultItems.map((c) => gemsToUsd(c.value)));
  }, [vaultItems]);

  useEffect(() => {
    if (!userId) return;
    void syncUserProfileFromServer(userId);
  }, [userId, syncUserProfileFromServer]);

  useEffect(() => {
    if (!userId) {
      setPacksOpened(0);
      return;
    }
    void fetchPlayHistory(userId, 500).then((rows) => setPacksOpened(rows.length));
  }, [userId]);

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
        try {
          await signOut();
        } finally {
          clearLoggedIn();
          logout();
        }
        showCashoutToast("Your account has been deleted.");
        return;
      }
      showCashoutToast(result.error || "Account could not be deleted.");
    } finally {
      setIsDeletingAccount(false);
    }
  }

  function handleAvatarEdit() {
    showErrorToast("Profile photo upload coming soon.");
  }

  if (!isLoggedIn) {
    return (
      <RipAmbientShell>
        <div
          className="flex flex-1 flex-col items-center justify-center px-6"
          style={{ paddingBottom: MOBILE_DOCK_CLEARANCE }}
        >
          <h1 className="text-3xl font-bold text-white">Account</h1>
          <p className="mt-3 text-center text-[15px] text-[var(--rip-text-muted)]">
            Sign in to save pulls, track stats, and cash out.
          </p>
          <div className="mt-8 w-full max-w-sm">
            <AppleSignInButton />
          </div>
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="mt-4 text-[15px] font-medium text-[var(--rip-green-bright)]"
          >
            Sign in with email
          </button>
        </div>
      </RipAmbientShell>
    );
  }

  return (
    <RipAmbientShell>
      <header
        className="flex shrink-0 items-center justify-between px-6 pb-3"
        style={{ paddingTop: "calc(max(0.5rem, env(safe-area-inset-top)) + 0.5rem)" }}
      >
        <button
          type="button"
          onClick={() => {
            void hapticTabSelect();
            navigateToView("settings");
          }}
          className="flex items-center gap-2 text-[17px] font-medium text-white"
        >
          <SettingsIcon size={20} />
          Settings
        </button>
        <BalancePill onAddFunds={() => setAddFundsOpen(true)} />
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: MOBILE_DOCK_CLEARANCE }}
      >
        <div className="mt-6 flex flex-col items-center px-6">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[var(--rip-bg-ambient-from)] to-[var(--rip-bg-elevated)] text-3xl font-bold text-white">
              {profileLoading ? "…" : profileInitial(displayUsername)}
            </div>
            <button
              type="button"
              onClick={handleAvatarEdit}
              className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--rip-border)] bg-[var(--rip-surface)] text-sm text-white"
              aria-label="Edit profile photo"
            >
              ✎
            </button>
          </div>
          <h2 className="mt-4 text-center text-xl font-semibold text-white">{displayUsername}</h2>
          {joinedLabel ? (
            <p className="mt-1 text-[15px] text-[var(--rip-text-muted)]">{joinedLabel}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => {
            void hapticTabSelect();
            setWithdrawOpen(true);
          }}
          className="mx-4 mt-8 flex w-[calc(100%-2rem)] items-center justify-between rounded-2xl bg-[var(--rip-surface)] p-4 text-left"
        >
          <div>
            <p className="text-[20px] font-bold text-[var(--rip-green-bright)]">Withdraw</p>
            <p className="mt-1 text-[15px] text-[var(--rip-text-muted)]">
              {formatUsd(gemsToUsd(withdrawableBalance))} withdrawable from sales
            </p>
          </div>
          <ArrowRightIcon size={24} className="text-white" />
        </button>

        <div className="mx-4 mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[var(--rip-surface)] p-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--rip-surface-strong)]">
              <TrophyIcon size={24} className="text-[var(--rip-orange)]" />
            </div>
            <p className="mt-3 text-xl font-bold text-white">{formatUsd(biggestPullUsd)}</p>
            <p className="mt-1 text-[15px] text-[var(--rip-text-muted)]">Biggest Pull</p>
          </div>
          <div className="rounded-2xl bg-[var(--rip-surface)] p-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--rip-surface-strong)]">
              <PacksIcon size={24} className="text-[var(--rip-green)]" />
            </div>
            <p className="mt-3 text-xl font-bold text-white">{packsOpened}</p>
            <p className="mt-1 text-[15px] text-[var(--rip-text-muted)]">Packs Opened</p>
          </div>
        </div>

        <div className="mx-4 mt-8">
          <p className="px-1 pb-2 text-[13px] font-semibold uppercase tracking-wider text-[var(--rip-text-muted)]">
            Preferences
          </p>
          <div className="flex items-center justify-between rounded-2xl bg-[var(--rip-surface)] p-4">
            <div className="pr-3">
              <p className="text-[16px] font-semibold text-white">Fast Mode</p>
              <p className="mt-1 text-[14px] text-[var(--rip-text-muted)]">
                Speeds up pack spins. The reveal still plays in full.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={fastMode}
              aria-label="Fast Mode"
              onClick={() => {
                void hapticTabSelect();
                setFastMode((prev) => {
                  const next = !prev;
                  setFastModeEnabled(next);
                  return next;
                });
              }}
              className="relative h-8 w-14 shrink-0 rounded-full border border-white/10 transition-colors"
              style={{
                backgroundColor: fastMode ? "var(--rip-orange)" : "rgba(255,255,255,0.08)",
              }}
            >
              <span
                className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform ${
                  fastMode ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mx-4 mt-8 flex flex-col gap-3 pb-6">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className={BTN_GHOST_OUTLINE}
          >
            Sign out
          </button>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="text-center text-sm text-red-400/90"
          >
            Delete account
          </button>
        </div>
      </div>

      <AddFundsModal open={addFundsOpen} onClose={() => setAddFundsOpen(false)} />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
      <DeleteAccountModal
        open={deleteModalOpen}
        loading={isDeletingAccount}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={() => void handleDeleteAccount()}
      />
    </RipAmbientShell>
  );
}
