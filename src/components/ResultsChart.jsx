import { accentFor } from "./CandidateCard.jsx";
import { percent } from "../utils/format.js";

/** Ranked horizontal bar chart of vote counts and percentages. */
export default function ResultsChart({ candidates, totalVotes, leaders }) {
  const ranked = [...candidates].sort((a, b) => b.voteCount - a.voteCount || a.id - b.id);

  if (ranked.length === 0) {
    return <p className="rounded-2xl bg-white p-6 text-center text-slate-500">No candidates registered yet.</p>;
  }

  return (
    <ol className="space-y-3">
      {ranked.map((c, index) => {
        const pct = percent(c.voteCount, totalVotes);
        const leading = leaders.includes(c.id);
        return (
          <li key={c.id} className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${leading ? "border-amber-300" : "border-slate-200"}`}>
            <div className="flex items-center gap-3">
              <span className="w-6 text-center text-sm font-bold text-slate-400">{index + 1}</span>
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-xl ${accentFor(c.id)}`}>{c.symbol}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {c.name} {leading && <span title="Leading">👑</span>}
                </p>
                <p className="truncate text-xs text-slate-500">{c.party}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">{pct.toFixed(1)}%</p>
                <p className="text-xs text-slate-500">
                  {c.voteCount} vote{c.voteCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div
              className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${c.name} vote share`}
            >
              <div className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${accentFor(c.id)}`} style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
