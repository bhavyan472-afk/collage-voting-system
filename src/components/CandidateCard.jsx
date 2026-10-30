const ACCENTS = [
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-indigo-500",
  "from-amber-400 to-orange-500",
  "from-fuchsia-400 to-violet-500",
  "from-rose-400 to-pink-500",
];

export function accentFor(id) {
  return ACCENTS[id % ACCENTS.length];
}

/**
 * Candidate card. When `onSelect` is provided the card shows a vote button;
 * `disabledReason` explains why voting is unavailable.
 */
export default function CandidateCard({ candidate, totalVotes, selected, onSelect, disabledReason, showVotes = true }) {
  const share = totalVotes ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) : "0.0";

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        selected ? "border-brand-500 ring-2 ring-brand-500" : "border-slate-200"
      }`}
    >
      <div className={`h-2 bg-gradient-to-r ${accentFor(candidate.id)}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-4">
          <div
            className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-3xl shadow-inner ${accentFor(candidate.id)}`}
            aria-label={`Symbol: ${candidate.symbol}`}
          >
            <span className="drop-shadow">{candidate.symbol}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Candidate #{candidate.id + 1}</p>
            <h3 className="truncate text-lg font-bold text-slate-900">{candidate.name}</h3>
            <p className="truncate text-sm font-medium text-brand-600">{candidate.party}</p>
          </div>
        </div>

        <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">{candidate.description || "No manifesto provided."}</p>

        {showVotes && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-500">Votes</span>
            <span className="font-semibold text-slate-900">
              {candidate.voteCount} <span className="font-normal text-slate-400">({share}%)</span>
            </span>
          </div>
        )}

        {onSelect && (
          <button
            type="button"
            onClick={() => onSelect(candidate)}
            disabled={Boolean(disabledReason)}
            title={disabledReason || `Vote for ${candidate.name}`}
            className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {disabledReason ? disabledReason : selected ? "Selected ✓" : `Vote for ${candidate.name.split(" ")[0]}`}
          </button>
        )}
      </div>
    </article>
  );
}
