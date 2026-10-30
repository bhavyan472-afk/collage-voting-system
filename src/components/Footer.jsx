import { CONTRACT_ADDRESS, CHAIN_ID } from "../utils/contract.js";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>CampusVote — an educational blockchain election demo. Not for legally binding elections.</p>
        {CONTRACT_ADDRESS && (
          <p className="font-mono break-all">
            Contract {CONTRACT_ADDRESS} · chain {CHAIN_ID}
          </p>
        )}
      </div>
    </footer>
  );
}
