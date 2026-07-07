"use server";

import { supabase } from "@/lib/supabase";
import { createFieldDefinition, deleteFieldDefinition, getAllFieldDefinitions } from "@/lib/customFields";
import { EntityType } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function addCustomField(formData: FormData) {
  const entity_type = String(formData.get("entity_type")) as EntityType;
  const label = String(formData.get("label") ?? "").trim();
  const field_type = String(formData.get("field_type") ?? "text") as
    | "text"
    | "textarea"
    | "number"
    | "date"
    | "select"
    | "checkbox";
  const optionsRaw = String(formData.get("options") ?? "");
  const options = optionsRaw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (!label) throw new Error("Field label is required.");

  await createFieldDefinition({ entity_type, label, field_type, options });
  revalidatePath("/settings/fields");
  revalidatePath("/");
}

export async function removeCustomField(id: string) {
  await deleteFieldDefinition(id);
  revalidatePath("/settings/fields");
  revalidatePath("/");
}

export async function listCustomFields() {
  return getAllFieldDefinitions();
}

export async function getMomConfigRaw() {
  const { data, error } = await supabase.from("mom_settings").select("config").eq("id", 1).single();
  if (error) throw new Error(error.message);
  return data.config;
}

export async function updateMomConfig(formData: FormData) {
  const raw = String(formData.get("config_json") ?? "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("That's not valid JSON — please fix the syntax and try again.");
  }
  const { error } = await supabase
    .from("mom_settings")
    .update({ config: parsed, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/rates");
  revalidatePath("/");
}
