import { createCompany, getCompanyFieldDefs } from "@/app/companies/actions";
import CustomFieldsInput from "@/components/CustomFieldsInput";
import SubmitButton from "@/components/SubmitButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewCompanyPage() {
  const fieldDefs = await getCompanyFieldDefs();

  return (
    <div className="max-w-2xl">
      <Link href="/" className="link-back">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6 heading-gradient">Add company</h1>

      <form action={createCompany} className="glass-panel p-6 space-y-4">
        <div>
          <label className="field-label">Company name *</label>
          <input name="name" required className="input-field" />
        </div>

        <div>
          <label className="field-label">Notes</label>
          <textarea name="notes" rows={3} className="input-field" />
        </div>

        <CustomFieldsInput definitions={fieldDefs} />

        <SubmitButton pendingText="Saving...">Save company</SubmitButton>
      </form>

      <p className="text-sm text-muted mt-4">
        Once saved, you&apos;ll be able to add one or more sector profiles (Construction, Services,
        etc.) with their own workforce numbers and MOM quota calculations.
      </p>
    </div>
  );
}
