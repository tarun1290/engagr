"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Event from "@/models/Event";
import InstagramAccount from "@/models/InstagramAccount";
import TrackedLink from "@/models/TrackedLink";
import ClickEvent from "@/models/ClickEvent";
import ProductDetection from "@/models/ProductDetection";

export async function adminLogin(formData) {
  const key = formData.get("key");
  if (key === process.env.ADMIN_KEY) {
    const cookieStore = await cookies();
    cookieStore.set("admin_session", process.env.ADMIN_KEY, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
    redirect("/admin/dashboard");
  }
  redirect("/admin?error=1");
}

export async function deleteUser(userId, confirmText) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;
  if (adminSession !== process.env.ADMIN_KEY) {
    return { error: "Unauthorized" };
  }

  if (!userId) return { error: "Missing userId" };

  try {
    await dbConnect();

    const user = await User.findOne({ userId });
    if (!user) return { error: "User not found" };

    // Username confirmation check (if provided)
    if (confirmText) {
      const matchesUsername = confirmText === user.instagramUsername;
      const matchesEmail = confirmText === user.email;
      const matchesUserId = confirmText === user.userId;
      if (!matchesUsername && !matchesEmail && !matchesUserId) {
        return { error: "Confirmation text does not match username, email, or userId" };
      }
    }

    // Find IG accounts for event cleanup
    const igAccounts = await InstagramAccount.find({ userId: user.userId }).lean();
    const acctIds = igAccounts.map((a) => a._id);
    const businessIds = igAccounts.map((a) => a.instagramUserId).filter(Boolean);

    // Cascade delete all associated data
    const eventsDeleted = await Event.deleteMany({
      $or: [
        ...(acctIds.length ? [{ accountId: { $in: acctIds } }] : []),
        ...(businessIds.length ? [{ targetBusinessId: { $in: businessIds } }] : []),
        { "from.id": user.userId },
      ],
    });

    const linksFound = await TrackedLink.find({ userId: user.userId }).select("_id").lean();
    const linkIds = linksFound.map((l) => l._id);
    const clicksDeleted = linkIds.length ? await ClickEvent.deleteMany({ trackedLinkId: { $in: linkIds } }) : { deletedCount: 0 };
    const linksDeleted = await TrackedLink.deleteMany({ userId: user.userId });
    const detectionsDeleted = await ProductDetection.deleteMany({ userId: user.userId });
    const accountsDeleted = await InstagramAccount.deleteMany({ userId: user.userId });

    // Clean up smart features data if models exist
    try { const KD = (await import("@/models/KnowledgeDocument")).default; await KD.deleteMany({ userId: user.userId }); } catch {}
    try { const KC = (await import("@/models/KnowledgeChunk")).default; await KC.deleteMany({ userId: user.userId }); } catch {}
    try { const CT = (await import("@/models/ConversationThread")).default; await CT.deleteMany({ userId: user.userId }); } catch {}
    try { const SS = (await import("@/models/ShopifyStore")).default; await SS.deleteMany({ userId: user.userId }); } catch {}
    try { const SP = (await import("@/models/ShopifyProduct")).default; await SP.deleteMany({ userId: user.userId }); } catch {}

    await User.deleteOne({ userId: user.userId });

    console.log("[Admin] Account deleted:", {
      deletedBy: "admin",
      userId: user.userId,
      email: user.email,
      username: user.instagramUsername,
      events: eventsDeleted.deletedCount,
      igAccounts: accountsDeleted.deletedCount,
      links: linksDeleted.deletedCount,
      clicks: clicksDeleted.deletedCount,
      detections: detectionsDeleted.deletedCount,
      timestamp: new Date().toISOString(),
    });

    revalidatePath("/admin");

    return {
      success: true,
      deleted: {
        events: eventsDeleted.deletedCount,
        igAccounts: accountsDeleted.deletedCount,
        links: linksDeleted.deletedCount,
        clicks: clicksDeleted.deletedCount,
        detections: detectionsDeleted.deletedCount,
      },
    };
  } catch (err) {
    console.error("[deleteUser]", err.message);
    return { error: err.message };
  }
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/admin");
}

