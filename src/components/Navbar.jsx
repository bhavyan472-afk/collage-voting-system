import { useState } from "react";
import WalletButton from "./WalletButton.jsx";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/vote", label: "Vote" },
  { to: "/results", label: "Results" },
  { to: "/admin", label: "Admin" },
];

export default function Navbar({ path, wallet, isAdmin }) {
  const [open, setOpen] = useState(false);

  const linkClass = (to) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      path === to ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <a href="#/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white">🗳️</span>
          CampusVote
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a key={l.to} href={`#${l.to}`} className={linkClass(l.to)}>
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <WalletButton wallet={wallet} isAdmin={isAdmin} />
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a key={l.to} href={`#${l.to}`} className={linkClass(l.to)} onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
          </div>
          <div className="mt-3">
            <WalletButton wallet={wallet} isAdmin={isAdmin} compact />
          </div>
        </div>
      )}
    </header>
  );
}
