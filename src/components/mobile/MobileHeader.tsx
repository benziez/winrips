import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "../icons/AppIcons";
import { useApp } from "../../context/AppContext";
import { HeaderProfileMenu } from "../layout/HeaderProfileMenu";
import { formatGems } from "../../constants/retail";
import { BRAND_FUCHSIA } from "../../constants/theme";
import { WINRIPS_LOGO_SRC } from "../../constants/brandAssets";
import { resolveAssetUrl } from "../../utils/resolveAssetUrl";

export const MOBILE_HEADER_HEIGHT = "3rem";

function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
}

function MobileWalletBalance() {
  const { isLoggedIn, goldVolts, gemBalanceLoading, openWalletModal, openAuthModal } = useApp();

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={() => openAuthModal("login")}
        className="shrink-0 rounded-full border border-fuchsia/40 bg-fuchsia/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-fuchsia backdrop-blur-sm"
      >
        Sign In
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openWalletModal()}
      className="shrink-0 rounded-full border border-gold/35 bg-black/30 px-2 py-0.5 text-[11px] font-bold tabular-nums text-gold backdrop-blur-md"
      aria-label="Open wallet"
    >
      {gemBalanceLoading ? "…" : formatGems(goldVolts)}
    </button>
  );
}

function MobileHeaderActions() {
  const { isLoggedIn } = useApp();

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <MobileWalletBalance />
      {isLoggedIn ? <HeaderProfileMenu compact /> : null}
    </div>
  );
}

function headerTitleForPath(pathname: string): string | null {
  switch (normalizePath(pathname)) {
    case "/pack":
      return null;
    case "/vault":
      return "Vault";
    case "/leaderboard":
      return "Ranks";
    case "/rewards":
      return "Rewards";
    default:
      return null;
  }
}

export function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { goToLobby } = useApp();

  const pathname = normalizePath(location.pathname);
  const isRoot = pathname === "/";
  const title = headerTitleForPath(pathname);

  function handleBack() {
    navigate("/");
    goToLobby();
  }

  return (
    <header
      className="pointer-events-none fixed inset-x-0 top-0 z-50 bg-transparent"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="pointer-events-auto relative flex h-12 items-center justify-between gap-2 px-3">
        {isRoot ? (
          <button type="button" onClick={goToLobby} className="shrink-0" aria-label="WinRips home">
            <img
              src={resolveAssetUrl(WINRIPS_LOGO_SRC)}
              alt="WinRips"
              className="h-6 w-auto object-contain"
              style={{
                maxWidth: "96px",
                filter: `drop-shadow(0 0 8px color-mix(in srgb, ${BRAND_FUCHSIA} 30%, transparent))`,
              }}
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            className="flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 items-center justify-center rounded-full text-white/70 transition-colors active:text-fuchsia"
            aria-label="Go back"
          >
            <ChevronLeft size={22} className="shrink-0" />
          </button>
        )}

        {!isRoot && title ? (
          <span className="pointer-events-none absolute inset-x-0 flex h-12 items-center justify-center text-[10px] font-medium uppercase tracking-[0.22em] text-white/90">
            {title}
          </span>
        ) : null}

        <MobileHeaderActions />
      </div>
    </header>
  );
}
