import Link from "next/link";
import { supabase } from "@/lib/supabase";
import LinkPendingOverlay from "@/components/LinkPendingOverlay";

export const dynamic = "force-dynamic";

export default async function SupplyGenPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const sortByCountry = sort === "country";

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

  const sorted = sortByCountry
    ? [...companies].sort((a, b) => {
        const aCountry = a.country?.[0] ?? "";
        const bCountry = b.country?.[0] ?? "";
        if (!aCountry && !bCountry) return 0;
        if (!aCountry) return 1;
        if (!bCountry) return -1;
        return aCountry.localeCompare(bCountry);
      })
    : companies;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold heading-gradient">Supply Gen</h1>
          <p className="text-sm text-muted mt-1">Overseas manpower supply companies and agents.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 p-0.5 text-sm">
            <Link
              href="/supply-gen"
              className={`rounded-md px-3 py-1.5 transition-colors ${
                !sortByCountry ? "bg-cyan-500/10 text-cyan-300" : "text-slate-400 hover:text-slate-100"
              }`}
            >
              Newest
            </Link>
            <Link
              href="/supply-gen?sort=country"
              className={`rounded-md px-3 py-1.5 transition-colors ${
                sortByCountry ? "bg-cyan-500/10 text-cyan-300" : "text-slate-400 hover:text-slate-100"
              }`}
            >
              Country (A–Z)
            </Link>
          </div>
          <Link href="/supply-gen/new" className="btn-primary relative">
            <LinkPendingOverlay className="rounded-lg" />+ Add company
          </Link>
        </div>
      </div>

      {companies.length === 0 && (
        <div className="glass-panel text-center py-16 text-muted border-dashed">
          No supply companies yet. Add your first overseas agent/agency to start logging follow-ups.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((c) => {
          const followUpCount = (c as unknown as { supply_follow_ups: { count: number }[] }).supply_follow_ups?.[0]?.count ?? 0;
          return (
            <Link key={c.id} href={`/supply-gen/${c.id}`} className="glass-card relative block p-4">
              <LinkPendingOverlay />
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-lg text-slate-100">{c.name}</h2>
                {c.country?.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-end shrink-0">
                    {c.country.map((country: string) => (
                      <span key={country} className="badge-neutral">
                        {country}
                      </span>
                    ))}
                  </div>
                )}
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
