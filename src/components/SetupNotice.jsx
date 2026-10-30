/** Shown when src/contracts/VotingSystem.json does not exist yet (contract not deployed). */
export default function SetupNotice() {
  const steps = [
    ["Start a local blockchain", "npm run chain"],
    ["Deploy the contract (new terminal)", "npm run deploy:local"],
    ["Restart or refresh this page", "npm run dev"],
  ];
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-4xl">🛠️</p>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Contract not deployed yet</h1>
        <p className="mt-2 text-slate-600">
          The frontend could not find <code className="rounded bg-slate-100 px-1">src/contracts/VotingSystem.json</code>. The deploy script creates
          it automatically with the contract address and ABI.
        </p>
        <ol className="mt-6 space-y-3">
          {steps.map(([label, cmd], i) => (
            <li key={cmd} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
              <div>
                <p className="font-medium text-slate-800">{label}</p>
                <code className="mt-1 block rounded-lg bg-slate-900 px-3 py-2 font-mono text-sm text-emerald-300">{cmd}</code>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-slate-500">See README.md for full instructions.</p>
      </div>
    </div>
  );
}
