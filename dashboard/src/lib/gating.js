// ── Feature gating, quota checks, and warning utilities ──────────────────────
// [PLANS DISABLED] All functions stubbed to always return "allowed" for Early Access.
// Uncomment the original implementations when enabling paid plans.

// [PLANS DISABLED] Original imports used by gating logic
// import {
//   PLAN_CONFIG,
//   TOPUP_PACKS,
//   TRIAL_DM_LIMIT,
//   getPlanConfig,
//   planRequiredFor,
//   planRequiredForPage,
// } from "./plans";

// ── Page access ─────────────────────────────────────────────────────────────

// [PLANS DISABLED] Original:
// export function canAccessPage(userPlan, pageName, subscriptionStatus) {
//   if (subscriptionStatus === "expired" || subscriptionStatus === "cancelled") {
//     return ["home", "settings", "billing"].includes(pageName);
//   }
//   const config = getPlanConfig(userPlan);
//   return config.pages.includes(pageName);
// }
export function canAccessPage(/* userPlan, pageName, subscriptionStatus */) {
  return true; // [PLANS DISABLED] All pages accessible
}
// [/PLANS DISABLED]

// ── Feature access ──────────────────────────────────────────────────────────

// [PLANS DISABLED] Original:
// export function canUseFeature(userPlan, featureName) {
//   const config = getPlanConfig(userPlan);
//   const allowed = config.features.includes(featureName);
//   if (allowed) return { allowed: true };
//   const required = planRequiredFor(featureName);
//   return {
//     allowed: false,
//     requiredPlan: required?.plan || "gold",
//     requiredPlanName: required?.name || "Gold",
//     requiredPlanPrice: required?.price || 999,
//   };
// }
export function canUseFeature(/* userPlan, featureName */) {
  return { allowed: true }; // [PLANS DISABLED] All features unlocked
}
// [/PLANS DISABLED]

// ── DM quota check ──────────────────────────────────────────────────────────

// [PLANS DISABLED] Original:
// export function checkDmQuota(user) {
//   const sub = user.subscription || {};
//   const usage = user.usage || {};
//   const plan = sub.plan || "trial";
//   const status = sub.status || "trialing";
//   if (status === "expired" || status === "cancelled") {
//     return { allowed: false, reason: "subscription_expired" };
//   }
//   const config = getPlanConfig(plan);
//   const dmLimit = plan === "trial" ? TRIAL_DM_LIMIT : config.dmLimit;
//   const dmsSent = usage.dmsSentThisMonth || 0;
//   const topUpRemaining = usage.topUpDmsRemaining || 0;
//   if (dmsSent < dmLimit) return { allowed: true, source: "monthly" };
//   if (topUpRemaining > 0) return { allowed: true, source: "topup" };
//   return { allowed: false, reason: "quota_exceeded", dmsSent, dmLimit, topUpRemaining: 0 };
// }
export function checkDmQuota(/* user */) {
  return { allowed: true, source: "early_access" }; // [PLANS DISABLED] No quota limits
}
// [/PLANS DISABLED]

// ── Quota status (for display) ──────────────────────────────────────────────

// [PLANS DISABLED] Original:
// export function getQuotaStatus(user) {
//   const sub = user.subscription || {};
//   const usage = user.usage || {};
//   const plan = sub.plan || "trial";
//   const config = getPlanConfig(plan);
//   const dmLimit = plan === "trial" ? TRIAL_DM_LIMIT : config.dmLimit;
//   const dmsSent = usage.dmsSentThisMonth || 0;
//   const topUpRemaining = usage.topUpDmsRemaining || 0;
//   const totalAvailable = dmLimit + topUpRemaining;
//   const dmsRemaining = Math.max(0, totalAvailable - dmsSent);
//   const percentUsed = totalAvailable > 0 ? Math.round((dmsSent / totalAvailable) * 100) : 0;
//   return {
//     dmsSent, dmLimit, dmsRemaining, percentUsed, topUpRemaining,
//     isApproachingLimit: percentUsed >= 80,
//     isExhausted: dmsSent >= totalAvailable,
//     planDisplayLimit: config.dmLimitDisplay,
//   };
// }
export function getQuotaStatus(user) {
  const usage = user?.usage || {};
  return {
    dmsSent: usage.dmsSentThisMonth || 0,
    dmLimit: 999999,
    dmsRemaining: 999999,
    percentUsed: 0,
    topUpRemaining: 0,
    isApproachingLimit: false,
    isExhausted: false,
    planDisplayLimit: "Unlimited",
  }; // [PLANS DISABLED] Always unlimited
}
// [/PLANS DISABLED]

// ── Instagram account limit ─────────────────────────────────────────────────

// [PLANS DISABLED] Original:
// export function canConnectMoreAccounts(userPlan, connectedCount) {
//   const config = getPlanConfig(userPlan);
//   return {
//     allowed: connectedCount < config.instagramAccounts,
//     current: connectedCount,
//     max: config.instagramAccounts,
//   };
// }
export function canConnectMoreAccounts(_userPlan, connectedCount) {
  return {
    allowed: true, // [PLANS DISABLED] Unlimited accounts
    current: connectedCount,
    max: 999,
  };
}
// [/PLANS DISABLED]

// ── Trial warning ───────────────────────────────────────────────────────────

// [PLANS DISABLED] Original:
// export function getTrialWarning(user) {
//   const sub = user.subscription || {};
//   const plan = sub.plan || "trial";
//   if (plan !== "trial") return null;
//   const trialEndsAt = sub.trialEndsAt ? new Date(sub.trialEndsAt) : null;
//   if (!trialEndsAt) return null;
//   const now = new Date();
//   const daysLeft = Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24));
//   if (daysLeft < 0 || sub.status === "expired") {
//     return { type: "modal", message: "Your free trial has ended. Choose a plan to continue.", expired: true, daysLeft: 0 };
//   }
//   if (daysLeft <= 2) {
//     return { type: "banner", message: `Your trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Upgrade now to keep your automations running.`, expired: false, daysLeft };
//   }
//   return null;
// }
export function getTrialWarning(/* user */) {
  return null; // [PLANS DISABLED] No trial warnings
}
// [/PLANS DISABLED]

// ── DM quota warning ────────────────────────────────────────────────────────

// [PLANS DISABLED] Original:
// export function getDmQuotaWarning(user) {
//   const sub = user.subscription || {};
//   const plan = sub.plan || "trial";
//   const config = getPlanConfig(plan);
//   if (config.dmLimitDisplay === "Unlimited") {
//     const usage = user.usage || {};
//     const dmsSent = usage.dmsSentThisMonth || 0;
//     if (dmsSent < config.dmLimit * 0.95) return null;
//   }
//   const quota = getQuotaStatus(user);
//   if (quota.isExhausted) {
//     return { level: "critical", message: "You've reached your monthly DM limit. Top up or upgrade to keep automating.", percentUsed: 100, dmsSent: quota.dmsSent, dmLimit: quota.dmLimit, topUpRemaining: quota.topUpRemaining };
//   }
//   if (quota.isApproachingLimit) {
//     return { level: "warning", message: `You've used ${quota.dmsSent} of ${quota.planDisplayLimit} DMs this month.`, percentUsed: quota.percentUsed, dmsSent: quota.dmsSent, dmLimit: quota.dmLimit, topUpRemaining: quota.topUpRemaining };
//   }
//   return null;
// }
export function getDmQuotaWarning(/* user */) {
  return null; // [PLANS DISABLED] No quota warnings
}
// [/PLANS DISABLED]
