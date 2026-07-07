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

export async function createLead(formData: FormData) {
  const company_id = String(formData.get("company_id") ?? "");
  if (!company_id) throw new Error("company_id is required.");

  const custom_fields = extractCustomFields(formData);

  const { data, error } = await supabase
    .from("leads")
    .insert({
      company_id,
      job_title: String(formData.get("job_title") ?? ""),
      job_description: String(formData.get("job_description") ?? ""),
      workers_needed: formData.get("workers_needed") ? Number(formData.get("workers_needed")) : null,
      worker_type: String(formData.get("worker_type") ?? ""),
      pass_type: String(formData.get("pass_type") ?? "Work Permit (NTS)"),
      pay_offered: String(formData.get("pay_offered") ?? "").trim() || null,
      pay_period: String(formData.get("pay_period") ?? "monthly"),
      status: String(formData.get("status") ?? "unfilled"),
      custom_fields,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/companies/${company_id}`);
  redirect(`/leads/${data.id}`);
}

export async function updateLead(id: string, companyId: string, formData: FormData) {
  const custom_fields = extractCustomFields(formData);

  const { error } = await supabase
    .from("leads")
    .update({
      job_title: String(formData.get("job_title") ?? ""),
      job_description: String(formData.get("job_description") ?? ""),
      workers_needed: formData.get("workers_needed") ? Number(formData.get("workers_needed")) : null,
      worker_type: String(formData.get("worker_type") ?? ""),
      pass_type: String(formData.get("pass_type") ?? "Work Permit (NTS)"),
      pay_offered: String(formData.get("pay_offered") ?? "").trim() || null,
      pay_period: String(formData.get("pay_period") ?? "monthly"),
      status: String(formData.get("status") ?? "unfilled"),
      custom_fields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/companies/${companyId}`);
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}`);
}

export async function deleteLead(id: string, companyId: string) {
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}`);
}

export async function getLeadFieldDefs() {
  return getFieldDefinitions("lead");
}

// ---------------- Follow ups ----------------

export async function createFollowUp(leadId: string, formData: FormData) {
  const custom_fields = extractCustomFields(formData);

  const { error } = await supabase.from("follow_ups").insert({
    lead_id: leadId,
    action_type: String(formData.get("action_type") ?? "call"),
    planned_action: String(formData.get("planned_action") ?? ""),
    action_taken: String(formData.get("action_taken") ?? ""),
    status: String(formData.get("status") ?? "pending"),
    due_at: formData.get("due_at") ? new Date(String(formData.get("due_at"))).toISOString() : null,
    completed_at:
      String(formData.get("status")) === "done" ? new Date().toISOString() : null,
    custom_fields,
  });

  if (error) throw new Error(error.message);

  // touch last_contacted_at on the lead if this follow-up records an action already taken
  if (String(formData.get("action_taken") ?? "").trim().length > 0) {
    await supabase.from("leads").update({ last_contacted_at: new Date().toISOString() }).eq("id", leadId);
  }

  revalidatePath(`/leads/${leadId}`);
}

export async function updateFollowUp(id: string, leadId: string, formData: FormData) {
  const custom_fields = extractCustomFields(formData);
  const status = String(formData.get("status") ?? "pending");

  const { error } = await supabase
    .from("follow_ups")
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
  revalidatePath(`/leads/${leadId}`);
}

export async function deleteFollowUp(id: string, leadId: string) {
  const { error } = await supabase.from("follow_ups").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

export async function getFollowUpFieldDefs() {
  return getFieldDefinitions("follow_up");
}
