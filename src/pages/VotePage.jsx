import { useState } from "react";
import CandidateCard from "../components/CandidateCard.jsx";
import ElectionOverview from "../components/ElectionOverview.jsx";
import { ElectionState } from "../utils/contract.js";

/** Dashboard: election status, the connected wallet's voter status, and the voting interface. */
export default function VotePage({ wallet, election }) {
  const { info, candidates, voter, busy } = election;
  const [selected, setSelected] = useState(null);

  const disabledReason = (() => {
    if (!info) return "Loading…";
    if (info.state === ElectionState.Setup) return "Voting not open yet";
    if (info.state === ElectionState.Ended) return "Election ended";
    if (!wallet.hasProvider) return "MetaMask required";
    if (!wallet.account) return "Connect wallet to vote";
    if (!wallet.isCorrectNetwork) return "Switch network first";
    if (!voter) return "Checking eligibility…";
    if (!voter.eligible) return "Not an eligible voter";
    if (voter.voted) return "You have already voted";
    if (busy) return "Transaction in progress…";
    return null;
  })();

  const submitVote = async () => {
    const ok = await election.vote(selected);
    if (ok) setSelected(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <ElectionOverview info={info} />

      <VoterStatusCard wallet={wallet} voter={voter} state={info?.state} />

      <section>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Candidates</h2>
            <p className="text-sm text-slate-500">Select a candidate, review, and confirm your vote in MetaMask.</p>
          </div>
        </div>

        {candidates.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No candidates have been registered yet. The admin can add them on the Admin page.
          </p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                totalVotes={info?.totalVotes ?? 0}
                selected={selected?.id === c.id}
                onSelect={setSelected}
                disabledReason={disabledReason}
              />
            ))}
          </div>
        )}
      </section>

      {selected && (busy || !disabledReason) && (
        <ConfirmVote candidate={selected} busy={busy} onCancel={() => setSelected(null)} onConfirm={submitVote} />
      )}
    </div>
  );
}

function VoterStatusCard({ wallet, voter, state }) {
  let tone = "slate";
  let title;
  let text;

  if (!wallet.hasProvider) {
    title = "MetaMask not detected";
    text = "Install MetaMask to participate. You can still browse candidates and results.";
  } else if (!wallet.account) {
    title = "Connect your wallet";
    text = "Connect MetaMask to check whether your wallet is registered to vote.";
  } else if (!wallet.isCorrectNetwork) {
    tone = "amber";
    title = "Wrong network";
    text = "Switch MetaMask to the Hardhat Localhost network using the banner above.";
  } else if (!voter) {
    title = "Checking eligibility…";
    text = "Reading your voter status from the contract.";
  } else if (!voter.eligible) {
    tone = "rose";
    title = "Not registered";
    text = "This wallet is not on the eligible voter list. Ask the election admin to register it.";
  } else if (voter.voted) {
    tone = "emerald";
    title = "Vote recorded ✓";
    text = "Thank you for voting! Your vote is permanently recorded on the blockchain.";
  } else if (state === ElectionState.Active) {
    tone = "brand";
    title = "You're eligible to vote";
    text = "Choose a candidate below. You can vote only once and your choice cannot be changed.";
  } else if (state === ElectionState.Setup) {
    tone = "brand";
    title = "You're registered";
    text = "Voting hasn't opened yet. Come back when the admin starts the election.";
  } else {
    title = "Election closed";
    text = "Voting has ended. Check the Results page for the final tally.";
  }

  const tones = {
    slate: "border-slate-200 bg-white",
    amber: "border-amber-200 bg-amber-50",
    rose: "border-rose-200 bg-rose-50",
    emerald: "border-emerald-200 bg-emerald-50",
    brand: "border-brand-100 bg-brand-50",
  };

  return (
    <section className={`flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${tones[tone]}`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your voter status</p>
        <p className="mt-1 text-lg font-bold text-slate-900">{title}</p>
        <p className="text-sm text-slate-600">{text}</p>
      </div>
      {wallet.hasProvider && !wallet.account && (
        <button
          type="button"
          onClick={wallet.connect}
          disabled={wallet.connecting}
          className="shrink-0 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70"
        >
          🦊 Connect MetaMask
        </button>
      )}
    </section>
  );
}

function ConfirmVote({ candidate, busy, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Confirm your vote</p>
        <div className="mt-4 flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-4xl">{candidate.symbol}</span>
          <div>
            <p className="text-xl font-bold text-slate-900">{candidate.name}</p>
            <p className="text-sm text-brand-600">{candidate.party}</p>
          </div>
        </div>
        <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Votes are final. After you sign this transaction in MetaMask your wallet cannot vote again.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Confirm vote"}
          </button>
        </div>
      </div>
    </div>
  );
}
