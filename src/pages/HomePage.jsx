import StatusBadge from "../components/StatusBadge.jsx";
import { formatPercent } from "../utils/format.js";

const STEPS = [
  { icon: "🦊", title: "Connect wallet", text: "Link your MetaMask wallet. Your address is your voter identity." },
  { icon: "✅", title: "Get verified", text: "The election admin registers eligible student wallets on-chain." },
  { icon: "🗳️", title: "Cast your vote", text: "Pick a candidate and sign the transaction. One wallet, one vote." },
  { icon: "📊", title: "See live results", text: "Every vote is counted by the smart contract and visible to all." },
];

const FEATURES = [
  { icon: "🔒", title: "Tamper-evident", text: "Votes live on a blockchain ledger — no one can quietly edit the count." },
  { icon: "☝️", title: "One wallet, one vote", text: "The contract rejects duplicate votes and unregistered wallets." },
  { icon: "🔍", title: "Fully transparent", text: "Anyone can read the candidates, the tally, and every vote event." },
  { icon: "⏱️", title: "Enforced timeline", text: "Votes are only accepted while the admin has the election open." },
];

export default function HomePage({ election }) {
  const { info, candidates, leaders } = election;
  const leader = leaders.length === 1 ? candidates.find((c) => c.id === leaders[0]) : null;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-indigo-800 to-violet-700 text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              ⛓️ Powered by Ethereum smart contracts
            </p>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Your campus. Your voice. <span className="bg-gradient-to-r from-amber-200 to-pink-200 bg-clip-text text-transparent">On the blockchain.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-indigo-100">
              CampusVote runs student elections on a transparent, tamper-evident ledger. Every eligible student votes once, and anyone can verify
              the results.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#/vote" className="rounded-xl bg-white px-6 py-3 font-semibold text-brand-700 shadow-lg transition hover:bg-indigo-50">
                Go to voting booth →
              </a>
              <a href="#/results" className="rounded-xl px-6 py-3 font-semibold text-white ring-1 ring-white/40 transition hover:bg-white/10">
                View live results
              </a>
            </div>
          </div>

          {/* Live election card */}
          <div className="rounded-3xl bg-white/10 p-6 ring-1 ring-white/20 backdrop-blur">
            {info ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{info.name}</p>
                  <StatusBadge state={info.state} />
                </div>
                <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
                  <Stat label="Candidates" value={info.candidateCount} />
                  <Stat label="Votes" value={info.totalVotes} />
                  <Stat label="Turnout" value={formatPercent(info.totalVotes, info.eligibleVoters)} />
                </dl>
                <div className="mt-6 rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-indigo-200">{info.state === 2 ? "Winner" : "Currently leading"}</p>
                  <p className="mt-1 text-lg font-bold">
                    {leader
                      ? `${leader.symbol} ${leader.name}`
                      : leaders.length > 1
                        ? `Tie between ${leaders.length} candidates`
                        : "No votes yet"}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-indigo-100">Connecting to the blockchain…</p>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">How it works</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">Four steps from wallet to verified result.</p>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="absolute right-4 top-4 text-xs font-bold text-slate-300">0{i + 1}</span>
              <span className="text-3xl">{s.icon}</span>
              <h3 className="mt-3 font-bold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">Why blockchain voting?</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4 rounded-2xl bg-slate-50 p-6">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-100 text-2xl">{f.icon}</span>
                <div>
                  <h3 className="font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-10 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-900">
            🎓 Educational demonstration only. Votes on a public ledger are pseudonymous, not secret — this system is not suitable for legally
            binding elections.
          </p>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <dd className="text-2xl font-bold">{value}</dd>
      <dt className="text-xs text-indigo-200">{label}</dt>
    </div>
  );
}
