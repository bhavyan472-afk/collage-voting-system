import { STATE_META } from "../utils/format.js";

const TONES = {
  amber: "bg-amber-100 text-amber-800 ring-amber-200",
  emerald: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  slate: "bg-slate-200 text-slate-700 ring-slate-300",
};

const DOTS = {
  amber: "bg-amber-500",
  emerald: "bg-emerald-500 animate-pulse",
  slate: "bg-slate-500",
};

export default function StatusBadge({ state }) {
  const meta = STATE_META[state] ?? STATE_META[0];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${TONES[meta.tone]}`}>
      <span className={`h-2 w-2 rounded-full ${DOTS[meta.tone]}`} />
      {meta.label}
    </span>
  );
}
