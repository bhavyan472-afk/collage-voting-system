import StatusBadge from "./StatusBadge.jsx";
import { STATE_META, formatPercent, formatTimestamp, shortAddress } from "../utils/format.js";

/** Election status header with key stats. */
export default function ElectionOverview({ info }) {
  if (!info) return null;
  const stats = [
    { label: "Candidates", value: info.candidateCount },
    { label: "Eligible voters", value: info.eligibleVoters },
    { label: "Votes cast", value: info.totalVotes },
    { label: "Turnout", value: formatPercent(info.totalVotes, info.eligibleVoters) },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StatusBadge state={info.state} />
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{info.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{STATE_META[info.state]?.description}</p>
        </div>
        <dl className="grid shrink-0 grid-cols-1 gap-1 text-xs text-slate-500 sm:text-right">
          <div>
            <dt className="inline">Admin: </dt>
            <dd className="inline font-mono" title={info.admin}>
              {shortAddress(info.admin)}
            </dd>
          </div>
          <div>
            <dt className="inline">Started: </dt>
            <dd className="inline">{formatTimestamp(info.startTime)}</dd>
          </div>
          <div>
            <dt className="inline">Ended: </dt>
            <dd className="inline">{formatTimestamp(info.endTime)}</dd>
          </div>
        </dl>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
