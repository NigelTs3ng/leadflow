import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { calculateQuota, getMomConfig, CompanyForQuota } from "@/lib/mom/quota";

export const dynamic = "force-dynamic";

const SECTOR_LABELS: Record<string, string> = {
  construction: "Construction",
  manufacturing: "Manufacturing",
  services: "Services",
  marine: "Marine Shipyard",
  process: "Process",
};

export default async function DashboardPage() {
  const { data: companies, error } = await supabase
    .from("companies")
    .select("*, leads(count), company_sectors(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="glass-panel border-rose-500/30 bg-rose-500/[0.06] text-rose-200 p-4">
        Could not load companies: {error.message}. Have you run supabase/schema.sql and set your
        .env.local values yet?
      </div>
    );
  }

  const momConfig = await getMomConfig().catch(() => null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold heading-gradient">Companies</h1>
        <Link href="/companies/new" className="btn-primary">
          + Add company
        </Link>
      </div>

      {companies.length === 0 && (
        <div className="glass-panel text-center py-16 text-muted border-dashed">
          No companies yet. Add your first company to start logging leads against it.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((c) => {
          const leadCount = (c as unknown as { leads: { count: number }[] }).leads?.[0]?.count ?? 0;
          const companySectors =
            (c as unknown as { company_sectors: (CompanyForQuota & { id: string })[] }).company_sectors ?? [];

          const quotas = momConfig
            ? companySectors.map((cs) => calculateQuota(cs, momConfig))
            : [];

          const totalWorkforce = quotas.reduce((sum, q) => sum + q.totalWorkforce, 0);
          const remainingForeignSlots = quotas.reduce((sum, q) => sum + q.remainingForeignSlots, 0);
          const remainingSPassSlots = quotas.reduce((sum, q) => sum + q.remainingSPassSlots, 0);
          const isOverQuota = quotas.some((q) => q.isOverQuota);
          const isOverSPassQuota = quotas.some((q) => q.isOverSPassQuota);

          return (
            <Link key={c.id} href={`/companies/${c.id}`} className="glass-card block p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-lg text-slate-100">{c.name}</h2>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {companySectors.length === 0 && <span className="badge-neutral">no sector yet</span>}
                {companySectors.map((cs) => (
                  <span key={cs.id} className="badge-neutral">
                    {SECTOR_LABELS[cs.sector] ?? cs.sector}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted mt-1">{leadCount} lead{leadCount === 1 ? "" : "s"}</p>

              {momConfig && companySectors.length > 0 && (
                <div className="mt-3 text-sm space-y-1 border-t border-white/10 pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted">Total workforce</span>
                    <span className="stat-value font-semibold text-slate-100">{totalWorkforce}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Foreign worker slots left</span>
                    <span
                      className={`stat-value font-semibold ${
                        isOverQuota ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {remainingForeignSlots}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">S Pass slots left</span>
                    <span
                      className={`stat-value font-semibold ${
                        isOverSPassQuota ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {remainingSPassSlots}
                    </span>
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
