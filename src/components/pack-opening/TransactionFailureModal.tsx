interface TransactionFailureModalProps {
  onClose: () => void;
}

export function TransactionFailureModal({ onClose }: TransactionFailureModalProps) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-failure-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-rose-500/40 bg-slate p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="transaction-failure-title" className="text-base font-bold uppercase text-white">
          Transaction Failed - Credits Refunded
        </h2>
        <p className="mt-2 text-sm text-muted">
          Your opening did not complete successfully. No permanent charge was applied for the failed
          request.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg bg-[#FF007F] px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
