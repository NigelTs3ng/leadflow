import { updateSupplyCompany, deleteSupplyCompany, getSupplyCompanyFieldDefs } from "@/app/supply-gen/actions";
import CustomFieldsInput from "@/components/CustomFieldsInput";
import SubmitButton from "@/components/SubmitButton";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditSupplyCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: company, error } = await supabase.from("supply_companies").select("*").eq("id", id).single();
  if (error || !company) notFound();

  const fieldDefs = await getSupplyCompanyFieldDefs();
  const updateWithId = updateSupplyCompany.bind(null, id);
  const deleteWithId = deleteSupplyCompany.bind(null, id);

  return (
    <div className="max-w-2xl">
      <Link href={`/supply-gen/${id}`} className="link-back">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6 heading-gradient">Edit {company.name}</h1>

      <form action={updateWithId} className="glass-panel p-6 space-y-4">
        <div>
          <label className="field-label">Company / agent name *</label>
          <input name="name" required defaultValue={company.name} className="input-field" />
        </div>

        <div>
          <label className="field-label">Country</label>
          <input name="country" defaultValue={company.country ?? ""} className="input-field" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Contact person</label>
            <input name="contact_person" defaultValue={company.contact_person ?? ""} className="input-field" />
          </div>
          <div>
            <label className="field-label">Contact number</label>
            <input name="contact_number" defaultValue={company.contact_number ?? ""} className="input-field" />
          </div>
        </div>

        <div>
          <label className="field-label">Contact email</label>
          <input type="email" name="contact_email" defaultValue={company.contact_email ?? ""} className="input-field" />
        </div>

        <div>
          <label className="field-label">Notes</label>
          <textarea name="notes" rows={3} defaultValue={company.notes ?? ""} className="input-field" />
        </div>

        <CustomFieldsInput definitions={fieldDefs} values={company.custom_fields} />

        <div className="flex justify-between pt-2">
          <SubmitButton pendingText="Saving...">Save changes</SubmitButton>
        </div>
      </form>

      <form action={deleteWithId} className="mt-4">
        <SubmitButton pendingText="Deleting..." className="btn-danger-link">
          Delete this supply company
        </SubmitButton>
      </form>
    </div>
  );
}
