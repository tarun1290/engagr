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
  };
}
