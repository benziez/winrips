import { useEffect, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { clearLoggedIn } from "../../constants/userSession";
import { AppleSignInButton } from "../auth/AppleSignInButton";
import { MobileRipSettingsToggle } from "./MobileRipSettingsToggle";
import { GlassSurface } from "./GlassSurface";
import { MOBILE_COLORS, OBSIDIAN_GOLD, BTN_GHOST_OUTLINE } from "./mobileTheme";
import { MOBILE_DOCK_CLEARANCE } from "./MobileFloatingDock";

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
    showCashoutToast,
    closeWalletModal,
    setPurchaseModalOpen,
    setDepositModalOpen,
  } = useApp();
  const { user, signOut } = useAuth();

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
      <header
        className="relative z-10 shrink-0 px-6 pb-4"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
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

            <button
              type="button"
              onClick={() => void handleSignOut()}
              className={`${BTN_GHOST_OUTLINE} w-full border-red-500/30 text-red-300`}
            >
              Sign out
            </button>
          </div>
        ) : (
          guestCta
        )}
      </div>
    </div>
  );
}
