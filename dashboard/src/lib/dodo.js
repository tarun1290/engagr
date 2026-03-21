// [PAYMENTS DISABLED] Uncomment when ready to enable Dodo Payments
// import DodoPayments from "dodopayments";
//
// let dodo = null;
//
// export function getDodo() {
//   if (dodo) return dodo;
//   if (!process.env.DODO_PAYMENTS_API_KEY) {
//     throw new Error("Dodo Payments is not configured. Set DODO_PAYMENTS_API_KEY in your environment variables.");
//   }
//   dodo = new DodoPayments({
//     bearerToken: process.env.DODO_PAYMENTS_API_KEY,
//     environment: process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode",
//   });
//   return dodo;
// }
//
// export default getDodo;
// [/PAYMENTS DISABLED]

// Stub — returns null so imports don't crash
export function getDodo() {
  console.warn("[PAYMENTS DISABLED] getDodo() called but payments are not enabled.");
  return null;
}
export default getDodo;

// ── Dodo product ID mapping ─────────────────────────────────────────────
// Products are created in the Dodo Dashboard, not via API.
// Store product IDs as environment variables.
export const DODO_PRODUCTS = {
  silver: process.env.DODO_SILVER_PRODUCT_ID,
  gold: process.env.DODO_GOLD_PRODUCT_ID,
  platinum: process.env.DODO_PLATINUM_PRODUCT_ID,
  topup_200: process.env.DODO_TOPUP_200_PRODUCT_ID,
  topup_500: process.env.DODO_TOPUP_500_PRODUCT_ID,
  topup_1000: process.env.DODO_TOPUP_1000_PRODUCT_ID,
};

// ── Plan + top-up config re-exports (keeps existing imports working) ────
import { PLAN_CONFIG, TOPUP_PACKS as _TOPUP_PACKS, TRIAL_DM_LIMIT as _TRIAL_DM_LIMIT, TRIAL_DAYS as _TRIAL_DAYS } from "./plans";

// PLANS object shaped for display and lookup
export const PLANS = Object.fromEntries(
  Object.entries(PLAN_CONFIG)
    .filter(([key]) => key !== "trial")
    .map(([key, cfg]) => [
      key,
      {
        name: cfg.name,
        amount: cfg.pricePaise,
        currency: "INR",
        period: "monthly",
        interval: 1,
        dmLimit: cfg.dmLimit,
        description: `${cfg.dmLimitDisplay} DMs/month`,
      },
    ])
);

export const TOPUP_PACKS = Object.fromEntries(
  Object.entries(_TOPUP_PACKS).map(([key, pack]) => [
    key,
    { dms: pack.dms, amount: pack.pricePaise, label: pack.label },
  ])
);

export const TRIAL_DM_LIMIT = _TRIAL_DM_LIMIT;
export const TRIAL_DAYS = _TRIAL_DAYS;
