import type { ReactNode } from "react";

interface UtilityPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function UtilityPageShell({
  eyebrow,
  title,
  description,
  children,
}: UtilityPageShellProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-[1600px] mx-auto w-full">
      <header className="mb-6 max-w-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia mb-1">
          {eyebrow}
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{title}</h1>
        <p className="text-muted text-sm mt-2 leading-relaxed">{description}</p>
      </header>
      {children}
    </div>
  );
}
