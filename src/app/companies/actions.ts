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

export async function createCompany(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Company name is required.");

  const custom_fields = extractCustomFields(formData);

  const { data, error } = await supabase
    .from("companies")
    .insert({
      name,
      notes: String(formData.get("notes") ?? ""),
      custom_fields,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect(`/companies/${data.id}`);
}

export async function updateCompany(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Company name is required.");

  const custom_fields = extractCustomFields(formData);

  const { error } = await supabase
    .from("companies")
    .update({
      name,
      notes: String(formData.get("notes") ?? ""),
      custom_fields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/companies/${id}`);
  redirect(`/companies/${id}`);
}

export async function deleteCompany(id: string) {
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect("/");
}

export async function getCompanyFieldDefs() {
  return getFieldDefinitions("company");
}

// ---------------- Company sectors ----------------

function sectorFieldsFromForm(formData: FormData) {
  return {
    sector: String(formData.get("sector") ?? "construction"),
    local_workforce_count: Number(formData.get("local_workforce_count") ?? 0),
    s_pass_count: Number(formData.get("s_pass_count") ?? 0),
    prc_wp_count: Number(formData.get("prc_wp_count") ?? 0),
    nts_ol_wp_count: Number(formData.get("nts_ol_wp_count") ?? 0),
    malaysian_nas_wp_count: Number(formData.get("malaysian_nas_wp_count") ?? 0),
    higher_skilled_count: Number(formData.get("higher_skilled_count") ?? 0),
    mye_waiver: formData.get("mye_waiver") === "on",
    notes: String(formData.get("notes") ?? ""),
  };
}

export async function createCompanySector(companyId: string, formData: FormData) {
  const custom_fields = extractCustomFields(formData);

  const { error } = await supabase.from("company_sectors").insert({
    company_id: companyId,
    ...sectorFieldsFromForm(formData),
    custom_fields,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}`);
}

export async function updateCompanySector(id: string, companyId: string, formData: FormData) {
  const custom_fields = extractCustomFields(formData);

  const { error } = await supabase
    .from("company_sectors")
    .update({
      ...sectorFieldsFromForm(formData),
      custom_fields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}`);
}

export async function deleteCompanySector(id: string, companyId: string) {
  const { error } = await supabase.from("company_sectors").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}`);
}

export async function getCompanySectorFieldDefs() {
  return getFieldDefinitions("company_sector");
}
