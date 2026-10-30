import { CHAIN_ID } from "../utils/contract.js";

/** Contextual warnings: node unreachable, wrong MetaMask network, or no MetaMask (read-only mode). */
export default function NetworkBanner({ wallet, loadError, onRetry }) {
  if (loadError) {
    return (
      <Banner tone="rose">
        <span>⚠️ {loadError}</span>
        <button type="button" onClick={onRetry} className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700">
          Retry
        </button>
      </Banner>
    );
  }
  if (wallet.account && !wallet.isCorrectNetwork) {
    return (
      <Banner tone="amber">
        <span>
          MetaMask is on chain {wallet.chainId ?? "?"}. This election runs on the local Hardhat network (chain {CHAIN_ID}).
        </span>
        <button
          type="button"
          onClick={wallet.switchNetwork}
          className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700"
        >
          Switch network
        </button>
      </Banner>
    );
  }
  if (!wallet.hasProvider) {
    return (
      <Banner tone="sky">
        <span>Read-only mode: MetaMask was not detected. You can view candidates and results, but voting requires MetaMask.</span>
      </Banner>
    );
  }
  return null;
}

const TONES = {
  rose: "bg-rose-50 text-rose-800 border-rose-200",
  amber: "bg-amber-50 text-amber-900 border-amber-200",
  sky: "bg-sky-50 text-sky-900 border-sky-200",
};

function Banner({ tone, children }) {
  return (
    <div className={`border-b ${TONES[tone]}`}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm">{children}</div>
    </div>
  );
}
