import { FormEvent, useEffect, useState } from "react";
import { WinRipsLogo } from "../components/brand/WinRipsLogo";
import { SpinMatrixBackground } from "../components/waitlist/SpinMatrixBackground";
import { useApp } from "../context/AppContext";
import { VIP_ACCESS_PASSWORD } from "../constants/waitlistAccess";

/** Public vault unlock target — countdown ticks toward this moment. */
const VAULT_LAUNCH_AT = new Date("2026-06-01T17:00:00Z").getTime();

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getCountdownParts(targetMs: number): CountdownParts {
  const diff = Math.max(0, targetMs - Date.now());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds };
}

function padCount(value: number): string {
  return String(value).padStart(2, "0");
}

function CountdownTrack({ targetMs }: { targetMs: number }) {
  const [parts, setParts] = useState<CountdownParts>(() => getCountdownParts(targetMs));

  useEffect(() => {
    const tick = () => setParts(getCountdownParts(targetMs));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  const segments: { label: string; value: string }[] = [
    { label: "Days", value: padCount(parts.days) },
    { label: "Hrs", value: padCount(parts.hours) },
    { label: "Mins", value: padCount(parts.minutes) },
    { label: "Secs", value: padCount(parts.seconds) },
  ];

  return (
    <div
      className="mb-5 flex items-center justify-center gap-1.5 sm:gap-2"
      role="timer"
      aria-live="polite"
      aria-label="Vault unlock countdown"
    >
      {segments.map((segment, index) => (
        <div key={segment.label} className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex flex-col items-center">
            <span className="rounded-md border border-[#22242B] bg-[#14161D] px-3 py-1.5 font-mono text-xs font-bold tracking-wider text-[#FF007F]">
              {segment.value}
            </span>
            <span className="mt-1 text-[9px] font-medium uppercase tracking-widest text-[#A0A5B5]/50">
              {segment.label}
            </span>
          </div>
          {index < segments.length - 1 && (
            <span className="mb-4 font-mono text-xs font-bold text-[#FF007F]/40" aria-hidden>
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function WaitlistView() {
  const { grantAppAccess } = useApp();

  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [vipOpen, setVipOpen] = useState(false);
  const [vipPassword, setVipPassword] = useState("");
  const [vipError, setVipError] = useState<string | null>(null);

  function handleWaitlistSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setIsSubmitted(true);
  }

  function handleVipSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (vipPassword === VIP_ACCESS_PASSWORD) {
      setVipError(null);
      grantAppAccess();
      return;
    }
    setVipError("Invalid access code. Please try again.");
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050505] p-4"
    >
      <SpinMatrixBackground />

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 bg-[#FF007F]/5 blur-[150px]"
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center bg-transparent px-2">
        <WinRipsLogo variant="hero" />
        <p className="mb-8 text-center text-[10px] font-semibold uppercase tracking-[0.4em] text-[#A0A5B5]/80 sm:text-xs">
          Premium TCG &amp; Sports Unboxing
        </p>

        <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[#22242B] bg-[#0D0E12]/80 p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 h-px bg-[#FF007F]" aria-hidden />

          <CountdownTrack targetMs={VAULT_LAUNCH_AT} />

          <h2 className="text-lg font-black uppercase tracking-[0.2em] text-white">
            Unlock the Vault
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#A0A5B5]/90">
            Our custom collections are dropping soon. Join the VIP waitlist to secure 500 free
            welcome Gems on launch day.
          </p>

          {isSubmitted ? (
            <p className="mt-6 rounded-lg border border-[#FF007F]/30 bg-[#FF007F]/5 px-4 py-4 text-sm font-medium leading-relaxed text-white">
              🎉 You&apos;re locked in! We&apos;ll drop a secure access link directly to your inbox.
            </p>
          ) : (
            <form className="mt-6 space-y-3" onSubmit={handleWaitlistSubmit}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                className="h-12 w-full rounded-lg border border-[#22242B] bg-[#090A0D] px-4 text-center text-sm text-white outline-none transition-all duration-300 placeholder:text-[#A0A5B5]/30 focus:border-[#FF007F] focus:shadow-[0_0_15px_rgba(255,0,127,0.15)]"
              />
              <button
                type="submit"
                className="h-12 w-full rounded-lg bg-[#FF007F] text-xs font-black uppercase tracking-[0.15em] text-white shadow-[0_4px_20px_rgba(255,0,127,0.3)] transition-all duration-300 hover:bg-[#FF007F]/90 active:scale-[0.98]"
              >
                Secure Early Access
              </button>
            </form>
          )}
        </div>

        <div className="relative z-10 mt-6 w-full max-w-md">
          {!vipOpen ? (
            <button
              type="button"
              onClick={() => {
                setVipOpen(true);
                setVipError(null);
              }}
              className="w-full text-xs tracking-wide text-[#A0A5B5]/30 transition-colors hover:text-[#FF007F]"
            >
              Have a VIP Access Code?
            </button>
          ) : (
            <form
              onSubmit={handleVipSubmit}
              className="rounded-xl border border-[#22242B]/80 bg-[#0D0E12]/50 p-4 backdrop-blur-sm"
            >
              <input
                type="password"
                value={vipPassword}
                onChange={(e) => {
                  setVipPassword(e.target.value);
                  setVipError(null);
                }}
                placeholder="Enter Developer Password"
                autoComplete="off"
                className="h-10 w-full rounded-lg border border-[#22242B] bg-[#090A0D] px-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-[#A0A5B5]/30 focus:border-[#FF007F] focus:shadow-[0_0_12px_rgba(255,0,127,0.12)]"
              />
              {vipError && (
                <p className="mt-2 text-[11px] text-red-400/90" role="alert">
                  {vipError}
                </p>
              )}
              <button
                type="submit"
                className="mt-2 h-9 w-full rounded-lg border border-[#FF007F]/30 text-[10px] font-bold uppercase tracking-wider text-[#FF007F] transition-colors hover:bg-[#FF007F]/10"
              >
                Enter Vault
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
