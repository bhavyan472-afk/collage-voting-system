const STYLES = {
  success: { ring: "border-emerald-200", icon: "✅" },
  error: { ring: "border-rose-200", icon: "⚠️" },
  info: { ring: "border-slate-200", icon: "ℹ️" },
};

export default function Toasts({ toasts, dismiss }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
      {toasts.map((t) => {
        const s = STYLES[t.type] ?? STYLES.info;
        return (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            className={`animate-toast-in pointer-events-auto flex w-full max-w-sm gap-3 rounded-xl border bg-white p-4 shadow-lg ${s.ring}`}
          >
            <span className="text-lg leading-none">{s.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{t.title}</p>
              {t.message && <p className="mt-0.5 break-words text-sm text-slate-600">{t.message}</p>}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-700" aria-label="Dismiss">
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
