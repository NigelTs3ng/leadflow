"use server";

import { supabase } from "@/lib/supabase";
import { getFieldDefinitions } from "@/lib/customFields";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function extractCustomFields(formData: FormData, prefix = "cf_"): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith(prefix)) {
      const fieldKey = key.slice(prefix.length);
      result[fieldKey] = value === "" ? null : value;
    }
  }
  return result;
}

export async function createSupplyCompany(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Company name is required.");

  const custom_fields = extractCustomFields(formData);

  const { data, error } = await supabase
    .from("supply_companies")
    .insert({
      name,
      country: String(formData.get("country") ?? "").trim(),
      contact_person: String(formData.get("contact_person") ?? "").trim(),
      contact_number: String(formData.get("contact_number") ?? "").trim(),
      contact_email: String(formData.get("contact_email") ?? "").trim(),
      notes: String(formData.get("notes") ?? ""),
      custom_fields,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/supply-gen");
  redirect(`/supply-gen/${data.id}`);
}

export async function updateSupplyCompany(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Company name is required.");

  const custom_fields = extractCustomFields(formData);

  const { error } = await supabase
    .from("supply_companies")
    .update({
      name,
      country: String(formData.get("country") ?? "").trim(),
      contact_person: String(formData.get("contact_person") ?? "").trim(),
      contact_number: String(formData.get("contact_number") ?? "").trim(),
      contact_email: String(formData.get("contact_email") ?? "").trim(),
      notes: String(formData.get("notes") ?? ""),
      custom_fields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/supply-gen");
  revalidatePath(`/supply-gen/${id}`);
  redirect(`/supply-gen/${id}`);
}

export async function deleteSupplyCompany(id: string) {
  const { error } = await supabase.from("supply_companies").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/supply-gen");
  redirect("/supply-gen");
}

export async function getSupplyCompanyFieldDefs() {
  return getFieldDefinitions("supply_company");
}

// ---------------- Supply Gen follow ups ----------------

export async function createSupplyFollowUp(supplyCompanyId: string, formData: FormData) {
  const custom_fields = extractCustomFields(formData);

  const { error } = await supabase.from("supply_follow_ups").insert({
    supply_company_id: supplyCompanyId,
    action_type: String(formData.get("action_type") ?? "call"),
    planned_action: String(formData.get("planned_action") ?? ""),
    action_taken: String(formData.get("action_taken") ?? ""),
    status: String(formData.get("status") ?? "pending"),
    due_at: formData.get("due_at") ? new Date(String(formData.get("due_at"))).toISOString() : null,
    completed_at: String(formData.get("status")) === "done" ? new Date().toISOString() : null,
    custom_fields,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/supply-gen/${supplyCompanyId}`);
}

export async function updateSupplyFollowUp(id: string, supplyCompanyId: string, formData: FormData) {
  const custom_fields = extractCustomFields(formData);
  const status = String(formData.get("status") ?? "pending");

  const { error } = await supabase
    .from("supply_follow_ups")
    .update({
      action_type: String(formData.get("action_type") ?? "call"),
      planned_action: String(formData.get("planned_action") ?? ""),
      action_taken: String(formData.get("action_taken") ?? ""),
      status,
      due_at: formData.get("due_at") ? new Date(String(formData.get("due_at"))).toISOString() : null,
      completed_at: status === "done" ? new Date().toISOString() : null,
      custom_fields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/supply-gen/${supplyCompanyId}`);
}

export async function deleteSupplyFollowUp(id: string, supplyCompanyId: string) {
  const { error } = await supabase.from("supply_follow_ups").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/supply-gen/${supplyCompanyId}`);
}

export async function getSupplyFollowUpFieldDefs() {
  return getFieldDefinitions("supply_follow_up");
}
