import { supabase, EntityType } from "@/lib/supabase";

export interface CustomFieldDefinition {
  id: string;
  entity_type: EntityType;
  field_key: string;
  label: string;
  field_type: "text" | "textarea" | "number" | "date" | "select" | "checkbox";
  options: string[] | null;
  sort_order: number;
}

const TABLE_BY_ENTITY: Record<EntityType, string> = {
  company: "companies",
  company_sector: "company_sectors",
  lead: "leads",
  follow_up: "follow_ups",
  supply_company: "supply_companies",
  supply_follow_up: "supply_follow_ups",
};

export async function getFieldDefinitions(entityType: EntityType): Promise<CustomFieldDefinition[]> {
  const { data, error } = await supabase
    .from("custom_field_definitions")
    .select("*")
    .eq("entity_type", entityType)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CustomFieldDefinition[];
}

export async function getAllFieldDefinitions(): Promise<CustomFieldDefinition[]> {
  const { data, error } = await supabase
    .from("custom_field_definitions")
    .select("*")
    .order("entity_type", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CustomFieldDefinition[];
}

function slugifyKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

/**
 * Creates a new custom field definition AND backfills every existing row of that
 * entity's table so the key exists (set to null) in their custom_fields jsonb.
 * This is what makes new fields show up ready-to-edit on records created before
 * the field existed, per your requirement.
 */
export async function createFieldDefinition(input: {
  entity_type: EntityType;
  label: string;
  field_type: CustomFieldDefinition["field_type"];
  options?: string[];
}) {
  const field_key = slugifyKey(input.label);
  if (!field_key) throw new Error("Please provide a valid label.");

  const { data: existing } = await supabase
    .from("custom_field_definitions")
    .select("id")
    .eq("entity_type", input.entity_type)
    .eq("field_key", field_key)
    .maybeSingle();
  if (existing) throw new Error(`A field with key "${field_key}" already exists for ${input.entity_type}.`);

  const { data: maxRow } = await supabase
    .from("custom_field_definitions")
    .select("sort_order")
    .eq("entity_type", input.entity_type)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSort = (maxRow?.sort_order ?? -1) + 1;

  const { error: insertError } = await supabase.from("custom_field_definitions").insert({
    entity_type: input.entity_type,
    field_key,
    label: input.label,
    field_type: input.field_type,
    options: input.field_type === "select" ? input.options ?? [] : null,
    sort_order: nextSort,
  });
  if (insertError) throw new Error(insertError.message);

  // Backfill existing rows: add the key with a null value if it's not already present.
  const table = TABLE_BY_ENTITY[input.entity_type];
  const { error: rpcError } = await supabase.rpc("backfill_custom_field", {
    target_table: table,
    key_name: field_key,
  });
  if (rpcError) {
    // Non-fatal: the field still works going forward (missing keys just render blank).
    console.warn("Backfill RPC failed (field still usable):", rpcError.message);
  }

  return field_key;
}

export async function deleteFieldDefinition(id: string) {
  const { error } = await supabase.from("custom_field_definitions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
