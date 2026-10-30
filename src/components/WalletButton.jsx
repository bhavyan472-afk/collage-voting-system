import { useState } from "react";
import { shortAddress } from "../utils/format.js";

export default function WalletButton({ wallet, isAdmin, compact = false }) {
  const { account, connecting, connect, disconnect, hasProvider } = wallet;
  const [copied, setCopied] = useState(false);

  if (!account) {
    if (!hasProvider) {
      return (
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
        >
          🦊 Install MetaMask
        </a>
      );
    }
    return (
      <button
        type="button"
        onClick={connect}
        disabled={connecting}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70"
      >
        🦊 {connecting ? "Connecting…" : "Connect MetaMask"}
      </button>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked; address is still visible in the tooltip */
    }
  };

  return (
    <div className={`flex items-center gap-2 ${compact ? "w-full" : ""}`}>
      <button
        type="button"
        onClick={copy}
        title={`${account} — click to copy`}
        className="inline-flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-700 shadow-sm transition hover:border-brand-500"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        {copied ? "Copied!" : shortAddress(account)}
        {isAdmin && <span className="rounded-md bg-brand-100 px-1.5 py-0.5 font-sans text-[10px] font-bold text-brand-700">ADMIN</span>}
      </button>
      <button
        type="button"
        onClick={disconnect}
        title="Disconnect"
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm transition hover:border-rose-300 hover:text-rose-600"
      >
        ⏻
      </button>
    </div>
  );
}
