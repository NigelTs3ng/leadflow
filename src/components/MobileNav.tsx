"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle navigation menu"
        aria-expanded={open}
        className="btn-secondary !px-2.5 !py-2"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-4 right-4 top-full z-40 mt-2 flex flex-col gap-1 rounded-2xl border border-white/10 bg-slate-950 p-2 shadow-2xl shadow-black/60">
            {children}
          </div>
        </>
      )}
    </div>
  );
}
