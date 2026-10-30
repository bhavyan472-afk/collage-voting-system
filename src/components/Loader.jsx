export default function Loader({ label = "Loading election data from the blockchain…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
