import { createCompanySector, getCompanySectorFieldDefs } from "@/app/companies/actions";
import CustomFieldsInput from "@/components/CustomFieldsInput";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewCompanySectorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: company, error } = await supabase.from("companies").select("id, name").eq("id", id).single();
  if (error || !company) notFound();

  const fieldDefs = await getCompanySectorFieldDefs();
  const createWithId = createCompanySector.bind(null, id);

  return (
    <div className="max-w-2xl">
      <Link href={`/companies/${id}`} className="link-back">
        ← Back to {company.name}
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6 heading-gradient">Add sector for {company.name}</h1>

      <form action={createWithId} className="glass-panel p-6 space-y-4">
        <div>
          <label className="field-label">Sector</label>
          <select name="sector" defaultValue="construction" className="input-field">
            <option value="construction">Construction</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="services">Services</option>
            <option value="marine">Marine Shipyard</option>
            <option value="process">Process</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Local employees</label>
            <input type="number" name="local_workforce_count" defaultValue={0} min={0} className="input-field" />
          </div>
          <div>
            <label className="field-label">S Pass holders</label>
            <input type="number" name="s_pass_count" defaultValue={0} min={0} className="input-field" />
          </div>
          <div>
            <label className="field-label">PRC Work Permit holders</label>
            <input type="number" name="prc_wp_count" defaultValue={0} min={0} className="input-field" />
          </div>
          <div>
            <label className="field-label">Work Permit holders on NTS Occupation List (NTS OL)</label>
            <input type="number" name="nts_ol_wp_count" defaultValue={0} min={0} className="input-field" />
          </div>
          <div>
            <label className="field-label">Malaysian / NAS Work Permit holders</label>
            <input type="number" name="malaysian_nas_wp_count" defaultValue={0} min={0} className="input-field" />
          </div>
          <div>
            <label className="field-label">Of which higher-skilled (R1)</label>
            <input type="number" name="higher_skilled_count" defaultValue={0} min={0} className="input-field" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" name="mye_waiver" className="h-4 w-4 accent-cyan-500" />
          MYE waiver in effect (construction/marine/process)
        </label>

        <div>
          <label className="field-label">Notes</label>
          <textarea name="notes" rows={3} className="input-field" />
        </div>

        <CustomFieldsInput definitions={fieldDefs} />

        <button type="submit" className="btn-primary">
          Save sector
        </button>
      </form>
    </div>
  );
}
