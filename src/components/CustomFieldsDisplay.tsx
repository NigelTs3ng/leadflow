import { CustomFieldDefinition } from "@/lib/customFields";

export default function CustomFieldsDisplay({
  definitions,
  values,
}: {
  definitions: CustomFieldDefinition[];
  values?: Record<string, unknown> | null;
}) {
  if (definitions.length === 0) return null;
  const withValues = definitions.filter((d) => values?.[d.field_key] !== undefined);
  if (withValues.length === 0) return null;

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-3 border-t border-white/10 pt-3">
      {withValues.map((def) => {
        const v = values?.[def.field_key];
        const display = v === null || v === undefined || v === "" ? "—" : String(v);
        return (
          <div key={def.id}>
            <dt className="text-faint">{def.label}</dt>
            <dd
              className={`text-slate-200 font-medium ${
                def.field_type === "textarea" ? "whitespace-pre-wrap" : ""
              }`}
            >
              {display}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
