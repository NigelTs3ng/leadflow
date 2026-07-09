import { supabase } from "@/lib/supabase";
import {
  createSupplyFollowUp,
  updateSupplyFollowUp,
  deleteSupplyFollowUp,
  getSupplyCompanyFieldDefs,
  getSupplyFollowUpFieldDefs,
  deleteSupplyCompany,
} from "@/app/supply-gen/actions";
import CustomFieldsDisplay from "@/components/CustomFieldsDisplay";
import CustomFieldsInput from "@/components/CustomFieldsInput";
import SubmitButton from "@/components/SubmitButton";
import LinkPendingOverlay from "@/components/LinkPendingOverlay";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const FOLLOWUP_STATUS_COLORS: Record<string, string> = {
  pending: "border-amber-500/20 bg-amber-500/15 text-amber-300",
  done: "border-emerald-500/20 bg-emerald-500/15 text-emerald-300",
  cancelled: "border-slate-500/20 bg-slate-500/15 text-slate-400",
};

export default async function SupplyCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: company, error } = await supabase.from("supply_companies").select("*").eq("id", id).single();
  if (error || !company) notFound();

  const { data: followUps } = await supabase
    .from("supply_follow_ups")
    .select("*")
    .eq("supply_company_id", id)
    .order("created_at", { ascending: false });

  const fieldDefs = await getSupplyCompanyFieldDefs();
  const followUpFieldDefs = await getSupplyFollowUpFieldDefs();

  const createFollowUpWithId = createSupplyFollowUp.bind(null, id);
  const deleteCompanyWithId = deleteSupplyCompany.bind(null, id);
  const wechatNumber = String(company.custom_fields?.wechat_number ?? "").trim();

  return (
    <div className="max-w-3xl">
      <Link href="/supply-gen" className="link-back">
        ← Back to Supply Gen
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{company.name}</h1>
          {company.country?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {company.country.map((c: string) => (
                <span key={c} className="badge-neutral">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
        <Link href={`/supply-gen/${id}/edit`} className="btn-secondary relative flex-1 sm:flex-none text-center">
          <LinkPendingOverlay className="rounded-lg" />
          Edit
        </Link>
      </div>

      <div className="glass-panel p-5 mb-6 text-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Contact person" value={company.contact_person || "—"} />
          <Field label="Contact number" value={company.contact_number || "—"} />
          <Field label="Contact email" value={company.contact_email || "—"} />
        </div>

        {(company.contact_number || company.contact_email || wechatNumber) && (
          <div className="flex flex-wrap gap-2 mt-4 border-t border-white/10 pt-4">
            {company.contact_number && (
              <a
                href={`https://wa.me/${company.contact_number.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.13-2.9-7-1.87-1.88-4.35-2.91-7-2.91Zm0 18.13a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.14.82.84-3.06-.2-.32a8.2 8.2 0 0 1-1.26-4.33c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.55-3.7 8.25-8.24 8.25Zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.04-.38-1.99-1.22-.73-.65-1.23-1.46-1.37-1.71-.14-.24-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.24.25-.4.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.16 0-.43.06-.65.31-.23.24-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.16 1.73 2.64 4.2 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.55.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.23-.16-.48-.28Z" />
                </svg>
                WhatsApp
              </a>
            )}
            {company.contact_email && (
              <a href={`mailto:${company.contact_email}`} className="btn-email">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5A2.25 2.25 0 0 1 18.75 19.5H5.25A2.25 2.25 0 0 1 3 17.25V6.75Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m3.5 7 8.5 6 8.5-6" />
                </svg>
                Email
              </a>
            )}
            {wechatNumber && (
              <a href={`tel:${wechatNumber.replace(/[^\d+]/g, "")}`} className="btn-wechat">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h1.5a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106a1.125 1.125 0 0 0-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97a1.125 1.125 0 0 0 .417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                  />
                </svg>
                Call (WeChat)
              </a>
            )}
          </div>
        )}

        {company.notes && <p className="mt-3 text-slate-300 whitespace-pre-wrap">{company.notes}</p>}
        <CustomFieldsDisplay definitions={fieldDefs} values={company.custom_fields} />
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
          <textarea name="planned_action" rows={2} className="input-field" />
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
        <SubmitButton pendingText="Adding...">Add follow-up</SubmitButton>
      </form>

      <div className="relative space-y-3 pl-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-cyan-400/40 before:via-white/10 before:to-transparent">
        {(followUps ?? []).map((f) => {
          const updateWithId = updateSupplyFollowUp.bind(null, f.id, id);
          const deleteWithId = deleteSupplyFollowUp.bind(null, f.id, id);
          return (
            <details key={f.id} className="glass-panel relative p-4 group">
              <span className="absolute -left-[27px] top-5 h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.6)]" />
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <div>
                  <span className="font-medium capitalize text-slate-100">{f.action_type.replace("_", " ")}</span>
                  <span className="text-muted text-sm ml-2">
                    {format(new Date(f.created_at), "d MMM yyyy, HH:mm")}
                  </span>
                  {f.planned_action && (
                    <p className="text-sm text-slate-400 mt-1 whitespace-pre-wrap">{f.planned_action}</p>
                  )}
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
                <textarea name="planned_action" rows={2} defaultValue={f.planned_action ?? ""} className="input-field" />
                <textarea name="action_taken" rows={2} defaultValue={f.action_taken ?? ""} className="input-field" />
                <input
                  type="datetime-local"
                  name="due_at"
                  defaultValue={f.due_at ? f.due_at.slice(0, 16) : ""}
                  className="input-field"
                />
                <CustomFieldsInput definitions={followUpFieldDefs} values={f.custom_fields} />
                <div className="flex gap-3">
                  <SubmitButton pendingText="Saving..." className="btn-primary py-1.5">
                    Save
                  </SubmitButton>
                </div>
              </form>
              <form action={deleteWithId}>
                <SubmitButton pendingText="Deleting..." className="btn-danger-link text-xs mt-2">
                  Delete follow-up
                </SubmitButton>
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

      <form action={deleteCompanyWithId} className="mt-8">
        <SubmitButton pendingText="Deleting..." className="btn-danger-link">
          Delete this supply company
        </SubmitButton>
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
