import { supabase } from "@/lib/supabase";
import { createFollowUp, updateFollowUp, deleteFollowUp, getLeadFieldDefs, getFollowUpFieldDefs, deleteLead } from "@/app/leads/actions";
import CustomFieldsDisplay from "@/components/CustomFieldsDisplay";
import CustomFieldsInput from "@/components/CustomFieldsInput";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  unfilled: "border-amber-500/20 bg-amber-500/15 text-amber-300",
  filled: "border-emerald-500/20 bg-emerald-500/15 text-emerald-300",
};

const FOLLOWUP_STATUS_COLORS: Record<string, string> = {
  pending: "border-amber-500/20 bg-amber-500/15 text-amber-300",
  done: "border-emerald-500/20 bg-emerald-500/15 text-emerald-300",
  cancelled: "border-slate-500/20 bg-slate-500/15 text-slate-400",
};

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: lead, error } = await supabase.from("leads").select("*, companies(id, name)").eq("id", id).single();
  if (error || !lead) notFound();

  const { data: followUps } = await supabase
    .from("follow_ups")
    .select("*")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  const leadFieldDefs = await getLeadFieldDefs();
  const followUpFieldDefs = await getFollowUpFieldDefs();

  const company = (lead as unknown as { companies: { id: string; name: string } }).companies;
  const createFollowUpWithId = createFollowUp.bind(null, id);
  const deleteLeadWithId = deleteLead.bind(null, id, company.id);

  return (
    <div className="max-w-3xl">
      <Link href={`/companies/${company.id}`} className="link-back">
        ← Back to {company.name}
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{lead.job_title || "(no job title)"}</h1>
          <p className="text-sm text-muted">{company.name}</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className={`badge border ${STATUS_COLORS[lead.status] ?? ""}`}>{lead.status}</span>
          <Link href={`/leads/${id}/edit`} className="btn-secondary flex-1 sm:flex-none text-center">
            Edit
          </Link>
        </div>
      </div>

      <div className="glass-panel p-5 mb-6 text-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Workers needed" value={lead.workers_needed ?? "—"} />
          <Field label="Worker type" value={lead.worker_type || "—"} />
          <Field label="Pass type" value={lead.pass_type || "—"} />
          <Field label="Pay offered" value={lead.pay_offered ? `S$${lead.pay_offered} / ${lead.pay_period}` : "—"} />
          <Field
            label="Last contacted"
            value={lead.last_contacted_at ? format(new Date(lead.last_contacted_at), "d MMM yyyy, HH:mm") : "—"}
          />
        </div>

        <details className="mt-3 border-t border-white/10 pt-3 group">
          <summary className="cursor-pointer list-none flex items-center gap-2 min-w-0">
            <span className="text-faint text-xs shrink-0">Job description</span>
            <span className="text-sm text-slate-300 truncate min-w-0 flex-1 group-open:hidden">
              {lead.job_description || "—"}
            </span>
            <span className="text-xs text-cyan-400 shrink-0">
              <span className="group-open:hidden">Show more ▾</span>
              <span className="hidden group-open:inline">Show less ▴</span>
            </span>
          </summary>
          <p className="text-sm text-slate-300 whitespace-pre-wrap mt-2">{lead.job_description || "—"}</p>
        </details>

        <CustomFieldsDisplay definitions={leadFieldDefs} values={lead.custom_fields} />
      </div>

      {/* Follow ups */}
      <h2 className="font-semibold mb-3 text-slate-100">Follow-ups</h2>

      <form action={createFollowUpWithId} className="glass-panel p-5 mb-6 space-y-3">
        <p className="text-sm font-medium text-slate-200">Log a follow-up</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Action type</label>
            <select name="action_type" defaultValue="call" className="input-field">
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="meeting">Meeting</option>
              <option value="site_visit">Site visit</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="field-label">Status</label>
            <select name="status" defaultValue="done" className="input-field">
              <option value="pending">Pending (to-do)</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div>
          <label className="field-label">Planned action (what needs to happen)</label>
          <input name="planned_action" className="input-field" />
        </div>
        <div>
          <label className="field-label">Action taken (what actually happened)</label>
          <textarea name="action_taken" rows={2} className="input-field" />
        </div>
        <div>
          <label className="field-label">Due / follow-up date &amp; time</label>
          <input type="datetime-local" name="due_at" className="input-field" />
        </div>
        <CustomFieldsInput definitions={followUpFieldDefs} />
        <button type="submit" className="btn-primary">
          Add follow-up
        </button>
      </form>

      <div className="relative space-y-3 pl-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-cyan-400/40 before:via-white/10 before:to-transparent">
        {(followUps ?? []).map((f) => {
          const updateWithId = updateFollowUp.bind(null, f.id, id);
          const deleteWithId = deleteFollowUp.bind(null, f.id, id);
          return (
            <details key={f.id} className="glass-panel relative p-4 group">
              <span className="absolute -left-[27px] top-5 h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.6)]" />
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <div>
                  <span className="font-medium capitalize text-slate-100">{f.action_type.replace("_", " ")}</span>
                  <span className="text-muted text-sm ml-2">
                    {format(new Date(f.created_at), "d MMM yyyy, HH:mm")}
                  </span>
                  {f.planned_action && <p className="text-sm text-slate-400 mt-1">{f.planned_action}</p>}
                </div>
                <span className={`badge border ${FOLLOWUP_STATUS_COLORS[f.status] ?? ""}`}>{f.status}</span>
              </summary>

              {f.action_taken && <p className="text-sm text-slate-300 mt-3 whitespace-pre-wrap">{f.action_taken}</p>}
              {f.due_at && (
                <p className="text-xs text-muted mt-2">Due: {format(new Date(f.due_at), "d MMM yyyy, HH:mm")}</p>
              )}
              <CustomFieldsDisplay definitions={followUpFieldDefs} values={f.custom_fields} />

              <form action={updateWithId} className="mt-4 border-t border-white/10 pt-4 space-y-3">
                <p className="field-label">Edit this follow-up</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">Action type</label>
                    <select name="action_type" defaultValue={f.action_type} className="input-field">
                      <option value="call">Call</option>
                      <option value="email">Email</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="meeting">Meeting</option>
                      <option value="site_visit">Site visit</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Status</label>
                    <select name="status" defaultValue={f.status} className="input-field">
                      <option value="pending">Pending (to-do)</option>
                      <option value="done">Done</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <input name="planned_action" defaultValue={f.planned_action ?? ""} className="input-field" />
                <textarea name="action_taken" rows={2} defaultValue={f.action_taken ?? ""} className="input-field" />
                <input
                  type="datetime-local"
                  name="due_at"
                  defaultValue={f.due_at ? f.due_at.slice(0, 16) : ""}
                  className="input-field"
                />
                <CustomFieldsInput definitions={followUpFieldDefs} values={f.custom_fields} />
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary py-1.5">
                    Save
                  </button>
                </div>
              </form>
              <form action={deleteWithId}>
                <button type="submit" className="btn-danger-link text-xs mt-2">
                  Delete follow-up
                </button>
              </form>
            </details>
          );
        })}
        {(followUps ?? []).length === 0 && (
          <div className="glass-panel text-center py-8 text-muted border-dashed">
            No follow-ups logged yet.
          </div>
        )}
      </div>

      <form action={deleteLeadWithId} className="mt-8">
        <button type="submit" className="btn-danger-link">
          Delete this lead
        </button>
      </form>
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
