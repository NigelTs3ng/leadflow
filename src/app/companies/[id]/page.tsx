import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { calculateQuota, getMomConfig, CompanyForQuota } from "@/lib/mom/quota";
import { getCompanyFieldDefs, getCompanySectorFieldDefs, deleteCompanySector } from "@/app/companies/actions";
import CustomFieldsDisplay from "@/components/CustomFieldsDisplay";
import SubmitButton from "@/components/SubmitButton";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const LEAD_STATUS_COLORS: Record<string, string> = {
  unfilled: "border-amber-500/20 bg-amber-500/15 text-amber-300",
  filled: "border-emerald-500/20 bg-emerald-500/15 text-emerald-300",
};

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: company, error } = await supabase.from("companies").select("*").eq("id", id).single();
  if (error || !company) notFound();

  const { data: companySectors } = await supabase
    .from("company_sectors")
    .select("*")
    .eq("company_id", id)
    .order("created_at", { ascending: true });

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("company_id", id)
    .order("created_at", { ascending: false });

  const momConfig = await getMomConfig();
  const fieldDefs = await getCompanyFieldDefs();
  const sectorFieldDefs = await getCompanySectorFieldDefs();

  return (
    <div>
      <Link href="/" className="link-back">
        ← Back to companies
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{company.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/companies/${id}/edit`} className="btn-secondary flex-1 sm:flex-none text-center">
            Edit
          </Link>
          <Link href={`/leads/new?company_id=${id}`} className="btn-primary flex-1 sm:flex-none text-center">
            + Add lead
          </Link>
        </div>
      </div>

      {/* Company details */}
      <div className="glass-panel p-5 mb-6 text-sm">
        {company.notes && <p className="text-slate-300 whitespace-pre-wrap">{company.notes}</p>}
        <CustomFieldsDisplay definitions={fieldDefs} values={company.custom_fields} />
      </div>

      {/* Sector profiles */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-100">Sectors ({companySectors?.length ?? 0})</h2>
        <Link href={`/companies/${id}/sectors/new`} className="btn-secondary">
          + Add sector
        </Link>
      </div>

      <div className="space-y-6 mb-6">
        {(companySectors ?? []).map((cs) => {
          const quota = calculateQuota(cs as unknown as CompanyForQuota, momConfig);
          const deleteWithId = deleteCompanySector.bind(null, cs.id, id);
          return (
            <div key={cs.id} className="glass-panel p-5 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
              <div className="flex items-start justify-between relative mb-3">
                <h3 className="font-semibold text-slate-100">
                  MOM quota &amp; levy — <span className="heading-gradient">{quota.sectorLabel}</span>
                </h3>
                <div className="flex gap-2">
                  <Link href={`/companies/${id}/sectors/${cs.id}/edit`} className="btn-secondary py-1 text-xs">
                    Edit
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm relative">
                <Stat label="Total workforce" value={quota.totalWorkforce} />
                <Stat
                  label="Foreign worker slots left"
                  value={quota.remainingForeignSlots}
                  danger={quota.isOverQuota}
                />
                <Stat
                  label="S Pass slots left"
                  value={quota.remainingSPassSlots}
                  danger={quota.isOverSPassQuota}
                />
                <Stat label="Est. monthly levy" value={`S$${quota.estimatedMonthlyLevy.toLocaleString()}`} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 border-t border-white/10 pt-4 relative">
                <Field label="Local employees" value={cs.local_workforce_count} />
                <Field label="S Pass holders" value={cs.s_pass_count} />
                <Field label="PRC Work Permit holders" value={cs.prc_wp_count} />
                <Field label="NTS OL Work Permit holders" value={cs.nts_ol_wp_count} />
                <Field label="Malaysian/NAS Work Permit holders" value={cs.malaysian_nas_wp_count} />
                <Field label="Of which higher-skilled (R1)" value={cs.higher_skilled_count} />
              </div>

              <div className="mt-4 text-xs text-muted space-y-1 border-t border-white/10 pt-3 relative">
                <p className="stat-value">
                  Max foreign workers estimate: {quota.maxForeignWorkers} · Currently holding:{" "}
                  {quota.totalWorkPermitHolders + cs.s_pass_count} · S Pass quota: {quota.sPassQuota}
                </p>
                {quota.warnings.map((w, i) => (
                  <p key={i} className="text-amber-400">
                    ⚠ {w}
                  </p>
                ))}
              </div>

              {cs.notes && <p className="mt-3 text-slate-300 whitespace-pre-wrap relative">{cs.notes}</p>}
              <CustomFieldsDisplay definitions={sectorFieldDefs} values={cs.custom_fields} />

              <form action={deleteWithId} className="mt-4 relative">
                <SubmitButton pendingText="Deleting..." className="btn-danger-link text-xs">
                  Delete this sector
                </SubmitButton>
              </form>
            </div>
          );
        })}
        {(companySectors ?? []).length === 0 && (
          <div className="glass-panel text-center py-10 text-muted border-dashed">
            No sectors added yet — add one to start tracking workforce and MOM quota for this company.
          </div>
        )}
      </div>

      {/* Leads */}
      <h2 className="font-semibold mb-3 text-slate-100">Leads ({leads?.length ?? 0})</h2>
      <div className="space-y-3">
        {(leads ?? []).map((lead) => (
          <Link key={lead.id} href={`/leads/${lead.id}`} className="glass-card block p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-100">{lead.job_title || "(no job title)"}</p>
                <p className="text-sm text-muted">
                  {lead.workers_needed ?? "?"} × {lead.worker_type || "worker"} ·{" "}
                  {lead.pay_offered ? `${lead.pay_offered}/${lead.pay_period}` : "pay TBC"}
                </p>
              </div>
              <span className={`badge border ${LEAD_STATUS_COLORS[lead.status] ?? ""}`}>
                {lead.status}
              </span>
            </div>
          </Link>
        ))}
        {(leads ?? []).length === 0 && (
          <div className="glass-panel text-center py-10 text-muted border-dashed">
            No leads logged for this company yet.
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, danger }: { label: string; value: string | number; danger?: boolean }) {
  return (
    <div>
      <p className="text-faint text-xs">{label}</p>
      <p className={`stat-value text-lg font-bold ${danger ? "text-rose-400" : "text-slate-100"}`}>{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-faint text-xs">{label}</p>
      <p className="font-medium text-slate-200 stat-value">{value}</p>
    </div>
  );
}
