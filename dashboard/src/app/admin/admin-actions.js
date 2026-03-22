"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Event from "@/models/Event";
import InstagramAccount from "@/models/InstagramAccount";

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session || session !== process.env.ADMIN_KEY) {
    throw new Error("Unauthorized");
  }
}

// ── Overview ────────────────────────────────────────────────────────────────

export async function adminGetOverviewStats() {
  await requireAdmin();
  await dbConnect();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Run ALL queries in parallel
  const [
    totalAccounts, connectedAccounts, activeAutomations, totalEvents,
    sentToday, eventsToday, eventsByType, activeAccountIds, dmAgg,
    totalLast24h, failedLast24h, newThisMonth, planBreakdown, errorAccounts,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isConnected: true }),
    User.countDocuments({ "automation.isActive": true }),
    Event.countDocuments(),
    Event.countDocuments({ "reply.status": "sent", createdAt: { $gte: startOfDay } }),
    Event.countDocuments({ createdAt: { $gte: startOfDay } }),
    Event.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Event.distinct("from.id", { createdAt: { $gte: sevenDaysAgo } }),
    User.aggregate([{ $group: { _id: null, total: { $sum: "$usage.dmsSentTotal" }, month: { $sum: "$usage.dmsSentThisMonth" } } }]),
    Event.countDocuments({ createdAt: { $gte: oneDayAgo } }),
    Event.countDocuments({ "reply.status": "failed", createdAt: { $gte: oneDayAgo } }),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    User.aggregate([{ $group: { _id: "$subscription.plan", count: { $sum: 1 } } }]),
    Event.distinct("accountId", { "reply.status": "failed", createdAt: { $gte: oneDayAgo } }),
  ]);

  const activeAccounts = activeAccountIds.length;
  const totalDmsSent = dmAgg[0]?.total || 0;
  const dmsThisMonth = dmAgg[0]?.month || 0;
  const webhookHealth = totalLast24h > 0 ? Math.round(((totalLast24h - failedLast24h) / totalLast24h) * 100) : 100;

  return {
    totalAccounts, connectedAccounts, activeAutomations, totalEvents,
    sentToday, eventsToday, eventsByType: JSON.parse(JSON.stringify(eventsByType)),
    activeAccounts, totalDmsSent, dmsThisMonth, webhookHealth, newThisMonth,
    planBreakdown: JSON.parse(JSON.stringify(planBreakdown)),
    errorAccountCount: errorAccounts.length,
  };
}

// ── Accounts ────────────────────────────────────────────────────────────────

