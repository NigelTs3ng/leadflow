// Core MOM Work Permit / S Pass quota + levy logic.
// Formulas follow publicly documented MOM methodology:
//  - Percent sectors (services/manufacturing):  Max MW = LocalWorkforce x quota% / (1 - quota%)
//  - Ratio sectors (construction/marine/process default here): Max MW = LocalWorkforce x ratio
//    NOTE: construction/marine/process quota is actually governed by Man-Year Entitlement (MYE),
//    which is allocated per-project/tender by BCA/MOM, not purely a function of local headcount.
//    The ratio-based figure here is a *planning estimate* only — always confirm real-time balance
//    on Work Permit Online (WPOL).
//  - S Pass sub-quota = s_pass_quota_percent% x (TotalWorkforce + 1), rounded down, and it counts
//    *within* (not on top of) the overall foreign worker quota.

export type SectorKey = "construction" | "manufacturing" | "services" | "marine" | "process";

export interface SectorConfig {
  label: string;
  quota_model: "ratio" | "percent";
  foreign_to_local_ratio?: number;
  quota_percent?: number;
  s_pass_quota_percent: number;
  levy: Record<string, number>;
}

export interface MomConfig {
  sectors: Record<string, SectorConfig>;
  local_qualifying_salary: number;
  s_pass_min_salary: number;
  notes?: string;
  last_verified?: string;
}

export interface CompanyForQuota {
  sector: string;
  local_workforce_count: number;
  s_pass_count: number;
  prc_wp_count: number;
  nts_ol_wp_count: number;
  malaysian_nas_wp_count: number;
  higher_skilled_count: number;
  mye_waiver: boolean;
}

export interface QuotaResult {
  sectorLabel: string;
  quotaModel: "ratio" | "percent";
  maxForeignWorkers: number; // WP + S Pass combined ceiling
  currentForeignWorkers: number;
  remainingForeignSlots: number;
  sPassQuota: number;
  remainingSPassSlots: number;
  totalWorkforce: number;
  totalWorkPermitHolders: number;
  isOverQuota: boolean;
  isOverSPassQuota: boolean;
  estimatedMonthlyLevy: number;
  levyBreakdown: { label: string; count: number; rate: number; subtotal: number }[];
  warnings: string[];
}

export function calculateQuota(company: CompanyForQuota, config: MomConfig): QuotaResult {
  const warnings: string[] = [];
  const sector = config.sectors[company.sector];

  if (!sector) {
    warnings.push(`Unknown sector "${company.sector}" — using construction defaults.`);
  }
  const sc = sector ?? config.sectors["construction"];

  const local = Math.max(0, company.local_workforce_count || 0);
  const prcWp = Math.max(0, company.prc_wp_count || 0);
  const ntsOlWp = Math.max(0, company.nts_ol_wp_count || 0);
  const malaysianNasWp = Math.max(0, company.malaysian_nas_wp_count || 0);
  const wp = prcWp + ntsOlWp + malaysianNasWp;
  const sp = Math.max(0, company.s_pass_count || 0);
  const higherSkilled = Math.max(0, Math.min(company.higher_skilled_count || 0, wp));
  const basicSkilled = wp - higherSkilled;

  const totalWorkforce = local + wp; // MOM counts issued WP holders into total workforce

  let maxForeignWorkers = 0;
  if (sc.quota_model === "ratio") {
    maxForeignWorkers = Math.floor(local * (sc.foreign_to_local_ratio ?? 0));
    warnings.push(
      "This sector's real quota is controlled by Man-Year Entitlement (MYE), allocated per project/tender — this ratio figure is a planning estimate. Check Work Permit Online (WPOL) for your actual live balance."
    );
  } else {
    const q = (sc.quota_percent ?? 0) / 100;
    maxForeignWorkers = Math.floor((local * q) / (1 - q));
  }

  const currentForeignWorkers = wp + sp;
  const remainingForeignSlots = maxForeignWorkers - currentForeignWorkers;

  const sPassQuota = Math.floor((sc.s_pass_quota_percent / 100) * (totalWorkforce + 1));
  const remainingSPassSlots = sPassQuota - sp;

  if (local > 0 && local * (config.local_qualifying_salary ?? 0) === 0) {
    // no-op placeholder for future LQS-per-employee validation
  }

  let estimatedMonthlyLevy = 0;
  const levyBreakdown: QuotaResult["levyBreakdown"] = [];

  if (company.mye_waiver && sc.levy["mye_waiver_basic_skilled"] !== undefined) {
    const basicRate = sc.levy["mye_waiver_basic_skilled"];
    const higherRate = sc.levy["mye_waiver_higher_skilled"] ?? sc.levy["higher_skilled"];
    levyBreakdown.push({ label: "Basic-Skilled WP (MYE waiver)", count: basicSkilled, rate: basicRate, subtotal: basicSkilled * basicRate });
    levyBreakdown.push({ label: "Higher-Skilled WP (MYE waiver)", count: higherSkilled, rate: higherRate, subtotal: higherSkilled * higherRate });
  } else {
    const basicRate = sc.levy["basic_skilled"] ?? 0;
    const higherRate = sc.levy["higher_skilled"] ?? 0;
    levyBreakdown.push({ label: "Basic-Skilled WP", count: basicSkilled, rate: basicRate, subtotal: basicSkilled * basicRate });
    levyBreakdown.push({ label: "Higher-Skilled WP", count: higherSkilled, rate: higherRate, subtotal: higherSkilled * higherRate });
  }
  estimatedMonthlyLevy = levyBreakdown.reduce((sum, r) => sum + r.subtotal, 0);

  const isOverQuota = remainingForeignSlots < 0;
  const isOverSPassQuota = remainingSPassSlots < 0;
  if (isOverQuota) warnings.push("Over the estimated overall foreign worker quota.");
  if (isOverSPassQuota) warnings.push("Over the S Pass sub-quota.");

  return {
    sectorLabel: sc.label,
    quotaModel: sc.quota_model,
    maxForeignWorkers,
    currentForeignWorkers,
    remainingForeignSlots,
    sPassQuota,
    remainingSPassSlots,
    totalWorkforce,
    totalWorkPermitHolders: wp,
    isOverQuota,
    isOverSPassQuota,
    estimatedMonthlyLevy,
    levyBreakdown,
    warnings,
  };
}

export async function getMomConfig(): Promise<MomConfig> {
  const { supabase } = await import("@/lib/supabase");
  const { data, error } = await supabase.from("mom_settings").select("config").eq("id", 1).single();
  if (error || !data) {
    throw new Error("Could not load MOM settings from Supabase: " + error?.message);
  }
  return data.config as MomConfig;
}
