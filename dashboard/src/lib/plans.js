// ── Single source of truth for all plan limits, features, and pricing ────────
// Every gating check references this config. Never hardcode plan rules elsewhere.

export const PLAN_CONFIG = {
  trial: {
    name: "Free Trial",
    price: 0,
    pricePaise: 0,
    dmLimit: 50,
    dmLimitDisplay: "50",
    instagramAccounts: 1,
    automationLimit: 1,
    topUpEnabled: false,
    webhookPriority: 0,
    features: [
      "comment_to_dm",
      "smart_presets",
      "reel_share",
    ],
    pages: ["home", "automation", "settings", "billing"],
  },

  silver: {
    name: "Silver",
    price: 499,
    pricePaise: 49900,
    dmLimit: 500,
    dmLimitDisplay: "500",
    instagramAccounts: 1,
    automationLimit: Infinity,
    topUpEnabled: true,
    webhookPriority: 1,
    features: [
      "comment_to_dm",
      "smart_presets",
      "reel_share",
    ],
    pages: ["home", "automation", "settings", "billing"],
  },

  gold: {
    name: "Gold",
    price: 999,
    pricePaise: 99900,
    dmLimit: 10000,
    dmLimitDisplay: "Unlimited",
    instagramAccounts: 1,
    automationLimit: Infinity,
    topUpEnabled: false,
    webhookPriority: 2,
    features: [
      "comment_to_dm",
      "smart_presets",
      "reel_share",
      "follow_gate",
      "mention_detection",
      "contacts",
      "activity_log",
      "csv_export",
    ],
    pages: ["home", "automation", "contacts", "activity", "settings", "billing"],
  },

  platinum: {
    name: "Platinum",
    price: 1499,
    pricePaise: 149900,
    dmLimit: 50000,
    dmLimitDisplay: "Unlimited",
    instagramAccounts: 5,
    automationLimit: Infinity,
    topUpEnabled: false,
    webhookPriority: 3,
    features: [
      "comment_to_dm",
      "smart_presets",
      "reel_share",
      "follow_gate",
      "mention_detection",
      "contacts",
      "activity_log",
      "csv_export",
      "api_access",
      "white_label",
      "advanced_analytics",
      "onboarding_wizard",
    ],
    pages: [
      "home",
      "automation",
      "contacts",
      "activity",
      "analytics",
      "api_keys",
      "settings",
      "billing",
    ],
  },
};

export const TOPUP_PACKS = {
  200: { dms: 200, price: 149, pricePaise: 14900, label: "200 DMs — ₹149" },
  500: { dms: 500, price: 299, pricePaise: 29900, label: "500 DMs — ₹299" },
  1000: { dms: 1000, price: 499, pricePaise: 49900, label: "1,000 DMs — ₹499" },
};

export const TRIAL_DM_LIMIT = 50;
export const TRIAL_DAYS = 7;

// Ordered list for upgrade/downgrade comparison
export const PLAN_ORDER = ["trial", "silver", "gold", "platinum"];

export function getPlanConfig(planName) {
  return PLAN_CONFIG[planName] || PLAN_CONFIG.trial;
}

export function isPlanUpgrade(currentPlan, newPlan) {
  return PLAN_ORDER.indexOf(newPlan) > PLAN_ORDER.indexOf(currentPlan);
}

export function isPlanDowngrade(currentPlan, newPlan) {
  return PLAN_ORDER.indexOf(newPlan) < PLAN_ORDER.indexOf(currentPlan);
}

// Find the cheapest plan that unlocks a feature
export function planRequiredFor(featureName) {
  for (const planKey of PLAN_ORDER) {
    const config = PLAN_CONFIG[planKey];
    if (config.features.includes(featureName)) {
      return { plan: planKey, name: config.name, price: config.price };
    }
  }
  return null;
}

// Find the cheapest plan that unlocks a page
export function planRequiredForPage(pageName) {
  for (const planKey of PLAN_ORDER) {
    const config = PLAN_CONFIG[planKey];
    if (config.pages.includes(pageName)) {
      return { plan: planKey, name: config.name, price: config.price };
    }
  }
  return null;
}