export async function adminGetAccounts(filters = {}, sort = { field: "createdAt", dir: "desc" }, page = 1, limit = 20) {
  await requireAdmin();
  await dbConnect();

  const query = {};
  if (filters.search) {
    const q = filters.search;
    query.$or = [
      { instagramUsername: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { userId: { $regex: q, $options: "i" } },
    ];
  }
  if (filters.plan) query["subscription.plan"] = filters.plan;

  const total = await User.countDocuments(query);
  const sortObj = { [sort.field]: sort.dir === "asc" ? 1 : -1 };
  const users = await User.find(query)
    .select("-instagramAccessToken -passwordHash")
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Get IG account counts per user
  const enriched = [];
  for (const user of users) {
    const igCount = await InstagramAccount.countDocuments({ userId: user.userId, isConnected: true });
    enriched.push({ ...user, igAccountCount: igCount });
  }

  return {
    accounts: JSON.parse(JSON.stringify(enriched)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function adminGetAccountDetail(userId) {
  await requireAdmin();
  await dbConnect();

  const user = await User.findOne({ userId }).select("-instagramAccessToken -passwordHash").lean();
  if (!user) return { error: "User not found" };

  const igAccounts = await InstagramAccount.find({ userId }).select("-accessToken").lean();
  const eventCount = await Event.countDocuments({
    $or: igAccounts.map((a) => ({ accountId: a._id })),
  });

  return {
    user: JSON.parse(JSON.stringify(user)),
    igAccounts: JSON.parse(JSON.stringify(igAccounts)),
    eventCount,
  };
}

// ── Feature toggle ──────────────────────────────────────────────────────────

export async function adminToggleFeature(userId, featureFlag, enabled, notes = "") {
  await requireAdmin();
  await dbConnect();

  const user = await User.findOne({ userId });
  if (!user) return { error: "User not found" };

  // Set the flag
  await User.findOneAndUpdate({ userId }, { [`flags.${featureFlag}`]: enabled });

  // For AI detection, also update InstagramAccount.aiFeature
  if (featureFlag === "aiProductDetectionUnlocked") {
    await InstagramAccount.updateMany(
      { userId },
      {
        "aiFeature.enabled": enabled,
        ...(enabled
          ? { "aiFeature.enabledBy": "admin", "aiFeature.enabledAt": new Date(), "aiFeature.notes": notes }
          : { "aiFeature.disabledAt": new Date() }),
      }
    );
  }

  // For smart features, update InstagramAccount.smartFeatures
  if (["shopifyEnabled", "knowledgeBaseEnabled", "smartRepliesEnabled"].includes(featureFlag)) {
    const fieldMap = {
      shopifyEnabled: "smartFeatures.shopifyConnected",
      knowledgeBaseEnabled: "smartFeatures.knowledgeBaseActive",
      smartRepliesEnabled: "smartFeatures.smartRepliesActive",
    };
    await InstagramAccount.updateMany(
      { userId },
      {
        [fieldMap[featureFlag]]: enabled,
        "smartFeatures.enabledBy": enabled ? "admin" : undefined,
        "smartFeatures.enabledAt": enabled ? new Date() : undefined,
        "smartFeatures.disabledAt": enabled ? undefined : new Date(),
        "smartFeatures.notes": notes || undefined,
      }
    );
  }

  console.log(`[Admin] ${enabled ? "Enabled" : "Disabled"} ${featureFlag} for user ${userId}`);
  revalidatePath("/admin");
  return { success: true };
}

export async function adminBulkToggleFeature(userIds, featureFlag, enabled, notes = "") {
  await requireAdmin();
  await dbConnect();

  if (!Array.isArray(userIds) || userIds.length === 0) return { error: "No users selected" };

  await User.updateMany(
    { userId: { $in: userIds } },
    { [`flags.${featureFlag}`]: enabled }
  );

  console.log(`[Admin] Bulk ${enabled ? "enabled" : "disabled"} ${featureFlag} for ${userIds.length} users`);
  revalidatePath("/admin");
  return { success: true, count: userIds.length };
}

// ── Feature stats ───────────────────────────────────────────────────────────

const FEATURE_EVENT_MAP = {
  "comment-to-dm": { type: "comment" },
  "follower-gate": { type: "comment" },
  "reel-share": { type: "reel_share" },
  "mentions": { type: "mention" },
  "reel-rules": { type: "reel_share" },
  "ai-detection": { type: "reel_share", filter: { "metadata.matchType": "ai_detection" } },
  "smart-links": { type: "reel_share", filter: { "metadata.trackedLinkId": { $exists: true } } },
  "smart-replies": { type: "smart_reply" },
  "conversations": { type: "smart_reply" },
};

export async function adminGetFeatureStats(featureName) {
  await requireAdmin();
  await dbConnect();

  const config = FEATURE_EVENT_MAP[featureName];
  const eventFilter = config ? { type: config.type, ...(config.filter || {}) } : {};

  const totalEvents = await Event.countDocuments(eventFilter);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const eventsThisMonth = await Event.countDocuments({ ...eventFilter, createdAt: { $gte: startOfMonth } });

  const sent = await Event.countDocuments({ ...eventFilter, "reply.status": "sent" });
  const failed = await Event.countDocuments({ ...eventFilter, "reply.status": "failed" });
  const successRate = totalEvents > 0 ? Math.round((sent / totalEvents) * 100) : 0;

  // Count users with this feature enabled
  const featureFlagMap = {
    "comment-to-dm": null,
    "follower-gate": null,
    "reel-share": null,
    "mentions": null,
    "reel-rules": null,
    "ai-detection": "aiProductDetectionUnlocked",
    "smart-links": "aiProductDetectionUnlocked",
    "smart-replies": "smartRepliesEnabled",
    "knowledge-base": "knowledgeBaseEnabled",
    "shopify": "shopifyEnabled",
    "conversations": "smartRepliesEnabled",
  };
  const flag = featureFlagMap[featureName];
  let enabledUsers = 0;
  if (flag) {
    enabledUsers = await User.countDocuments({ [`flags.${flag}`]: true });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const eventsToday = await Event.countDocuments({ ...eventFilter, createdAt: { $gte: startOfDay } });

  return {
    totalEvents, eventsThisMonth, eventsToday, sent, failed, successRate, enabledUsers,
  };
}

export async function adminGetFeatureEvents(featureName, page = 1, limit = 50) {
  await requireAdmin();
  await dbConnect();

  const config = FEATURE_EVENT_MAP[featureName];
  const eventFilter = config ? { type: config.type, ...(config.filter || {}) } : {};

  const events = await Event.find(eventFilter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return { events: JSON.parse(JSON.stringify(events)) };
}

export async function adminGetFeatureAccounts(featureName) {
  await requireAdmin();
  await dbConnect();

  const featureFlagMap = {
    "comment-to-dm": null,
    "follower-gate": null,
    "reel-share": null,
    "mentions": null,
    "reel-rules": null,
    "ai-detection": "aiProductDetectionUnlocked",
    "smart-links": "aiProductDetectionUnlocked",
    "smart-replies": "smartRepliesEnabled",
    "knowledge-base": "knowledgeBaseEnabled",
    "shopify": "shopifyEnabled",
    "conversations": "smartRepliesEnabled",
    "analytics": null,
    "api-access": null,
    "payments": null,
  };

  const accounts = await User.find()
    .select("-instagramAccessToken -passwordHash")
    .sort({ createdAt: -1 })
    .lean();

  return { accounts: JSON.parse(JSON.stringify(accounts)) };
}

// ── Chart data ──────────────────────────────────────────────────────────────

export async function adminGetChartData(chartType, days = 30) {
  await requireAdmin();
  await dbConnect();

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Special chart types for overview dashboard
  if (chartType === "account_growth") {
    const data = await User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, signups: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    // Add cumulative total
    const total = await User.countDocuments({ createdAt: { $lt: since } });
    let cumulative = total;
    const enriched = data.map((d) => {
      cumulative += d.signups;
      return { date: d._id, signups: d.signups, total: cumulative };
    });
    return { data: JSON.parse(JSON.stringify(enriched)) };
  }

  if (chartType === "dms_sent") {
    const data = await Event.aggregate([
      { $match: { "reply.status": "sent", createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    return { data: JSON.parse(JSON.stringify(data.map((d) => ({ date: d._id, dms: d.count })))) };
  }

  // Feature-specific chart data
  const config = FEATURE_EVENT_MAP[chartType];
  const eventFilter = config ? { type: config.type, ...(config.filter || {}) } : {};

  const data = await Event.aggregate([
    { $match: { ...eventFilter, createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  return { data: JSON.parse(JSON.stringify(data)) };
}

// ── System ──────────────────────────────────────────────────────────────────

export async function adminGetSystemFlags() {
  await requireAdmin();
  await dbConnect();

  const totalUsers = await User.countDocuments();
  const flagCounts = {};
  for (const flag of ["aiProductDetectionUnlocked", "shopifyEnabled", "knowledgeBaseEnabled", "smartRepliesEnabled"]) {
    flagCounts[flag] = await User.countDocuments({ [`flags.${flag}`]: true });
  }

  // Per-feature event counts today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const featureEventCounts = {};
  const featureErrorRates = {};
  for (const [key, config] of Object.entries(FEATURE_EVENT_MAP)) {
    const filter = config ? { type: config.type, ...(config.filter || {}) } : {};
    featureEventCounts[key] = await Event.countDocuments({ ...filter, createdAt: { $gte: startOfDay } });
    const total24h = await Event.countDocuments({ ...filter, createdAt: { $gte: oneDayAgo } });
    const failed24h = await Event.countDocuments({ ...filter, "reply.status": "failed", createdAt: { $gte: oneDayAgo } });
    featureErrorRates[key] = total24h > 0 ? Math.round((failed24h / total24h) * 100) : 0;
  }

  // Total events per feature (all time)
  const featureTotalEvents = {};
  for (const [key, config] of Object.entries(FEATURE_EVENT_MAP)) {
    const filter = config ? { type: config.type, ...(config.filter || {}) } : {};
    featureTotalEvents[key] = await Event.countDocuments(filter);
  }

  return { totalUsers, flagCounts, featureEventCounts, featureErrorRates, featureTotalEvents };
}

export async function adminGetWebhookLogs(filters = {}, page = 1, limit = 50) {
  await requireAdmin();
  await dbConnect();

  // Try WebhookLog model first, fall back to Event model
  let WebhookLog;
  try {
    WebhookLog = (await import("@/models/WebhookLog")).default;
  } catch {
    // WebhookLog model not available, use Events as fallback
  }

  if (WebhookLog) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.source) query.source = filters.source;
    const total = await WebhookLog.countDocuments(query);
    const logs = await WebhookLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();

    // Stats
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const received24h = await WebhookLog.countDocuments({ createdAt: { $gte: oneDayAgo } });
    const failed24h = await WebhookLog.countDocuments({ status: "failed", createdAt: { $gte: oneDayAgo } });
    const successRate = received24h > 0 ? Math.round(((received24h - failed24h) / received24h) * 100) : 100;
    const avgTime = await WebhookLog.aggregate([
      { $match: { createdAt: { $gte: oneDayAgo }, processingTimeMs: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: "$processingTimeMs" } } },
    ]);

    return {
      logs: JSON.parse(JSON.stringify(logs)), total,
      stats: { received24h, successRate, avgProcessingMs: Math.round(avgTime[0]?.avg || 0), errors24h: failed24h },
    };
  }

  // Fallback: use Event model
  const events = await Event.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
  const total = await Event.countDocuments();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const received24h = await Event.countDocuments({ createdAt: { $gte: oneDayAgo } });
  const failed24h = await Event.countDocuments({ "reply.status": "failed", createdAt: { $gte: oneDayAgo } });

  return {
    logs: JSON.parse(JSON.stringify(events)), total,
    stats: { received24h, successRate: received24h > 0 ? Math.round(((received24h - failed24h) / received24h) * 100) : 100, avgProcessingMs: 0, errors24h: failed24h },
  };
}

export async function adminGetCronStatus() {
  await requireAdmin();
  return {
    jobs: [
      { name: "Token refresh", schedule: "Every 1 hour", cron: "0 */1 * * *", status: "active", tag: "" },
      { name: "Trial expiry check", schedule: "Daily at midnight", cron: "0 0 * * *", status: "disabled", tag: "[PLANS DISABLED]" },
      { name: "Usage reset (monthly)", schedule: "1st of month", cron: "0 0 1 * *", status: "active", tag: "" },
      { name: "Past due enforcement", schedule: "Daily at 6 AM", cron: "0 6 * * *", status: "disabled", tag: "[PAYMENTS DISABLED]" },
      { name: "Shopify product sync", schedule: "Daily at 3 AM", cron: "0 3 * * *", status: "disabled", tag: "[SMART FEATURES]" },
      { name: "Knowledge URL refresh", schedule: "Weekly (Sunday)", cron: "0 4 * * 0", status: "disabled", tag: "[SMART FEATURES]" },
      { name: "Conversation cleanup", schedule: "Every 6 hours", cron: "0 */6 * * *", status: "disabled", tag: "[SMART FEATURES]" },
      { name: "AI cost reset (monthly)", schedule: "1st of month", cron: "0 0 1 * *", status: "disabled", tag: "[AI DETECTION]" },
    ],
  };
}

export async function adminGetEnvStatus() {
  await requireAdmin();
  const vars = {
    core: [
      { name: "MONGODB_URI", set: !!process.env.MONGODB_URI },
      { name: "JWT_SECRET", set: !!process.env.JWT_SECRET },
      { name: "NEXT_PUBLIC_FACEBOOK_APP_ID", set: !!process.env.NEXT_PUBLIC_FACEBOOK_APP_ID },
      { name: "META_APP_SECRET", set: !!process.env.META_APP_SECRET },
      { name: "CRON_SECRET", set: !!process.env.CRON_SECRET },
      { name: "NEXT_PUBLIC_APP_URL", set: !!process.env.NEXT_PUBLIC_APP_URL },
      { name: "ADMIN_KEY", set: !!process.env.ADMIN_KEY },
    ],
    payments: [
      { name: "DODO_PAYMENTS_API_KEY", set: !!process.env.DODO_PAYMENTS_API_KEY },
      { name: "DODO_PAYMENTS_WEBHOOK_SECRET", set: !!process.env.DODO_PAYMENTS_WEBHOOK_SECRET },
    ],
    shopify: [
      { name: "SHOPIFY_API_KEY", set: !!process.env.SHOPIFY_API_KEY },
      { name: "SHOPIFY_API_SECRET", set: !!process.env.SHOPIFY_API_SECRET },
    ],
    ai: [
      { name: "EMBEDDING_API_KEY", set: !!process.env.EMBEDDING_API_KEY },
      { name: "AI_VISION_PROVIDER", set: !!process.env.AI_VISION_PROVIDER },
      { name: "AI_ANTHROPIC_API_KEY", set: !!process.env.AI_ANTHROPIC_API_KEY },
      { name: "AI_OPENAI_API_KEY", set: !!process.env.AI_OPENAI_API_KEY },
      { name: "AI_GEMINI_API_KEY", set: !!process.env.AI_GEMINI_API_KEY },
    ],
  };
  return vars;
}

export async function adminResetAllFlags() {
  await requireAdmin();
  await dbConnect();
  await User.updateMany({}, {
    "flags.aiProductDetectionUnlocked": false,
    "flags.shopifyEnabled": false,
    "flags.knowledgeBaseEnabled": false,
    "flags.smartRepliesEnabled": false,
  });
  await InstagramAccount.updateMany({}, {
    "aiFeature.enabled": false,
    "smartFeatures.shopifyConnected": false,
    "smartFeatures.knowledgeBaseActive": false,
    "smartFeatures.smartRepliesActive": false,
  });
  revalidatePath("/admin");
  return { success: true };
}

// ── Plan Config ─────────────────────────────────────────────────────────────

export async function adminGetPlanConfig() {
  await requireAdmin();
  await dbConnect();
  const PlanConfig = (await import("@/models/PlanConfig")).default;
  return JSON.parse(JSON.stringify(await PlanConfig.getConfig()));
}

export async function adminUpdatePlanConfig(updates) {
  await requireAdmin();
  await dbConnect();
  const PlanConfig = (await import("@/models/PlanConfig")).default;
  const { invalidatePlanConfigCache } = await import("@/lib/planConfig");

  if (updates.plans) {
    const visiblePlans = Object.values(updates.plans).filter((p) => p.isVisible);
    if (visiblePlans.length === 0) return { error: "At least one plan must be visible" };
    const popularPlans = Object.values(updates.plans).filter((p) => p.isPopular);
    if (popularPlans.length > 1) return { error: "Only one plan can be marked as popular" };
    for (const [slug, plan] of Object.entries(updates.plans)) {
      if (plan.price !== undefined && plan.price <= 0) return { error: `${slug} price must be positive` };
      if (plan.dmLimit !== undefined && plan.dmLimit !== -1 && plan.dmLimit < 100) return { error: `${slug} DM limit must be at least 100 or -1 for unlimited` };
      if (plan.maxAccounts !== undefined && (plan.maxAccounts < 1 || plan.maxAccounts > 10)) return { error: `${slug} max accounts must be 1-10` };
    }
  }

  const config = await PlanConfig.updateConfig(updates, "admin");
  invalidatePlanConfigCache();
  revalidatePath("/admin");
  return { success: true, config: JSON.parse(JSON.stringify(config)) };
}
