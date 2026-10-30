const STEPS = [
  { key: "preflight", label: "Checking with the contract" },
  { key: "signing", label: "Confirm in MetaMask" },
  { key: "pending", label: "Waiting for block confirmation" },
  { key: "confirmed", label: "Confirmed on-chain" },
];

const ORDER = { preflight: 0, signing: 1, pending: 2, confirmed: 3 };

/** Floating panel that shows the progress of the current transaction. */
export default function TxStatus({ tx, onClose }) {
  if (tx.status === "idle") return null;

  const failed = tx.status === "failed";
  const done = tx.status === "confirmed";
  const current = ORDER[tx.status] ?? -1;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:right-6 sm:w-96">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Transaction</p>
            <p className="text-base font-bold text-slate-900">{tx.label}</p>
          </div>
          {(done || failed) && (
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
              ✕
            </button>
          )}
        </div>

        <ol className="mt-4 space-y-2.5">
          {STEPS.map((step, i) => {
            const state = failed && i >= current ? "idle" : i < current || done ? "done" : i === current ? "active" : "idle";
            return (
              <li key={step.key} className="flex items-center gap-3 text-sm">
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    state === "done"
                      ? "bg-emerald-500 text-white"
                      : state === "active"
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {state === "done" ? "✓" : state === "active" ? <Spinner /> : i + 1}
                </span>
                <span className={state === "idle" ? "text-slate-400" : "font-medium text-slate-800"}>{step.label}</span>
              </li>
            );
          })}
        </ol>

        {failed && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{tx.error}</p>}

        {tx.hash && (
          <p className="mt-4 break-all rounded-lg bg-slate-50 p-2 font-mono text-[11px] text-slate-500">
            tx: {tx.hash}
            {tx.blockNumber != null && <span className="block">block #{tx.blockNumber}</span>}
          </p>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />;
}
