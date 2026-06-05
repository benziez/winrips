import { memo, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { deleteAccount } from "../../lib/deleteAccountApi";
import { clearLoggedIn } from "../../constants/userSession";
import { fetchPlayHistory } from "../../lib/playHistory";
import { MobileSignInPromptCard } from "./MobileSignInPromptCard";
import { formatUsd, gemsToUsd } from "../../constants/retail";
import { generatedHandleFromUserId } from "../../utils/generatedHandle";
import { RipAmbientShell } from "./rip/RipAmbientShell";
import { BalancePill } from "./rip/BalancePill";
import { AddFundsModal } from "./rip/AddFundsModal";
import { WithdrawModal } from "./wallet/WithdrawModal";
import {
  AccountIcon,
  SettingsIcon,
  TrophyIcon,
  PacksIcon,
  GiftIcon,
  ArrowRightIcon,
} from "../icons/AppIcons";
import { REFERRAL_SIGNUP_BONUS_USD } from "../../utils/referralCode";
import { hapticTabSelect } from "../../utils/mobileHaptics";
import { isFastModeEnabled, setFastModeEnabled } from "../../lib/mobileRipPreferences";
import { GlassSurface } from "./GlassSurface";
import { pickAndUploadProfileAvatar } from "../../lib/profileAvatarUpload";
import { updateProfileUsername } from "../../lib/userProfile";
import { ObsidianImage } from "./ObsidianImage";
import { useFallbackImageSrc, IMAGE_PLACEHOLDER } from "../../hooks/useFallbackImageSrc";
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

function EditUsernameModal({
  open,
  initialUsername,
  loading,
  onCancel,
  onSave,
}: {
  open: boolean;
  initialUsername: string;
  loading: boolean;
  onCancel: () => void;
  onSave: (username: string) => void;
}) {
  const [draft, setDraft] = useState(initialUsername);

  useEffect(() => {
    if (open) setDraft(initialUsername);
  }, [open, initialUsername]);

  const trimmed = draft.trim();
  const canSave = trimmed.length > 0 && trimmed !== initialUsername.trim() && !loading;

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
            aria-labelledby="edit-username-title"
            className="fixed inset-x-6 z-[81] mx-auto max-w-md"
            style={{ top: "max(4rem, calc(env(safe-area-inset-top) + 2rem))" }}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
          >
            <GlassSurface variant="solid" className="rounded-2xl p-6">
              <h2 id="edit-username-title" className="text-lg font-semibold text-white">
                Edit username
              </h2>
              <p className="mt-2 text-sm" style={{ color: MOBILE_COLORS.textMuted }}>
                3–24 characters. Letters, numbers, and underscores only.
              </p>
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={loading}
                autoComplete="username"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                maxLength={24}
                className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
                placeholder="Username"
              />
              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => onSave(trimmed)}
                  disabled={!canSave}
                  className={`${BTN_PRIMARY} disabled:opacity-40`}
                >
                  {loading ? "Saving…" : "Save"}
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
            <GlassSurface variant="solid" className="rounded-2xl p-6">
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

export const MobileAccountView = memo(function MobileAccountView({
  isActive = true,
}: {
  isActive?: boolean;
}) {
  const {
    isLoggedIn,
    userId,
    profileUsername,
    profileAvatarUrl,
    profileLoading,
    setProfileAvatarUrl,
    setProfileUsername,
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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  const avatarRemoteSrc = profileAvatarUrl?.trim() || "";
  const { imgSrc: avatarImgSrc, onError: onAvatarError } = useFallbackImageSrc(
    avatarRemoteSrc,
    IMAGE_PLACEHOLDER,
  );

  useEffect(() => {
    setFastMode(isFastModeEnabled());
  }, []);

  const editableUsername =
    profileUsername?.trim() ||
    (typeof user?.user_metadata?.username === "string" ? user.user_metadata.username.trim() : "") ||
    "";

  const displayUsername = isLoggedIn
    ? editableUsername || (userId ? generatedHandleFromUserId(userId) : "Guest")
    : "Guest";

  const joinedLabel = isLoggedIn ? formatJoinedLabel(user?.created_at) : "—";

  const biggestPullUsd = useMemo(() => {
    if (!isLoggedIn || vaultItems.length === 0) return 0;
    return Math.max(...vaultItems.map((c) => gemsToUsd(c.value)));
  }, [isLoggedIn, vaultItems]);

  const packsOpenedCount = isLoggedIn ? packsOpened : 0;

  useEffect(() => {
    if (!isActive || !userId) return;
    void syncUserProfileFromServer(userId);
  }, [isActive, userId, syncUserProfileFromServer]);

  useEffect(() => {
    if (!isActive || !userId) {
      if (!userId) setPacksOpened(0);
      return;
    }
    void fetchPlayHistory(userId, 500).then((rows) => setPacksOpened(rows.length));
  }, [isActive, userId]);

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

  async function handleUsernameSave(nextUsername: string) {
    if (!isLoggedIn || !userId || isSavingUsername) return;

    setIsSavingUsername(true);
    try {
      const { username, error } = await updateProfileUsername(userId, nextUsername);
      if (error) {
        showErrorToast(error);
        return;
      }
      if (username) {
        setProfileUsername(username);
        setUsernameModalOpen(false);
        showCashoutToast("Username updated.");
      }
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Could not update username.";
      showErrorToast(message);
    } finally {
      setIsSavingUsername(false);
    }
  }

  async function handleAvatarEdit() {
    if (!isLoggedIn || !userId) {
      openAuthModal("login");
      return;
    }
    if (isUploadingAvatar) return;

    setIsUploadingAvatar(true);
    try {
      const { url, error } = await pickAndUploadProfileAvatar(userId);
      if (error) {
        showErrorToast(error);
        return;
      }
      if (url) {
        setProfileAvatarUrl(url);
        showCashoutToast("Profile photo updated.");
      }
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Profile photo upload failed.";
      showErrorToast(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  function handleWithdrawPress() {
    if (!isLoggedIn) {
      openAuthModal("login");
      return;
    }
    void hapticTabSelect();
    setWithdrawOpen(true);
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

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {!isLoggedIn ? (
            <MobileSignInPromptCard
              message="Sign in to save pulls, track stats, and cash out"
              className="mt-2"
            />
          ) : null}

          <div className="mt-6 flex flex-col items-center px-6">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--rip-bg-ambient-from)] to-[var(--rip-bg-elevated)] text-3xl font-bold text-white">
              {isLoggedIn && profileAvatarUrl ? (
                <ObsidianImage
                  imgSrc={avatarImgSrc}
                  fallbackSrc={IMAGE_PLACEHOLDER}
                  alt={displayUsername}
                  onError={onAvatarError}
                  imgClassName="h-full w-full object-cover"
                />
              ) : isLoggedIn ? (
                profileLoading || isUploadingAvatar ? "…" : profileInitial(displayUsername)
              ) : (
                <AccountIcon size={40} className="text-white/70" />
              )}
            </div>
            <button
              type="button"
              onClick={() => void handleAvatarEdit()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--rip-border)] bg-[var(--rip-surface)] text-sm text-white disabled:opacity-50"
              aria-label="Edit profile photo"
            >
              {isUploadingAvatar ? "…" : "✎"}
            </button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <h2 className="text-center text-xl font-semibold text-white">{displayUsername}</h2>
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => setUsernameModalOpen(true)}
                disabled={isSavingUsername}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--rip-border)] bg-[var(--rip-surface)] text-sm text-white disabled:opacity-50"
                aria-label="Edit username"
              >
                {isSavingUsername ? "…" : "✎"}
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-[15px] text-[var(--rip-text-muted)]">{joinedLabel}</p>
        </div>

        <button
          type="button"
          onClick={handleWithdrawPress}
          className="mx-4 mt-8 flex w-[calc(100%-2rem)] items-center justify-between rounded-2xl bg-[var(--rip-surface)] p-4 text-left"
        >
          <div>
            <p className="text-[20px] font-bold text-[var(--rip-green-bright)]">Withdraw</p>
            <p className="mt-1 text-[15px] text-[var(--rip-text-muted)]">
              {isLoggedIn
                ? `${formatUsd(gemsToUsd(withdrawableBalance))} withdrawable from sales`
                : "$0 withdrawable from sales"}
            </p>
          </div>
          <ArrowRightIcon size={24} className="text-white" />
        </button>

        <button
          type="button"
          onClick={() => {
            void hapticTabSelect();
            navigateToView("refer");
          }}
          className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center justify-between rounded-2xl bg-[var(--rip-surface)] p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--rip-surface-strong)]">
              <GiftIcon size={22} className="text-[var(--rip-green-bright)]" />
            </div>
            <div>
              <p className="text-[20px] font-bold text-white">Refer Friends</p>
              <p className="mt-1 text-[15px] text-[var(--rip-text-muted)]">
                Give ${REFERRAL_SIGNUP_BONUS_USD}, get ${REFERRAL_SIGNUP_BONUS_USD} when friends join
              </p>
            </div>
          </div>
          <ArrowRightIcon size={24} className="shrink-0 text-white" />
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
            <p className="mt-3 text-xl font-bold text-white">{packsOpenedCount}</p>
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
        </div>

        {isLoggedIn ? (
          <div className="shrink-0 px-4 pb-4 pt-3">
            <div className="flex flex-col gap-3">
              <button type="button" onClick={() => void handleSignOut()} className={BTN_GHOST_OUTLINE}>
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
        ) : null}
      </div>

      <AddFundsModal open={addFundsOpen} onClose={() => setAddFundsOpen(false)} />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
      <EditUsernameModal
        open={usernameModalOpen}
        initialUsername={editableUsername}
        loading={isSavingUsername}
        onCancel={() => setUsernameModalOpen(false)}
        onSave={(username) => void handleUsernameSave(username)}
      />
      <DeleteAccountModal
        open={deleteModalOpen}
        loading={isDeletingAccount}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={() => void handleDeleteAccount()}
      />
    </RipAmbientShell>
  );
});
