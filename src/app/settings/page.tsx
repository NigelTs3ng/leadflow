import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6 heading-gradient">Settings</h1>
      <div className="space-y-3">
        <Link href="/settings/fields" className="glass-card block p-4">
          <p className="font-medium text-slate-100">Custom fields</p>
          <p className="text-sm text-muted">
            Add extra fields to Company, Lead, or Follow-up forms. New fields are backfilled onto
            existing records automatically.
          </p>
        </Link>
        <Link href="/settings/rates" className="glass-card block p-4">
          <p className="font-medium text-slate-100">MOM quota &amp; levy rates</p>
          <p className="text-sm text-muted">
            Edit the sector quota percentages, S Pass sub-quota %, and levy rates used by the
            quota calculator.
          </p>
        </Link>
      </div>
    </div>
  );
}
