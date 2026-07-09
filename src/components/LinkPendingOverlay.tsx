"use client";

import { useLinkStatus } from "next/link";

export default function LinkPendingOverlay({ className = "rounded-2xl" }: { className?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;

  return (
    <span className={`absolute inset-0 z-10 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm ${className}`}>
      <svg className="h-6 w-6 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
      </svg>
    </span>
  );
}
