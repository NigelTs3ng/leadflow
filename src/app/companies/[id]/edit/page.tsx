import { updateCompany, deleteCompany, getCompanyFieldDefs } from "@/app/companies/actions";
import CustomFieldsInput from "@/components/CustomFieldsInput";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: company, error } = await supabase.from("companies").select("*").eq("id", id).single();
  if (error || !company) notFound();

  const fieldDefs = await getCompanyFieldDefs();
  const updateWithId = updateCompany.bind(null, id);
  const deleteWithId = deleteCompany.bind(null, id);

  return (
    <div className="max-w-2xl">
      <Link href={`/companies/${id}`} className="link-back">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6 heading-gradient">Edit {company.name}</h1>

      <form action={updateWithId} className="glass-panel p-6 space-y-4">
        <div>
          <label className="field-label">Company name *</label>
          <input name="name" required defaultValue={company.name} className="input-field" />
        </div>

        <div>
          <label className="field-label">Notes</label>
          <textarea name="notes" rows={3} defaultValue={company.notes ?? ""} className="input-field" />
        </div>

        <CustomFieldsInput definitions={fieldDefs} values={company.custom_fields} />

        <div className="flex justify-between pt-2">
          <button type="submit" className="btn-primary">
            Save changes
          </button>
        </div>
      </form>

      <form action={deleteWithId} className="mt-4">
        <button type="submit" className="btn-danger-link">
          Delete this company and all its sectors and leads
        </button>
      </form>
    </div>
  );
}
