import { createSupplyCompany, getSupplyCompanyFieldDefs } from "@/app/supply-gen/actions";
import CustomFieldsInput from "@/components/CustomFieldsInput";
import SubmitButton from "@/components/SubmitButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewSupplyCompanyPage() {
  const fieldDefs = await getSupplyCompanyFieldDefs();

  return (
    <div className="max-w-2xl">
      <Link href="/supply-gen" className="link-back">
        ← Back to Supply Gen
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6 heading-gradient">Add supply company</h1>

      <form action={createSupplyCompany} className="glass-panel p-6 space-y-4">
        <div>
          <label className="field-label">Company / agent name *</label>
          <input name="name" required className="input-field" />
        </div>

        <div>
          <label className="field-label">Country</label>
          <input name="country" placeholder="e.g. China, India, Bangladesh" className="input-field" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Contact person</label>
            <input name="contact_person" className="input-field" />
          </div>
          <div>
            <label className="field-label">Contact number</label>
            <input name="contact_number" className="input-field" />
          </div>
        </div>

        <div>
          <label className="field-label">Contact email</label>
          <input type="email" name="contact_email" className="input-field" />
        </div>

        <div>
          <label className="field-label">Notes</label>
          <textarea name="notes" rows={3} className="input-field" />
        </div>

        <CustomFieldsInput definitions={fieldDefs} />

        <SubmitButton pendingText="Saving...">Save company</SubmitButton>
      </form>
    </div>
  );
}
