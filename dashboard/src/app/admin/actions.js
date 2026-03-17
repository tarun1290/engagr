"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
    eventsByType,
    users: JSON.parse(JSON.stringify(users)),
    recentEvents: JSON.parse(JSON.stringify(recentEvents)),
  };
}
