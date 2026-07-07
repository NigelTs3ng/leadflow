import { createLead, getLeadFieldDefs } from "@/app/leads/actions";
import CustomFieldsInput from "@/components/CustomFieldsInput";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ company_id?: string }>;
}) {
  const { company_id } = await searchParams;
  if (!company_id) redirect("/");

  const { data: company } = await supabase.from("companies").select("id, name").eq("id", company_id).single();
  if (!company) redirect("/");

  const fieldDefs = await getLeadFieldDefs();

  return (
    <div className="max-w-2xl">
      <Link href={`/companies/${company_id}`} className="link-back">
        ← Back to {company.name}
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6 heading-gradient">New lead for {company.name}</h1>

      <form action={createLead} className="glass-panel p-6 space-y-4">
        <input type="hidden" name="company_id" value={company_id} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Job title</label>
            <input name="job_title" className="input-field" />
          </div>
          <div>
            <label className="field-label">Job description</label>
            <input name="job_description" placeholder="e.g. scope of works, site location" className="input-field" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Workers needed</label>
            <input type="number" name="workers_needed" min={0} className="input-field" />
          </div>
          <div>
            <label className="field-label">Worker type</label>
            <input name="worker_type" placeholder="e.g. General Labourer, Scaffolder" className="input-field" />
          </div>
          <div>
            <label className="field-label">Pass type</label>
            <select name="pass_type" defaultValue="Work Permit (NTS)" className="input-field">
              <option>Work Permit (NTS)</option>
              <option>Work Permit (PRC)</option>
              <option>S Pass</option>
              <option>Employment Pass</option>
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="field-label">Pay offered</label>
              <input type="number" step="0.01" name="pay_offered" className="input-field" />
            </div>
            <div className="w-28">
              <label className="field-label">Period</label>
              <select name="pay_period" defaultValue="monthly" className="input-field">
                <option value="monthly">Monthly</option>
                <option value="daily">Daily</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="field-label">Status</label>
          <select name="status" defaultValue="unfilled" className="input-field">
            <option value="unfilled">Unfilled</option>
            <option value="filled">Filled</option>
          </select>
        </div>

        <CustomFieldsInput definitions={fieldDefs} />

        <button type="submit" className="btn-primary">
          Save lead
        </button>
      </form>
    </div>
  );
}
