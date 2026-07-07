"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
        active ? "bg-cyan-500/10 text-cyan-300" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
      }`}
    >
      {children}
    </Link>
  );
}
