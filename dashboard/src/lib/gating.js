// ── Feature gating, quota checks, and warning utilities ──────────────────────
// All functions are pure (no DB calls) — they operate on user/plan data passed in.

import {
  PLAN_CONFIG,
  TOPUP_PACKS,
  TRIAL_DM_LIMIT,
  getPlanConfig,
  planRequiredFor,
  planRequiredForPage,
} from "./plans";

// ── Page access ─────────────────────────────────────────────────────────────

export function canAccessPage(userPlan, pageName, subscriptionStatus) {
  // Expired users can only access home, settings, billing
  if (subscriptionStatus === "expired" || subscriptionStatus === "cancelled") {
    return ["home", "settings", "billing"].includes(pageName);
  }
  const config = getPlanConfig(userPlan);
  return config.pages.includes(pageName);
}

// ── Feature access ──────────────────────────────────────────────────────────

export function canUseFeature(userPlan, featureName) {
  const config = getPlanConfig(userPlan);
  const allowed = config.features.includes(featureName);

  if (allowed) {
    return { allowed: true };
  }

  // Find which plan unlocks this feature
  const required = planRequiredFor(featureName);
  return {
    allowed: false,
    requiredPlan: required?.plan || "gold",
    requiredPlanName: required?.name || "Gold",
    requiredPlanPrice: required?.price || 999,
  };
}

// ── DM quota check ──────────────────────────────────────────────────────────
// Pass the full user document (or { subscription, usage } subdocs).

export function checkDmQuota(user) {
  const sub = user.subscription || {};
  const usage = user.usage || {};
  const plan = sub.plan || "trial";
  const status = sub.status || "trialing";

  // Expired / cancelled → blocked
  if (status === "expired" || status === "cancelled") {
    return { allowed: false, reason: "subscription_expired" };
  }

  const config = getPlanConfig(plan);
  const dmLimit = plan === "trial" ? TRIAL_DM_LIMIT : config.dmLimit;
  const dmsSent = usage.dmsSentThisMonth || 0;
  const topUpRemaining = usage.topUpDmsRemaining || 0;

  // Under monthly limit
  if (dmsSent < dmLimit) {
    return { allowed: true, source: "monthly" };
  }

  // Monthly exhausted, but have top-ups
  if (topUpRemaining > 0) {
    return { allowed: true, source: "topup" };
  }

  // Both exhausted
  return {
    allowed: false,
    reason: "quota_exceeded",
    dmsSent,
    dmLimit,
    topUpRemaining: 0,
  };
}

// ── Quota status (for display) ──────────────────────────────────────────────

export function getQuotaStatus(user) {
  const sub = user.subscription || {};
  const usage = user.usage || {};
  const plan = sub.plan || "trial";
  const config = getPlanConfig(plan);

  const dmLimit = plan === "trial" ? TRIAL_DM_LIMIT : config.dmLimit;
  const dmsSent = usage.dmsSentThisMonth || 0;
  const topUpRemaining = usage.topUpDmsRemaining || 0;
  const totalAvailable = dmLimit + topUpRemaining;
  const dmsRemaining = Math.max(0, totalAvailable - dmsSent);
  const percentUsed = totalAvailable > 0 ? Math.round((dmsSent / totalAvailable) * 100) : 0;

  return {
    dmsSent,
    dmLimit,
    dmsRemaining,
    percentUsed,
    topUpRemaining,
    isApproachingLimit: percentUsed >= 80,
    isExhausted: dmsSent >= totalAvailable,
    planDisplayLimit: config.dmLimitDisplay,
  };
}

// ── Instagram account limit ─────────────────────────────────────────────────

export function canConnectMoreAccounts(userPlan, connectedCount) {
  const config = getPlanConfig(userPlan);
  return {
    allowed: connectedCount < config.instagramAccounts,
    current: connectedCount,
    max: config.instagramAccounts,
  };
}

// ── Trial warning ───────────────────────────────────────────────────────────

export function getTrialWarning(user) {
  const sub = user.subscription || {};
  const plan = sub.plan || "trial";

  if (plan !== "trial") return null;

  const trialEndsAt = sub.trialEndsAt ? new Date(sub.trialEndsAt) : null;
  if (!trialEndsAt) return null;

  const now = new Date();
  const daysLeft = Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0 || sub.status === "expired") {
    return {
      type: "modal",
      message: "Your free trial has ended. Choose a plan to continue.",
      expired: true,
      daysLeft: 0,
    };
  }

  if (daysLeft <= 2) {
    return {
      type: "banner",
      message: `Your trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Upgrade now to keep your automations running.`,
      expired: false,
      daysLeft,
    };
  }

  return null;
}

// ── DM quota warning ────────────────────────────────────────────────────────

export function getDmQuotaWarning(user) {
  const sub = user.subscription || {};
  const plan = sub.plan || "trial";
  const config = getPlanConfig(plan);

  // Gold/Platinum shown as "Unlimited" — don't warn unless they hit hidden cap
  if (config.dmLimitDisplay === "Unlimited") {
    const usage = user.usage || {};
    const dmsSent = usage.dmsSentThisMonth || 0;
    // Only warn if they somehow hit >95% of hidden cap (extremely unlikely)
    if (dmsSent < config.dmLimit * 0.95) return null;
  }

  const quota = getQuotaStatus(user);

  if (quota.isExhausted) {
    return {
      level: "critical",
      message: "You've reached your monthly DM limit. Top up or upgrade to keep automating.",
      percentUsed: 100,
      dmsSent: quota.dmsSent,
      dmLimit: quota.dmLimit,
      topUpRemaining: quota.topUpRemaining,
    };
  }

  if (quota.isApproachingLimit) {
    return {
      level: "warning",
      message: `You've used ${quota.dmsSent} of ${quota.planDisplayLimit} DMs this month.`,
      percentUsed: quota.percentUsed,
      dmsSent: quota.dmsSent,
      dmLimit: quota.dmLimit,
      topUpRemaining: quota.topUpRemaining,
    };
  }

  return null;
}
