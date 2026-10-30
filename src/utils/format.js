export function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function percent(part, total) {
  if (!total) return 0;
  return (part / total) * 100;
}

export function formatPercent(part, total) {
  return `${percent(part, total).toFixed(1)}%`;
}

export function formatTimestamp(seconds) {
  if (!seconds) return "—";
  return new Date(Number(seconds) * 1000).toLocaleString();
}

export const STATE_META = {
  0: { label: "Not started", tone: "amber", description: "Candidates and voters are being registered." },
  1: { label: "Voting open", tone: "emerald", description: "Eligible voters can cast their vote now." },
  2: { label: "Election ended", tone: "slate", description: "Voting is closed. Results are final." },
};
