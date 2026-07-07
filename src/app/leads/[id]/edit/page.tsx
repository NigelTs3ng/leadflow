import { updateLead, getLeadFieldDefs } from "@/app/leads/actions";
import CustomFieldsInput from "@/components/CustomFieldsInput";
import SubmitButton from "@/components/SubmitButton";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: lead, error } = await supabase.from("leads").select("*, companies(id, name)").eq("id", id).single();
  if (error || !lead) notFound();

  const company = (lead as unknown as { companies: { id: string; name: string } }).companies;
  const fieldDefs = await getLeadFieldDefs();
  const updateWithId = updateLead.bind(null, id, company.id);

  return (
    <div className="max-w-2xl">
      <Link href={`/leads/${id}`} className="link-back">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6 heading-gradient">Edit lead — {company.name}</h1>

      <form action={updateWithId} className="glass-panel p-6 space-y-4">
        <div>
          <label className="field-label">Job title</label>
          <input name="job_title" defaultValue={lead.job_title ?? ""} className="input-field" />
        </div>
        <div>
          <label className="field-label">Job description</label>
          <textarea
            name="job_description"
            rows={4}
            defaultValue={lead.job_description ?? ""}
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Workers needed</label>
            <input type="number" name="workers_needed" defaultValue={lead.workers_needed ?? ""} min={0} className="input-field" />
          </div>
          <div>
            <label className="field-label">Worker type</label>
            <input name="worker_type" defaultValue={lead.worker_type ?? ""} className="input-field" />
          </div>
          <div>
            <label className="field-label">Pass type</label>
            <select name="pass_type" defaultValue={lead.pass_type ?? "Work Permit (NTS)"} className="input-field">
              <option>Work Permit (NTS)</option>
              <option>Work Permit (PRC)</option>
              <option>S Pass</option>
              <option>Employment Pass</option>
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="field-label">Pay offered</label>
              <input type="text" name="pay_offered" defaultValue={lead.pay_offered ?? ""} placeholder="e.g. 1,800 or 60-80/day" className="input-field" />
            </div>
            <div className="w-28">
              <label className="field-label">Period</label>
              <select name="pay_period" defaultValue={lead.pay_period ?? "monthly"} className="input-field">
                <option value="monthly">Monthly</option>
                <option value="daily">Daily</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="field-label">Status</label>
          <select name="status" defaultValue={lead.status} className="input-field">
            <option value="unfilled">Unfilled</option>
            <option value="filled">Filled</option>
          </select>
        </div>

        <CustomFieldsInput definitions={fieldDefs} values={lead.custom_fields} />

        <SubmitButton pendingText="Saving...">Save changes</SubmitButton>
      </form>
    </div>
  );
}
