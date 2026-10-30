import { getAddress, isAddress } from "ethers";
import { useState } from "react";
import StatusBadge from "../components/StatusBadge.jsx";
import { ElectionState } from "../utils/contract.js";
import { shortAddress } from "../utils/format.js";
import { parseError } from "../utils/errors.js";

const SYMBOL_SUGGESTIONS = ["🌱", "🤝", "💡", "🎭", "⚡", "📚", "🦁", "🚀", "🌟", "🏆"];
const EMPTY_CANDIDATE = { name: "", party: "", symbol: "", description: "" };

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

/** Owner-only election management plus a public voter lookup tool. */
export default function AdminPage({ wallet, election }) {
  const { info, isAdmin } = election;
  if (!info) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header>
        <StatusBadge state={info.state} />
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Election administration</h1>
        <p className="text-sm text-slate-500">
          Admin wallet: <span className="font-mono">{info.admin}</span>
        </p>
      </header>

      {!isAdmin && <ReadOnlyNotice wallet={wallet} election={election} />}

      {isAdmin && !wallet.isCorrectNetwork && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p>
            <b>Admin account detected, but MetaMask is on chain {wallet.chainId ?? "?"}.</b> Admin controls unlock on Hardhat Localhost (chain 31337).
          </p>
          <button
            type="button"
            onClick={wallet.switchNetwork}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            Switch network
          </button>
        </div>
      )}

      {isAdmin && wallet.isCorrectNetwork && (
        <>
          <LifecycleCard election={election} />
          <div className="grid gap-8 lg:grid-cols-2">
            <AddCandidateCard election={election} />
            <RegisterVotersCard election={election} />
          </div>
        </>
      )}

      <VoterLookupCard election={election} />
    </div>
  );
}

