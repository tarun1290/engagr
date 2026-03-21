"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Event from "@/models/Event";

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

export async function deleteUser(userId) {
  // Verify admin session before performing destructive action
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;
  if (adminSession !== process.env.ADMIN_KEY) {
    return { error: "Unauthorized" };
  }

  if (!userId) return { error: "Missing userId" };

  try {
    await dbConnect();

    const user = await User.findOne({ userId });
    if (user?.instagramBusinessId) {
      await Event.deleteMany({ targetBusinessId: user.instagramBusinessId });
    }
    await User.deleteOne({ userId });

    // Invalidate cached page so the table refreshes with fresh data
    revalidatePath("/admin/dashboard");

    return { success: true };
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
