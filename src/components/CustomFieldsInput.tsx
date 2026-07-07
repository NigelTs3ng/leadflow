import { CustomFieldDefinition } from "@/lib/customFields";

export default function CustomFieldsInput({
  definitions,
  values,
}: {
  definitions: CustomFieldDefinition[];
  values?: Record<string, unknown> | null;
}) {
  if (definitions.length === 0) return null;

  return (
    <div className="border-t border-white/10 pt-4 mt-4">
      <h3 className="field-label mb-3">Additional fields</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {definitions.map((def) => {
          const currentValue = values?.[def.field_key];
          const name = `cf_${def.field_key}`;
          return (
            <div key={def.id} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-300">{def.label}</label>
              {def.field_type === "textarea" && (
                <textarea
                  name={name}
                  defaultValue={(currentValue as string) ?? ""}
                  className="input-field"
                  rows={3}
                />
              )}
              {def.field_type === "select" && (
                <select name={name} defaultValue={(currentValue as string) ?? ""} className="input-field">
                  <option value="">-- Select --</option>
                  {(def.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
              {def.field_type === "checkbox" && (
                <input
                  type="checkbox"
                  name={name}
                  defaultChecked={currentValue === "true" || currentValue === true}
                  className="h-4 w-4 self-start mt-2 accent-cyan-500"
                />
              )}
              {["text", "number", "date"].includes(def.field_type) && (
                <input type={def.field_type} name={name} defaultValue={(currentValue as string) ?? ""} className="input-field" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
