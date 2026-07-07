import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function SupplyGenPage() {
  const { data: companies, error } = await supabase
    .from("supply_companies")
    .select("*, supply_follow_ups(count)")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="glass-panel border-rose-500/30 bg-rose-500/[0.06] text-rose-200 p-4">
        Could not load Supply Gen companies: {error.message}. Have you run the
        supabase/migrations/0003_supply_gen.sql migration yet?
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold heading-gradient">Supply Gen</h1>
          <p className="text-sm text-muted mt-1">Overseas manpower supply companies and agents.</p>
        </div>
        <Link href="/supply-gen/new" className="btn-primary">
          + Add company
        </Link>
      </div>

      {companies.length === 0 && (
        <div className="glass-panel text-center py-16 text-muted border-dashed">
          No supply companies yet. Add your first overseas agent/agency to start logging follow-ups.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((c) => {
          const followUpCount = (c as unknown as { supply_follow_ups: { count: number }[] }).supply_follow_ups?.[0]?.count ?? 0;
          return (
            <Link key={c.id} href={`/supply-gen/${c.id}`} className="glass-card block p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-lg text-slate-100">{c.name}</h2>
                {c.country && <span className="badge-neutral shrink-0">{c.country}</span>}
              </div>
              {c.contact_person && <p className="text-sm text-muted mt-1">{c.contact_person}</p>}
              <p className="text-sm text-muted mt-1">
                {followUpCount} follow-up{followUpCount === 1 ? "" : "s"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
