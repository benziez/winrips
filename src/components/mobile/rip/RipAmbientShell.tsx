import type { ReactNode } from "react";

interface RipAmbientShellProps {
  children: ReactNode;
  scratch?: boolean;
  className?: string;
}

export function RipAmbientShell({ children, scratch = false, className = "" }: RipAmbientShellProps) {
  return (
    <div className={`relative flex h-full min-h-0 flex-col overflow-hidden rip-ambient-bg ${className}`}>
      {scratch ? (
        <div className="rip-ambient-scratch pointer-events-none absolute inset-0 z-0" aria-hidden />
      ) : null}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
