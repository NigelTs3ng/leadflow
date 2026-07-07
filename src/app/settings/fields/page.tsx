import { addCustomField, removeCustomField, listCustomFields } from "@/app/settings/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ENTITY_LABELS: Record<string, string> = {
  company: "Company",
  company_sector: "Company sector",
  lead: "Lead",
  follow_up: "Follow-up",
};

export default async function CustomFieldsPage() {
  const fields = await listCustomFields();

  return (
    <div className="max-w-2xl">
      <Link href="/settings" className="link-back">
        ← Back to settings
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6 heading-gradient">Custom fields</h1>

      <form action={addCustomField} className="glass-panel p-6 space-y-4 mb-8">
        <p className="text-sm font-medium text-slate-200">Add a new field</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Applies to</label>
            <select name="entity_type" className="input-field">
              <option value="company">Company</option>
              <option value="company_sector">Company sector</option>
              <option value="lead">Lead</option>
              <option value="follow_up">Follow-up</option>
            </select>
          </div>
          <div>
            <label className="field-label">Field type</label>
            <select name="field_type" className="input-field">
              <option value="text">Text</option>
              <option value="textarea">Long text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="select">Dropdown</option>
              <option value="checkbox">Checkbox</option>
            </select>
          </div>
        </div>
        <div>
          <label className="field-label">Label</label>
          <input name="label" required placeholder="e.g. Union Membership" className="input-field" />
        </div>
        <div>
          <label className="field-label">Dropdown options (comma-separated — only used for Dropdown type)</label>
          <input name="options" placeholder="e.g. Yes, No, Pending" className="input-field" />
        </div>
        <button type="submit" className="btn-primary">
          Add field
        </button>
      </form>

      {(["company", "company_sector", "lead", "follow_up"] as const).map((entity) => (
        <div key={entity} className="mb-6">
          <h2 className="font-semibold mb-2 text-slate-100">{ENTITY_LABELS[entity]} fields</h2>
          <div className="glass-panel divide-y divide-white/10">
            {fields.filter((f) => f.entity_type === entity).length === 0 && (
              <p className="p-4 text-sm text-muted">No custom fields yet.</p>
            )}
            {fields
              .filter((f) => f.entity_type === entity)
              .map((f) => {
                const removeWithId = removeCustomField.bind(null, f.id);
                return (
                  <div key={f.id} className="p-4 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-slate-200">{f.label}</span>{" "}
                      <span className="text-faint">({f.field_type})</span>
                    </div>
                    <form action={removeWithId}>
                      <button type="submit" className="btn-danger-link text-xs">
                        Remove
                      </button>
                    </form>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
