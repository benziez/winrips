import { useCallback, useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { formatGems, formatUsd, gemsToUsd } from "../../constants/retail";
import { isAppStoreCommerce } from "../../constants/commerce";
import { fetchPlayHistory, type PlayHistoryRow } from "../../lib/playHistory";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { CollectibleImage } from "../ui/CollectibleImage";
import { ShieldIcon } from "../icons/AppIcons";
import { FairnessVerifyModal } from "../pack-opening/FairnessVerifyModal";
import {
  buildHistoryAuditSession,
  type FairnessSession,
} from "../../utils/provablyFair";

function formatPlayedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRollPercent(rolledNumber: number): string {
  return `${rolledNumber.toFixed(3)}%`;
}

function formatHistoryAmount(gemAmount: number): string {
  return isAppStoreCommerce()
    ? formatUsd(gemsToUsd(gemAmount))
    : formatGems(gemAmount);
}

interface PlayHistoryTableProps {
  className?: string;
  /** Hide outer section chrome when embedded in vault hub */
  embedded?: boolean;
}

export function PlayHistoryTable({ className = "", embedded = false }: PlayHistoryTableProps) {
  const { userId, isLoggedIn, navigateToView } = useApp();
  const { authLoading, isAuthenticated } = useAuth();
  const [entries, setEntries] = useState<PlayHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditSession, setAuditSession] = useState<FairnessSession | null>(null);
  const [auditPackLabel, setAuditPackLabel] = useState("");
  const [auditLoadingId, setAuditLoadingId] = useState<string | null>(null);

  const canLoad =
    isSupabaseConfigured() &&
    !authLoading &&
    isAuthenticated &&
    isLoggedIn &&
    Boolean(userId);

  const loadHistory = useCallback(async () => {
    if (!canLoad || !userId) {
      setEntries([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rows = await fetchPlayHistory(userId, 80);
      setEntries(rows);
    } catch {
      setError("Unable to load play history.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [canLoad, userId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const onRecorded = () => {
      void loadHistory();
    };
    window.addEventListener("winrips:play-history-updated", onRecorded);
    return () => window.removeEventListener("winrips:play-history-updated", onRecorded);
  }, [loadHistory]);

  const openHistoryAudit = useCallback(async (entry: PlayHistoryRow) => {
    setAuditLoadingId(entry.id);
    try {
      const session = await buildHistoryAuditSession({
        packName: entry.pack_name,
        entryId: entry.id,
        rolledNumber: entry.rolled_number,
      });
      setAuditPackLabel(entry.pack_name);
      setAuditSession(session);
    } finally {
      setAuditLoadingId(null);
    }
  }, []);

  const body = (() => {
    if (!isSupabaseConfigured()) {
      return (
        <p className="py-10 text-center text-sm text-muted">
          Play history requires Supabase configuration.
        </p>
      );
    }
    if (authLoading || loading) {
      return <p className="py-10 text-center text-sm text-muted">Loading play history…</p>;
    }
    if (!canLoad) {
      return (
        <p className="py-10 text-center text-sm text-muted">Sign in to view your spin history.</p>
      );
    }
    if (error) {
      return <p className="py-10 text-center text-sm text-red-400/90">{error}</p>;
    }
    if (entries.length === 0) {
      return (
        <p className="py-10 text-center text-sm text-muted">
          No spins recorded yet. Open a box to start your history.
        </p>
      );
    }

    return (
      <>
        <div className="hidden max-h-[min(480px,58vh)] overflow-y-auto md:block">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 border-b border-border bg-transparent backdrop-blur-sm">
              <tr className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                <th className="px-3 py-2.5 sm:px-4">Pack Name</th>
                <th className="px-3 py-2.5">Cost</th>
                <th className="px-3 py-2.5">Item Pulled</th>
                <th className="px-3 py-2.5">Value</th>
                <th className="px-3 py-2.5">Roll %</th>
                <th className="px-3 py-2.5">Fairness</th>
                <th className="px-3 py-2.5 sm:px-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border/50 transition-colors hover:bg-slate-elevated/30"
                >
                  <td className="px-3 py-3 sm:px-4">
                    <span className="line-clamp-1 text-sm font-semibold text-white">
                      {entry.pack_name}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm tabular-nums text-muted">
                    {formatHistoryAmount(entry.spin_cost)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex min-w-0 flex-nowrap items-center gap-2">
                      <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded border border-border/60 bg-slate-elevated/40">
                        <CollectibleImage
                          src={entry.won_item_image}
                          alt={entry.won_item_name}
                          className="h-full w-full object-contain p-0.5"
                          frameClassName="bg-transparent"
                        />
                      </div>
                      <span className="line-clamp-2 text-sm font-semibold text-white">
                        {entry.won_item_name}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm font-bold tabular-nums text-gold">
                    {formatHistoryAmount(entry.won_item_value)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-sm tabular-nums text-muted">
                    {formatRollPercent(entry.rolled_number)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <button
                      type="button"
                      onClick={() => void openHistoryAudit(entry)}
                      disabled={auditLoadingId === entry.id}
                      className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 transition-colors hover:border-emerald-400/40 hover:text-emerald-300 disabled:opacity-50"
                      aria-label={`View fairness proof for ${entry.pack_name}`}
                    >
                      <ShieldIcon size={12} />
                      Verify
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm text-muted sm:px-4">
                    {formatPlayedAt(entry.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="max-h-[min(480px,58vh)] space-y-3 overflow-y-auto md:hidden">
          {entries.map((entry) => (
            <li key={entry.id} className="vault-door flex overflow-hidden">
              <div className="relative w-[4.5rem] shrink-0 bg-slate-elevated/40 p-1.5">
                <CollectibleImage
                  src={entry.won_item_image}
                  alt={entry.won_item_name}
                  className="h-full w-full object-contain"
                  frameClassName="bg-transparent"
                />
              </div>
              <div className="min-w-0 flex-1 border-l border-border bg-slate px-2.5 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted">
                  {entry.pack_name}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs font-bold leading-snug text-white">
                  {entry.won_item_name}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] tabular-nums">
                  <span className="text-muted">{formatHistoryAmount(entry.spin_cost)}</span>
                  <span className="font-bold text-gold">{formatHistoryAmount(entry.won_item_value)}</span>
                  <span className="font-mono text-muted">
                    {formatRollPercent(entry.rolled_number)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void openHistoryAudit(entry)}
                    disabled={auditLoadingId === entry.id}
                    className="inline-flex items-center gap-1 font-bold uppercase tracking-wider text-emerald-400/90 hover:text-emerald-300 disabled:opacity-50"
                  >
                    <ShieldIcon size={11} />
                    Verify
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-muted">{formatPlayedAt(entry.created_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      </>
    );
  })();

  const auditModal =
    auditSession != null ? (
      <FairnessVerifyModal
        session={auditSession}
        packLabel={auditPackLabel}
        onClose={() => setAuditSession(null)}
        onVerify={() => {
          setAuditSession(null);
          navigateToView("fairness");
        }}
      />
    ) : null;

  if (embedded) {
    return (
      <div className={`bg-transparent ${className}`.trim()}>
        {body}
        {auditModal}
      </div>
    );
  }

  return (
    <section
      className={`bg-transparent ${className}`.trim()}
      aria-labelledby="play-history-table-heading"
    >
      <header className="mb-4 flex flex-nowrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="play-history-table-heading"
            className="text-sm font-bold uppercase tracking-[0.12em] text-white"
          >
            Play History
          </h2>
          <p className="mt-0.5 text-xs text-muted">Box spins logged to your account · newest first</p>
        </div>
        <button
          type="button"
          onClick={() => void loadHistory()}
          disabled={!canLoad || loading}
          className="shrink-0 rounded-md border border-border bg-slate-elevated/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted transition-colors hover:border-fuchsia/40 hover:text-white disabled:opacity-40"
        >
          Refresh
        </button>
      </header>
      {body}
      {auditModal}
    </section>
  );
}
