import PlanConfig from "@/models/PlanConfig";
import dbConnect from "@/lib/dbConnect";

let cachedConfig = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getPlanConfig() {
  const now = Date.now();
  if (cachedConfig && now - cacheTimestamp < CACHE_TTL) return cachedConfig;
  await dbConnect();
  cachedConfig = await PlanConfig.getConfig();
  cacheTimestamp = now;
  return cachedConfig;
}

export function invalidatePlanConfigCache() {
  cachedConfig = null;
  cacheTimestamp = 0;
}

/**
 * Get a specific plan by slug, searching across all account types.
 * Also checks legacy slug mapping for backward compatibility.
 */
export async function getPlan(planSlug) {
  const config = await getPlanConfig();

  // Check legacy mapping first (silver -> business_essentials, etc.)
  const legacyMap = config.legacyPlanMap || {};
  const resolvedSlug = legacyMap[planSlug] || planSlug;

  // Search across all account types
  for (const typePlans of Object.values(config.plans || {})) {
    for (const plan of Object.values(typePlans || {})) {
      if (plan.slug === resolvedSlug) return plan;
    }
  }
  return null;
}

/**
 * Get the DM limit for a plan slug.
 * Works with both new slugs (creator_growth) and old slugs (silver, gold, platinum).
 */
export async function getDmLimit(planSlug) {
  if (planSlug === "early_access" || planSlug === "trial") {
    const config = await getPlanConfig();
    const limit = config.earlyAccess?.dmLimit;
    return limit === -1 ? Infinity : (limit || Infinity);
  }
  const plan = await getPlan(planSlug);
  if (!plan) return 10000; // safe default
  return plan.dmLimit === -1 ? Infinity : plan.dmLimit;
}

export async function getMaxAccounts(planSlug) {
  if (planSlug === "early_access" || planSlug === "trial") {
    const config = await getPlanConfig();
    return config.earlyAccess?.maxAccounts || 5;
  }
  const plan = await getPlan(planSlug);
  return plan?.maxAccounts || 1;
}

/**
 * Get plans formatted for display, filtered by account type.
 * Falls back to creator if the type doesn't exist.
 */
export async function getPlansForDisplay(accountType = "creator") {
  const config = await getPlanConfig();
  const typePlans = config.plans?.[accountType] || config.plans?.creator || {};
  return Object.values(typePlans)
    .filter((p) => p.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((plan) => ({
      ...plan,
      dmLimitDisplay: plan.dmLimit === -1 ? "Unlimited" : plan.dmLimit.toLocaleString("en-IN"),
      priceDisplay: `${config.display?.currencySymbol || "₹"}${plan.price.toLocaleString("en-IN")}`,
      featureList: Object.entries(plan.features || {}).filter(([, v]) => v).map(([k]) => k),
    }));
}
