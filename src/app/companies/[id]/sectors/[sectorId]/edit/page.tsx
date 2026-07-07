import { updateCompanySector, deleteCompanySector, getCompanySectorFieldDefs } from "@/app/companies/actions";
import CustomFieldsInput from "@/components/CustomFieldsInput";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditCompanySectorPage({
  params,
}: {
  params: Promise<{ id: string; sectorId: string }>;
}) {
  const { id, sectorId } = await params;
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name")
    .eq("id", id)
    .single();
  if (companyError || !company) notFound();

  const { data: companySector, error } = await supabase
    .from("company_sectors")
    .select("*")
    .eq("id", sectorId)
    .eq("company_id", id)
    .single();
  if (error || !companySector) notFound();

  const fieldDefs = await getCompanySectorFieldDefs();
  const updateWithId = updateCompanySector.bind(null, sectorId, id);
  const deleteWithId = deleteCompanySector.bind(null, sectorId, id);

  return (
    <div className="max-w-2xl">
      <Link href={`/companies/${id}`} className="link-back">
        ← Back to {company.name}
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6 heading-gradient">
        Edit sector — {company.name}
      </h1>

      <form action={updateWithId} className="glass-panel p-6 space-y-4">
        <div>
          <label className="field-label">Sector</label>
          <select name="sector" defaultValue={companySector.sector} className="input-field">
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
            <input
              type="number"
              name="local_workforce_count"
              defaultValue={companySector.local_workforce_count}
              min={0}
              className="input-field"
            />
          </div>
          <div>
            <label className="field-label">S Pass holders</label>
            <input
              type="number"
              name="s_pass_count"
              defaultValue={companySector.s_pass_count}
              min={0}
              className="input-field"
            />
          </div>
          <div>
            <label className="field-label">PRC Work Permit holders</label>
            <input
              type="number"
              name="prc_wp_count"
              defaultValue={companySector.prc_wp_count}
              min={0}
              className="input-field"
            />
          </div>
          <div>
            <label className="field-label">Work Permit holders on NTS Occupation List (NTS OL)</label>
            <input
              type="number"
              name="nts_ol_wp_count"
              defaultValue={companySector.nts_ol_wp_count}
              min={0}
              className="input-field"
            />
          </div>
          <div>
            <label className="field-label">Malaysian / NAS Work Permit holders</label>
            <input
              type="number"
              name="malaysian_nas_wp_count"
              defaultValue={companySector.malaysian_nas_wp_count}
              min={0}
              className="input-field"
            />
          </div>
          <div>
            <label className="field-label">Of which higher-skilled (R1)</label>
            <input
              type="number"
              name="higher_skilled_count"
              defaultValue={companySector.higher_skilled_count}
              min={0}
              className="input-field"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            name="mye_waiver"
            defaultChecked={companySector.mye_waiver}
            className="h-4 w-4 accent-cyan-500"
          />
          MYE waiver in effect (construction/marine/process)
        </label>

        <div>
          <label className="field-label">Notes</label>
          <textarea name="notes" rows={3} defaultValue={companySector.notes ?? ""} className="input-field" />
        </div>

        <CustomFieldsInput definitions={fieldDefs} values={companySector.custom_fields} />

        <div className="flex justify-between pt-2">
          <button type="submit" className="btn-primary">
            Save changes
          </button>
        </div>
      </form>

      <form action={deleteWithId} className="mt-4">
        <button type="submit" className="btn-danger-link">
          Delete this sector
        </button>
      </form>
    </div>
  );
}
