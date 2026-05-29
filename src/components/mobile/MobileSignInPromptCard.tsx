import { useApp } from "../../context/AppContext";
import { hapticTabSelect } from "../../utils/mobileHaptics";

interface MobileSignInPromptCardProps {
  message: string;
  className?: string;
}

export function MobileSignInPromptCard({ message, className = "" }: MobileSignInPromptCardProps) {
  const { openAuthModal } = useApp();

  return (
    <div
      className={`mx-6 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 ${className}`}
    >
      <p className="text-[14px] font-medium leading-snug text-white">{message}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            void hapticTabSelect();
            openAuthModal("login");
          }}
          className="flex-1 rounded-full bg-[#FF007F] py-2 text-[13px] font-bold text-white"
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            void hapticTabSelect();
            openAuthModal("signup");
          }}
          className="flex-1 rounded-full border border-white/15 py-2 text-[13px] font-semibold text-white"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}
