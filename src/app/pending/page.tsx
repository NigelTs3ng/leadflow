import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  call: "Call",
  email: "Email",
  whatsapp: "WhatsApp",
  meeting: "Meeting",
  site_visit: "Site visit",
  other: "Other",
};

interface PendingLeadFollowUp {
  id: string;
  action_type: string;
  planned_action: string | null;
  due_at: string | null;
  leads: {
    id: string;
    job_title: string | null;
    companies: { id: string; name: string } | null;
  } | null;
}

interface PendingSupplyFollowUp {
  id: string;
  action_type: string;
  planned_action: string | null;
  due_at: string | null;
  supply_companies: { id: string; name: string } | null;
}

interface PendingItem {
  key: string;
  href: string;
  title: string;
  subtitle: string;
  action_type: string;
  planned_action: string | null;
  due_at: string | null;
}

export default async function PendingItemsPage() {
  const [leadRes, supplyRes] = await Promise.all([
    supabase
      .from("follow_ups")
      .select("id, action_type, planned_action, due_at, leads(id, job_title, companies(id, name))")
      .eq("status", "pending"),
    supabase
      .from("supply_follow_ups")
      .select("id, action_type, planned_action, due_at, supply_companies(id, name)")
      .eq("status", "pending"),
  ]);

  if (leadRes.error || supplyRes.error) {
    return (
      <div className="glass-panel border-rose-500/30 bg-rose-500/[0.06] text-rose-200 p-4">
        Could not load pending items: {leadRes.error?.message || supplyRes.error?.message}
      </div>
    );
  }

  const leadItems = ((leadRes.data ?? []) as unknown as PendingLeadFollowUp[])
    .filter((f) => f.leads)
    .map((f): PendingItem => ({
      key: `lead-${f.id}`,
      href: `/leads/${f.leads!.id}`,
      title: f.leads!.job_title || "(no job title)",
      subtitle: f.leads!.companies?.name ?? "Unknown company",
      action_type: f.action_type,
      planned_action: f.planned_action,
      due_at: f.due_at,
    }));

  const supplyItems = ((supplyRes.data ?? []) as unknown as PendingSupplyFollowUp[])
    .filter((f) => f.supply_companies)
    .map((f): PendingItem => ({
      key: `supply-${f.id}`,
      href: `/supply-gen/${f.supply_companies!.id}`,
      title: f.supply_companies!.name,
      subtitle: "Supply Gen",
      action_type: f.action_type,
      planned_action: f.planned_action,
      due_at: f.due_at,
    }));

  const items = [...leadItems, ...supplyItems].sort((a, b) => {
    if (!a.due_at && !b.due_at) return 0;
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

  const now = Date.now();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 heading-gradient">Pending items</h1>

      <div className="space-y-3">
        {items.map((item) => {
          const isOverdue = item.due_at ? new Date(item.due_at).getTime() < now : false;
          return (
            <Link key={item.key} href={item.href} className="glass-card block p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-100 truncate">
                    {item.title} <span className="text-muted font-normal">— {item.subtitle}</span>
                  </p>
                  <p className="text-sm text-muted mt-1">
                    {ACTION_LABELS[item.action_type] ?? item.action_type}
                  </p>
                  {item.planned_action && <p className="text-sm text-slate-300 mt-1">{item.planned_action}</p>}
                </div>
                <span
                  className={`badge border shrink-0 ${
                    isOverdue
                      ? "border-rose-500/20 bg-rose-500/15 text-rose-300"
                      : "border-amber-500/20 bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {item.due_at ? format(new Date(item.due_at), "d MMM yyyy, HH:mm") : "No due date"}
                </span>
              </div>
            </Link>
          );
        })}
        {items.length === 0 && (
          <div className="glass-panel text-center py-16 text-muted border-dashed">
            No pending items — you&apos;re all caught up.
          </div>
        )}
      </div>
    </div>
  );
}