export async function getAdminStats() {
  await dbConnect();

  const totalUsers = await User.countDocuments();
  const connectedUsers = await User.countDocuments({ isConnected: true });
  const activeAutomations = await User.countDocuments({ "automation.isActive": true });
  const totalEvents = await Event.countDocuments();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const sentToday = await Event.countDocuments({
    "reply.status": "sent",
    createdAt: { $gte: startOfDay },
  });

  const eventsToday = await Event.countDocuments({
    createdAt: { $gte: startOfDay },
  });

  const eventsByType = await Event.aggregate([
    { $group: { _id: "$type", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const users = await User.find()
    .select("-instagramAccessToken -pageAccessToken")
    .sort({ createdAt: -1 })
    .lean();

  const recentEvents = await Event.find()
    .sort({ createdAt: -1 })
    .limit(15)
    .lean();

  // ── Subscription stats ──────────────────────────────────────────────────
  const planBreakdown = await User.aggregate([
    { $group: { _id: "$subscription.plan", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const activeSubscribers = await User.countDocuments({
    "subscription.status": "active",
  });

  // MRR calculation: count active users by plan × price
  const planPrices = { silver: 499, gold: 999, platinum: 1499 };
  let mrr = 0;
  for (const entry of planBreakdown) {
    if (entry._id && planPrices[entry._id]) {
      // Only count active subscriptions for MRR
      const activeCount = await User.countDocuments({
        "subscription.plan": entry._id,
        "subscription.status": "active",
      });
      mrr += activeCount * planPrices[entry._id];
    }
  }

  // AI-enabled account stats
  const aiEnabledUsers = await User.countDocuments({ "flags.aiProductDetectionUnlocked": true });
  const totalAiDetections = await ProductDetection.countDocuments();
  const totalTrackedLinks = await TrackedLink.countDocuments();

  return {
    totalUsers,
    connectedUsers,
    activeAutomations,
    totalEvents,
    sentToday,
    eventsToday,
    eventsByType,
    users: JSON.parse(JSON.stringify(users)),
    recentEvents: JSON.parse(JSON.stringify(recentEvents)),
    planBreakdown: JSON.parse(JSON.stringify(planBreakdown)),
    activeSubscribers,
    mrr,
    aiEnabledUsers,
    totalAiDetections,
    totalTrackedLinks,
  };
}

// ── Admin: Change user plan ───────────────────────────────────────────────
export async function adminChangePlan(userId, newPlan) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;
  if (adminSession !== process.env.ADMIN_KEY) return { error: "Unauthorized" };

  await dbConnect();
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  await User.findOneAndUpdate({ userId }, {
    "subscription.plan": newPlan,
    "subscription.status": newPlan === "trial" ? "trialing" : "active",
    "subscription.currentPeriodStart": now,
    "subscription.currentPeriodEnd": periodEnd,
  });

  revalidatePath("/admin/dashboard");
  return { success: true };
}

// ── Admin: Grant bonus DMs ────────────────────────────────────────────────
export async function adminGrantDms(userId, amount) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;
  if (adminSession !== process.env.ADMIN_KEY) return { error: "Unauthorized" };

  const dms = parseInt(amount);
  if (!dms || dms <= 0) return { error: "Invalid amount" };

  await dbConnect();
  await User.findOneAndUpdate({ userId }, {
    $inc: { "usage.topUpDmsRemaining": dms },
  });

  revalidatePath("/admin/dashboard");
  return { success: true };
}

// ── Admin: Extend trial ──────────────────────────────────────────────────
export async function adminExtendTrial(userId, days) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;
  if (adminSession !== process.env.ADMIN_KEY) return { error: "Unauthorized" };

  const d = parseInt(days);
  if (!d || d <= 0) return { error: "Invalid days" };

  await dbConnect();
  const user = await User.findOne({ userId });
  if (!user) return { error: "User not found" };

  const currentEnd = user.subscription?.trialEndsAt || new Date();
  const newEnd = new Date(Math.max(Date.now(), new Date(currentEnd).getTime()));
  newEnd.setDate(newEnd.getDate() + d);

  await User.findOneAndUpdate({ userId }, {
    "subscription.trialEndsAt": newEnd,
    "subscription.status": "trialing",
    "subscription.plan": "trial",
  });

  revalidatePath("/admin/dashboard");
  return { success: true };
}

// ── Admin: Enable AI Product Detection for a user ───────────────────────
export async function adminEnableAi(userId, notes) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;
  if (adminSession !== process.env.ADMIN_KEY) return { error: "Unauthorized" };

  await dbConnect();
  const user = await User.findOne({ userId });
  if (!user) return { error: "User not found" };

  // Set user-level flag
  await User.findOneAndUpdate({ userId }, {
    "flags.aiProductDetectionUnlocked": true,
  });

  // Enable on ALL connected InstagramAccounts
  await InstagramAccount.updateMany(
    { userId },
    {
      "aiFeature.enabled": true,
      "aiFeature.enabledBy": "admin",
      "aiFeature.enabledAt": new Date(),
      "aiFeature.notes": notes || "Enabled by admin",
    }
  );

  console.log(`[Admin] AI detection enabled for user ${userId}`);
  revalidatePath("/admin/dashboard");
  return { success: true };
}

// ── Admin: Disable AI Product Detection for a user ──────────────────────
export async function adminDisableAi(userId) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;
  if (adminSession !== process.env.ADMIN_KEY) return { error: "Unauthorized" };

  await dbConnect();

  await User.findOneAndUpdate({ userId }, {
    "flags.aiProductDetectionUnlocked": false,
  });

  await InstagramAccount.updateMany(
    { userId },
    {
      "aiFeature.enabled": false,
      "aiFeature.disabledAt": new Date(),
    }
  );

  console.log(`[Admin] AI detection disabled for user ${userId}`);
  revalidatePath("/admin/dashboard");
  return { success: true };
}

// ── Admin: Bulk enable AI for multiple users ────────────────────────────
export async function adminBulkEnableAi(userIds, notes) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;
  if (adminSession !== process.env.ADMIN_KEY) return { error: "Unauthorized" };

  if (!Array.isArray(userIds) || userIds.length === 0) return { error: "No users selected" };

  await dbConnect();

  await User.updateMany(
    { userId: { $in: userIds } },
    { "flags.aiProductDetectionUnlocked": true }
  );

  await InstagramAccount.updateMany(
    { userId: { $in: userIds } },
    {
      "aiFeature.enabled": true,
      "aiFeature.enabledBy": "admin-bulk",
      "aiFeature.enabledAt": new Date(),
      "aiFeature.notes": notes || "Bulk enabled by admin",
    }
  );

  console.log(`[Admin] AI detection bulk-enabled for ${userIds.length} users`);
  revalidatePath("/admin/dashboard");
  return { success: true, count: userIds.length };
}

// ── Admin: AI Analytics ────────────────────────────────────────────────

export async function adminGetAiAnalytics() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;
  if (adminSession !== process.env.ADMIN_KEY) return { error: "Unauthorized" };

  await dbConnect();

  const totalLinks = await TrackedLink.countDocuments();
  const totalDetections = await ProductDetection.countDocuments();
  const successfulDetections = await ProductDetection.countDocuments({ status: "success" });
  const failedDetections = await ProductDetection.countDocuments({ status: { $in: ["failed", "api_error"] } });

  // Total clicks
  const allLinks = await TrackedLink.find().select("stats.totalClicks stats.uniqueClicks").lean();
  let totalClicks = 0, totalUnique = 0;
  for (const l of allLinks) {
    totalClicks += l.stats?.totalClicks || 0;
    totalUnique += l.stats?.uniqueClicks || 0;
  }

  // Clicks today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const clicksToday = await ClickEvent.countDocuments({ timestamp: { $gte: startOfDay } });

  // AI cost this month
  const costAgg = await User.aggregate([
    { $match: { "flags.aiProductDetectionUnlocked": true } },
    { $group: { _id: null, totalCost: { $sum: "$usage.aiCostThisMonth" }, totalDetections: { $sum: "$usage.aiDetectionsThisMonth" } } },
  ]);
  const aiCostThisMonth = costAgg[0]?.totalCost || 0;
  const detectionsThisMonth = costAgg[0]?.totalDetections || 0;

  // Detection success rate
  const successRate = totalDetections > 0 ? Math.round((successfulDetections / totalDetections) * 100) : 0;

  // Top products
  const topProducts = await ProductDetection.aggregate([
    { $match: { status: "success" } },
    { $unwind: "$detectedProducts" },
    {
      $group: {
        _id: "$detectedProducts.name",
        category: { $first: "$detectedProducts.category" },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: "$userId" },
      },
    },
    { $addFields: { userCount: { $size: "$uniqueUsers" } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
    { $project: { uniqueUsers: 0 } },
  ]);

  // Top links by clicks
  const topLinks = await TrackedLink.find()
    .sort({ "stats.totalClicks": -1 })
    .limit(20)
    .lean();

  // Category breakdown
  const categoryBreakdown = await ProductDetection.aggregate([
    { $match: { status: "success" } },
    { $unwind: "$detectedProducts" },
    { $group: { _id: "$detectedProducts.category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Click geography (top 10 countries)
  const clickGeo = await ClickEvent.aggregate([
    { $match: { country: { $exists: true, $ne: "Unknown" } } },
    { $group: { _id: "$country", clicks: { $sum: 1 } } },
    { $sort: { clicks: -1 } },
    { $limit: 10 },
  ]);

  // Device breakdown
  const deviceBreakdown = await ClickEvent.aggregate([
    { $group: { _id: "$device", clicks: { $sum: 1 } } },
    { $sort: { clicks: -1 } },
  ]);

  // Recent detections log (last 20)
  const recentDetections = await ProductDetection.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  // Per-user AI stats
  const aiUsers = await User.find({ "flags.aiProductDetectionUnlocked": true })
    .select("userId email instagramUsername usage.aiDetectionsThisMonth usage.aiDetectionsTotal usage.aiCostThisMonth")
    .lean();

  // Get link counts and click counts per AI user
  const userAiStats = [];
  for (const u of aiUsers) {
    const linksCount = await TrackedLink.countDocuments({ userId: u.userId });
    const userLinks = await TrackedLink.find({ userId: u.userId }).select("stats.totalClicks").lean();
    let userClicks = 0;
    for (const l of userLinks) userClicks += l.stats?.totalClicks || 0;
    userAiStats.push({
      userId: u.userId,
      email: u.email,
      username: u.instagramUsername,
      detections: u.usage?.aiDetectionsThisMonth || 0,
      detectionsTotal: u.usage?.aiDetectionsTotal || 0,
      cost: u.usage?.aiCostThisMonth || 0,
      links: linksCount,
      clicks: userClicks,
    });
  }

  // Revenue potential estimate
  const avgCommission = 0.03;
  const avgProductPrice = 25;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const clicksThisMonth = await ClickEvent.countDocuments({ timestamp: { $gte: startOfMonth } });
  const estimatedRevenue = Math.round(clicksThisMonth * avgCommission * avgProductPrice * 100) / 100;

  return {
    totalLinks,
    totalClicks,
    totalUnique,
    clicksToday,
    totalDetections,
    detectionsThisMonth,
    successRate,
    aiCostThisMonth: Math.round(aiCostThisMonth * 1000) / 1000,
    topProducts: JSON.parse(JSON.stringify(topProducts)),
    topLinks: JSON.parse(JSON.stringify(topLinks)),
    categoryBreakdown: JSON.parse(JSON.stringify(categoryBreakdown)),
    clickGeo: JSON.parse(JSON.stringify(clickGeo)),
    deviceBreakdown: JSON.parse(JSON.stringify(deviceBreakdown)),
    recentDetections: JSON.parse(JSON.stringify(recentDetections)),
    userAiStats: JSON.parse(JSON.stringify(userAiStats)),
    clicksThisMonth,
    estimatedRevenue,
  };
}
