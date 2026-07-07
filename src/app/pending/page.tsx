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

interface PendingFollowUp {
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

export default async function PendingItemsPage() {
  const { data: followUps, error } = await supabase
    .from("follow_ups")
    .select("id, action_type, planned_action, due_at, leads(id, job_title, companies(id, name))")
    .eq("status", "pending")
    .order("due_at", { ascending: true, nullsFirst: false });

  if (error) {
    return (
      <div className="glass-panel border-rose-500/30 bg-rose-500/[0.06] text-rose-200 p-4">
        Could not load pending items: {error.message}
      </div>
    );
  }

  const items = (followUps ?? []) as unknown as PendingFollowUp[];
  const now = Date.now();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 heading-gradient">Pending items</h1>

      <div className="space-y-3">
        {items
          .filter((f) => f.leads)
          .map((f) => {
            const lead = f.leads!;
            const isOverdue = f.due_at ? new Date(f.due_at).getTime() < now : false;
            return (
              <Link key={f.id} href={`/leads/${lead.id}`} className="glass-card block p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-100 truncate">
                      {lead.job_title || "(no job title)"}{" "}
                      <span className="text-muted font-normal">— {lead.companies?.name ?? "Unknown company"}</span>
                    </p>
                    <p className="text-sm text-muted mt-1">
                      {ACTION_LABELS[f.action_type] ?? f.action_type}
                    </p>
                    {f.planned_action && <p className="text-sm text-slate-300 mt-1">{f.planned_action}</p>}
                  </div>
                  <span
                    className={`badge border shrink-0 ${
                      isOverdue
                        ? "border-rose-500/20 bg-rose-500/15 text-rose-300"
                        : "border-amber-500/20 bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {f.due_at ? format(new Date(f.due_at), "d MMM yyyy, HH:mm") : "No due date"}
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
