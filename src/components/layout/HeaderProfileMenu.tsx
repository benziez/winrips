import { useEffect, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { clearLoggedIn } from "../../constants/userSession";
import { ChevronDown, UserCircleIcon } from "../icons/AppIcons";

function UserIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-muted"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 6-6 8-6s6.5 2 8 6" />
    </svg>
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

interface HeaderProfileMenuProps {
  /** Icon-only trigger for mobile shell header. */
  compact?: boolean;
}

export function HeaderProfileMenu({ compact = false }: HeaderProfileMenuProps) {
  const {
    userId,
    profileUsername,
    profileLoading,
    syncUserProfileFromServer,
    logout,
    closeWalletModal,
    setPurchaseModalOpen,
    setDepositModalOpen,
  } = useApp();
  const { user, signOut } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const metadataUsername = readAuthMetadataUsername(user?.user_metadata);
  const displayLabel = profileUsername || metadataUsername || "Profile";

  useEffect(() => {
    if (!userId) return;
    void syncUserProfileFromServer(userId);
  }, [userId, syncUserProfileFromServer]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    setMenuOpen(false);
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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className={
          compact
            ? `flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-slate text-muted transition-colors hover:border-fuchsia/40 hover:text-fuchsia ${menuOpen ? "border-fuchsia/50 text-fuchsia shadow-[0_0_12px_rgba(255,0,127,0.2)]" : ""}`
            : "flex h-9 max-w-[9.5rem] shrink-0 items-center justify-center gap-1 rounded-md border border-border bg-slate text-white transition-colors duration-200 hover:border-fuchsia/40 hover:bg-slate-elevated sm:max-w-[11rem] md:h-auto md:w-auto md:gap-1.5 md:px-4 md:py-2 md:text-xs md:font-bold md:uppercase md:tracking-wider"
        }
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <span className="shrink-0" aria-hidden>
          {compact ? (
            <UserCircleIcon size={18} className="text-current" />
          ) : (
            <UserIcon size={18} />
          )}
        </span>
        {!compact ? (
          <>
            <span className="min-w-0 truncate text-[11px] font-semibold normal-case tracking-normal sm:text-xs md:max-w-[8rem]">
              {profileLoading && !profileUsername && !metadataUsername
                ? "Profile"
                : displayLabel}
            </span>
            <ChevronDown
              size={14}
              className={`shrink-0 text-muted transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
            />
          </>
        ) : null}
      </button>

      {menuOpen ? (
        <div
          role="menu"
          className={`absolute right-0 z-[60] mt-2 w-52 rounded-md border py-2 shadow-xl ${
            compact
              ? "border-border bg-slate"
              : "border-[#213743] bg-[#1a2c38]"
          }`}
        >
          <div
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400"
            role="presentation"
          >
            <UserIcon />
            <span className="min-w-0 truncate text-xs font-semibold text-white" title={displayLabel}>
              {profileLoading && !profileUsername && !metadataUsername
                ? "Profile"
                : displayLabel}
            </span>
          </div>

          <div className="my-1 border-t border-[#213743]" aria-hidden />

          <button
            type="button"
            role="menuitem"
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-400 transition-all hover:bg-[#0f212e] hover:text-white"
          >
            Sign Out
          </button>
        </div>
      ) : null}
    </div>
  );
}
