"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`relative text-sm transition-colors ${
        active ? "text-cyan-300" : "text-slate-400 hover:text-slate-100"
      }`}
    >
      {children}
      {active && (
        <span className="absolute -bottom-[13px] left-0 right-0 h-px bg-gradient-to-r from-cyan-400 to-blue-500" />
      )}
    </Link>
  );
}
