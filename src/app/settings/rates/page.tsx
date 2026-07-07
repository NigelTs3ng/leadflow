import { getMomConfigRaw, updateMomConfig } from "@/app/settings/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MomRatesPage() {
  const config = await getMomConfigRaw();

  return (
    <div className="max-w-2xl">
      <Link href="/settings" className="link-back">
        ← Back to settings
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-2 heading-gradient">MOM quota &amp; levy rates</h1>
      <p className="text-sm text-muted mb-6">
        This raw JSON drives the quota calculator on each company page. Edit the numbers to match
        the latest figures from{" "}
        <a
          href="https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-worker/foreign-worker-levy/calculate-foreign-worker-quota"
          target="_blank"
          className="text-cyan-400 underline hover:text-cyan-300"
        >
          mom.gov.sg
        </a>
        . Ratio-based sectors (construction, marine, process) are really governed by Man-Year
        Entitlement, not a pure ratio — treat that figure as a planning estimate only.
      </p>

      <form action={updateMomConfig} className="space-y-4">
        <textarea
          name="config_json"
          defaultValue={JSON.stringify(config, null, 2)}
          rows={28}
          spellCheck={false}
          className="input-field w-full font-mono text-xs p-4"
        />
        <button type="submit" className="btn-primary">
          Save rates
        </button>
      </form>
    </div>
  );
}
