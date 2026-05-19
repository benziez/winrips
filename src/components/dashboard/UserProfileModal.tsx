import { useEffect } from "react";
import { formatGems } from "../../constants/retail";
import { getUserProfile } from "../../data/userProfiles";
import { RarityBadge } from "../ui/RarityBadge";
import { CollectibleImage } from "../ui/CollectibleImage";

interface UserProfileModalProps {
  username: string;
  onClose: () => void;
}

function PrivateVaultMessage() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-metallic/50 py-12 px-6 text-center">
      <svg
        className="w-12 h-12 text-muted/50 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <p className="text-sm text-muted max-w-xs leading-relaxed">
        This collector&apos;s vault is set to private.
      </p>
    </div>
  );
}

export function UserProfileModal({ username, onClose }: UserProfileModalProps) {
  const profile = getUserProfile(username);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="profile-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-username"
      onClick={onClose}
    >
      <div
        className="profile-modal-panel relative w-full max-w-lg rounded-2xl border border-border bg-[#121318] shadow-[0_0_40px_rgba(255,0,127,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-metallic hover:text-white transition-colors"
          aria-label="Close profile"
        >
          ×
        </button>

        <header className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-metallic text-3xl">
              {profile.avatar}
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <h2 id="profile-username" className="text-lg font-bold text-white truncate">
                {profile.username}
              </h2>
              <span className="inline-flex mt-1 rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
                {profile.tier}
              </span>
              <p className="text-xs text-muted mt-1.5">
                Joined <span className="text-white/80">{profile.joinedDate}</span>
              </p>
              <span
                className={`inline-flex mt-2 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  profile.vaultPublic
                    ? "bg-[#00e701]/10 text-[#00e701] border border-[#00e701]/30"
                    : "bg-muted/10 text-muted border border-border"
                }`}
              >
                {profile.vaultPublic ? "Public Vault" : "Private Vault"}
              </span>
            </div>
          </div>
        </header>

        <div className="px-5 sm:px-6 py-5">
          {profile.vaultPublic ? (
            <section>
              <h3 className="text-sm font-bold text-white mb-3">🏆 Top Vault Pulls</h3>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {profile.topPulls.map((card) => (
                  <article
                    key={card.id}
                    className={`rounded-xl border-2 bg-metallic overflow-hidden flex flex-col ${
                      card.rarity === "Ancient Rare"
                        ? "border-gold shadow-[0_0_12px_rgba(255,215,0,0.2)]"
                        : card.rarity === "Rare"
                          ? "border-fuchsia/60"
                          : "border-border"
                    }`}
                  >
                    <div className="flex h-16 items-center justify-center border-b border-border bg-[#0A0A0C] p-1.5 sm:h-20">
                      <CollectibleImage
                        src={card.image}
                        alt={card.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="p-2 flex flex-col gap-1 min-w-0">
                      <p className="text-[10px] sm:text-xs font-bold text-white leading-tight line-clamp-2">
                        {card.name}
                      </p>
                      <p className="text-xs font-bold text-gold tabular-nums font-mono">
                        {formatGems(card.value)}
                      </p>
                      <RarityBadge rarity={card.rarity} />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <PrivateVaultMessage />
          )}
        </div>
      </div>
    </div>
  );
}
