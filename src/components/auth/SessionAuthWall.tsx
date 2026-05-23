import { useApp } from "../../context/AppContext";

interface SessionAuthWallProps {
  title?: string;
  description: string;
}

export function SessionAuthWall({
  title = "Access Denied",
  description,
}: SessionAuthWallProps) {
  const { openAuthModal } = useApp();

  return (
    <div className="mt-6 rounded-xl border border-[#2A2D34] bg-[#121318] px-6 py-16 text-center">
      <p className="text-base font-bold uppercase tracking-wider text-white">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#A0A5B5]">
        {description}
      </p>
      <div className="mx-auto mt-6 flex max-w-xs flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => openAuthModal("login")}
          className="flex-1 rounded-md border border-[#2A2D34] bg-[#1A1C20] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:border-fuchsia/40"
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => openAuthModal("signup")}
          className="rounded-md bg-[#ff007a] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:brightness-110 sm:flex-1"
        >
          Register
        </button>
      </div>
    </div>
  );
}
