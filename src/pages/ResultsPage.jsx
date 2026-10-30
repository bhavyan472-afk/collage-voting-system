import ResultsChart from "../components/ResultsChart.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { ElectionState } from "../utils/contract.js";
import { formatPercent } from "../utils/format.js";

export default function ResultsPage({ election }) {
  const { info, candidates, leaders, refresh } = election;
  if (!info) return null;

  const leaderCandidates = candidates.filter((c) => leaders.includes(c.id));
  const ended = info.state === ElectionState.Ended;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <StatusBadge state={info.state} />
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{ended ? "Final results" : "Live results"}</h1>
          <p className="text-sm text-slate-500">
            {info.name} · read directly from the smart contract{ended ? "" : " · updates automatically every 5 seconds"}
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-brand-500 sm:self-auto"
        >
          ↻ Refresh
        </button>
      </header>

      <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-violet-600 p-6 text-white shadow-lg sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200">{ended ? "🏆 Winner" : "📈 Currently leading"}</p>
        {leaderCandidates.length === 0 ? (
          <p className="mt-2 text-2xl font-bold">No votes have been cast yet</p>
        ) : leaderCandidates.length === 1 ? (
          <div className="mt-3 flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 text-4xl">{leaderCandidates[0].symbol}</span>
            <div>
              <p className="text-2xl font-extrabold">{leaderCandidates[0].name}</p>
              <p className="text-indigo-100">
                {leaderCandidates[0].party} · {leaderCandidates[0].voteCount} votes ({formatPercent(leaderCandidates[0].voteCount, info.totalVotes)})
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-2xl font-bold">
            {ended ? "Tie: " : "Tied: "}
            {leaderCandidates.map((c) => `${c.symbol} ${c.name}`).join(", ")}
          </p>
        )}
        <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-white/10 p-3">
            <dd className="text-2xl font-bold">{info.totalVotes}</dd>
            <dt className="text-xs text-indigo-200">Total votes</dt>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <dd className="text-2xl font-bold">{info.eligibleVoters}</dd>
            <dt className="text-xs text-indigo-200">Eligible voters</dt>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <dd className="text-2xl font-bold">{formatPercent(info.totalVotes, info.eligibleVoters)}</dd>
            <dt className="text-xs text-indigo-200">Turnout</dt>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900">Vote breakdown</h2>
        <ResultsChart candidates={candidates} totalVotes={info.totalVotes} leaders={leaders} />
      </section>
    </div>
  );
}