/** Explains why admin controls are hidden and how to connect the owner account. */
function ReadOnlyNotice({ wallet, election }) {
  const { info, devAccountIndex, hasDevAccounts } = election;
  const notDevAccount = wallet.account && hasDevAccounts && devAccountIndex === -1;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      <p className="font-semibold">Read-only view — admin controls are locked</p>
      <dl className="mt-3 grid gap-1 font-mono text-xs">
        <div>
          <dt className="inline font-sans font-semibold">Election admin (contract owner): </dt>
          <dd className="inline break-all">{info.admin}</dd>
        </div>
        <div>
          <dt className="inline font-sans font-semibold">Connected wallet: </dt>
          <dd className="inline break-all">
            {wallet.account ?? "none"}
            {wallet.account && devAccountIndex >= 0 && <span className="font-sans"> (Hardhat Account #{devAccountIndex})</span>}
          </dd>
        </div>
      </dl>

      {notDevAccount && (
        <p className="mt-3 rounded-lg bg-white/70 p-3">
          The connected wallet is <b>not one of the local Hardhat test accounts</b>. MetaMask's own "Account 1 / 2 / 3" are your personal
          accounts and are different from Hardhat's "Account #0 / #1 / …".
        </p>
      )}

      <ol className="mt-3 list-decimal space-y-1 pl-5">
        <li>
          In the terminal running <code className="rounded bg-white/70 px-1">npm run chain</code>, copy the private key printed for <b>Account #0</b>{" "}
          (<span className="font-mono text-xs">{shortAddress(info.admin)}</span>). It is a public test key, safe only on this local chain.
        </li>
        <li>MetaMask → account menu → <b>Add account or hardware wallet</b> → <b>Import account</b> → paste the key.</li>
        <li>Select the imported account in MetaMask. If this site isn't connected to it yet, click <b>Connect MetaMask</b> or use MetaMask's "Connect" prompt.</li>
      </ol>
      <p className="mt-3 text-xs">Every admin action is also enforced by the smart contract (onlyOwner), so other accounts cannot bypass this.</p>
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function LifecycleCard({ election }) {
  const { info, busy } = election;
  const [confirming, setConfirming] = useState(null);

  const run = async (action) => {
    setConfirming(null);
    await (action === "start" ? election.startElection() : election.endElection());
  };

  const phases = ["Setup", "Voting open", "Ended"];

  return (
    <Card title="Election lifecycle" subtitle="The lifecycle is one-way: Setup → Voting open → Ended. A finished election cannot be restarted.">
      <ol className="flex flex-col gap-2 sm:flex-row">
        {phases.map((p, i) => (
          <li
            key={p}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${
              i === info.state ? "bg-brand-600 text-white" : i < info.state ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400"
            }`}
          >
            {i < info.state ? "✓ " : ""}
            {p}
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {info.state === ElectionState.Setup && (
          <>
            {confirming === "start" ? (
              <ConfirmButtons label="Yes, open voting" onConfirm={() => run("start")} onCancel={() => setConfirming(null)} busy={busy} />
            ) : (
              <button
                type="button"
                onClick={() => setConfirming("start")}
                disabled={busy || info.candidateCount === 0}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ▶ Start election
              </button>
            )}
            {info.candidateCount === 0 && <span className="text-sm text-slate-500">Add at least one candidate first.</span>}
            {info.eligibleVoters === 0 && info.candidateCount > 0 && (
              <span className="text-sm text-amber-700">Tip: register voters before starting (late registration is also allowed).</span>
            )}
          </>
        )}
        {info.state === ElectionState.Active &&
          (confirming === "end" ? (
            <ConfirmButtons label="Yes, close voting" danger onConfirm={() => run("end")} onCancel={() => setConfirming(null)} busy={busy} />
          ) : (
            <button
              type="button"
              onClick={() => setConfirming("end")}
              disabled={busy}
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              ■ End election
            </button>
          ))}
        {info.state === ElectionState.Ended && <p className="text-sm text-slate-600">The election is over. Results are final and on-chain.</p>}
      </div>
    </Card>
  );
}

function ConfirmButtons({ label, onConfirm, onCancel, busy, danger = false }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-slate-700">Are you sure? This cannot be undone.</span>
      <button
        type="button"
        onClick={onConfirm}
        disabled={busy}
        className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
          danger ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
        }`}
      >
        {label}
      </button>
      <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
        Cancel
      </button>
    </div>
  );
}

function AddCandidateCard({ election }) {
  const { info, busy } = election;
  const [form, setForm] = useState(EMPTY_CANDIDATE);
  const locked = info.state !== ElectionState.Setup;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]));
    const ok = await election.addCandidate(trimmed);
    if (ok) setForm(EMPTY_CANDIDATE);
  };

  return (
    <Card title="Register a candidate" subtitle={locked ? "Candidates can only be added during the Setup phase." : "Stored permanently on-chain."}>
      <form onSubmit={submit} className="space-y-4">
        <fieldset disabled={locked || busy} className="space-y-4 disabled:opacity-60">
          <label className="block text-sm font-medium text-slate-700">
            Full name *
            <input className={inputClass} value={form.name} onChange={update("name")} maxLength={64} required placeholder="e.g. Ananya Rao" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Party / panel *
            <input className={inputClass} value={form.party} onChange={update("party")} maxLength={64} required placeholder="e.g. Student Voice" />
          </label>
          <div className="text-sm font-medium text-slate-700">
            <label htmlFor="symbol">Symbol * (emoji or short text)</label>
            <input id="symbol" className={inputClass} value={form.symbol} onChange={update("symbol")} maxLength={32} required placeholder="🌟" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SYMBOL_SUGGESTIONS.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setForm((f) => ({ ...f, symbol: s }))}
                  className={`h-9 w-9 rounded-lg border text-lg transition ${form.symbol === s ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-brand-500"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Manifesto / description
            <textarea
              className={`${inputClass} min-h-24`}
              value={form.description}
              onChange={update("description")}
              maxLength={280}
              placeholder="Key promises (max 280 characters)"
            />
            <span className="mt-1 block text-right text-xs text-slate-400">{form.description.length}/280</span>
          </label>
          <button type="submit" className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            + Add candidate
          </button>
        </fieldset>
      </form>
    </Card>
  );
}

function RegisterVotersCard({ election }) {
  const { info, busy } = election;
  const [text, setText] = useState("");
  const [removeAddr, setRemoveAddr] = useState("");
  const [error, setError] = useState(null);
  const ended = info.state === ElectionState.Ended;

  const submit = async (e) => {
    e.preventDefault();
    const parts = text.split(/[\s,;]+/).filter(Boolean);
    const invalid = parts.filter((p) => !isAddress(p));
    if (parts.length === 0) return setError("Enter at least one address.");
    if (invalid.length) return setError(`Invalid address: ${invalid[0]}`);
    if (parts.length > 200) return setError("Maximum 200 addresses per transaction.");
    setError(null);
    const unique = [...new Set(parts.map((p) => getAddress(p)))];
    const ok = await election.registerVoters(unique);
    if (ok) setText("");
  };

  const remove = async (e) => {
    e.preventDefault();
    if (!isAddress(removeAddr.trim())) return setError("Enter a valid address to remove.");
    setError(null);
    const ok = await election.removeVoter(getAddress(removeAddr.trim()));
    if (ok) setRemoveAddr("");
  };

  return (
    <Card
      title="Register eligible voters"
      subtitle={`${info.eligibleVoters} wallet(s) registered. Paste addresses separated by commas, spaces or new lines.`}
    >
      <form onSubmit={submit} className="space-y-3">
        <fieldset disabled={ended || busy} className="space-y-3 disabled:opacity-60">
          <textarea
            className={`${inputClass} min-h-32 font-mono text-xs`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"0x70997970C51812dc3A010C7d01b50e0d17dc79C8\n0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"}
          />
          <button type="submit" className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            Register voters
          </button>
        </fieldset>
      </form>

      {info.state === ElectionState.Setup && (
        <form onSubmit={remove} className="mt-6 border-t border-slate-100 pt-5">
          <label className="block text-sm font-medium text-slate-700">
            Remove a voter (Setup phase only)
            <div className="mt-1 flex gap-2">
              <input
                className={`${inputClass} mt-0 font-mono text-xs`}
                value={removeAddr}
                onChange={(e) => setRemoveAddr(e.target.value)}
                placeholder="0x…"
              />
              <button
                type="submit"
                disabled={busy}
                className="shrink-0 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </label>
        </form>
      )}

      {error && <p className="mt-3 rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{error}</p>}
      {ended && <p className="mt-3 text-sm text-slate-500">Registration is closed because the election has ended.</p>}
    </Card>
  );
}

function VoterLookupCard({ election }) {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const check = async (e) => {
    e.preventDefault();
    const value = address.trim();
    if (!isAddress(value)) {
      setResult({ error: "Enter a valid Ethereum address." });
      return;
    }
    setChecking(true);
    try {
      const status = await election.checkVoter(getAddress(value));
      setResult({ address: getAddress(value), ...status });
    } catch (err) {
      setResult({ error: parseError(err) });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card title="Voter lookup" subtitle="Anyone can check whether a wallet is registered and whether it has voted (public on-chain data).">
      <form onSubmit={check} className="flex flex-col gap-2 sm:flex-row">
        <input className={`${inputClass} mt-0 font-mono text-xs`} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x…" />
        <button
          type="submit"
          disabled={checking}
          className="shrink-0 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {checking ? "Checking…" : "Check"}
        </button>
      </form>
      {result?.error && <p className="mt-3 text-sm text-rose-600">{result.error}</p>}
      {result && !result.error && (
        <div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
          <p className="font-mono text-xs text-slate-500 sm:col-span-3">{result.address}</p>
          <p>Eligible: <b className={result.eligible ? "text-emerald-600" : "text-rose-600"}>{result.eligible ? "Yes" : "No"}</b></p>
          <p>Has voted: <b>{result.voted ? "Yes" : "No"}</b></p>
        </div>
      )}
    </Card>
  );
}
