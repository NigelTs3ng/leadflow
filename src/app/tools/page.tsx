const TOOLS: {
  label: string;
  description: string;
  href: string;
}[] = [
  {
    label: "MOM website",
    description: "Ministry of Manpower — passes, permits, and general guidance.",
    href: "https://www.mom.gov.sg",
  },
  {
    label: "MOM foreign worker quota calculator",
    description: "Official calculator to cross-check quota figures against MOM's numbers.",
    href: "https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-worker/foreign-worker-levy/calculate-foreign-worker-quota",
  },
  {
    label: "Police report — worker absconded / missing",
    description: "Lodge a police report online via SPF e-Services.",
    href: "https://www.police.gov.sg/e-services/lodge-police-report",
  },
  {
    label: "ACRA BizFile+ — check UEN",
    description: "Look up a company's UEN and business registration details.",
    href: "https://www.bizfile.gov.sg",
  },
  {
    label: "MOM — submit quarterly referral information",
    description: "Quarterly referral information submission form.",
    href: "https://form.gov.sg/6728926540161e8d5bc1fd03",
  },
];

export const dynamic = "force-dynamic";

export default function ToolsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 heading-gradient">Tools</h1>
      <p className="text-sm text-muted mb-6">
        Quick links to the external pages you use most. Each opens in a new tab.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TOOLS.map((tool) => (
          <a
            key={tool.label}
            href={tool.href}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card block p-4"
          >
            <h2 className="font-semibold text-slate-100">{tool.label}</h2>
            <p className="text-sm text-muted mt-1">{tool.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
