"use server";

import { cookies } from "next/headers";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";

export async function getAccountType() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return { accountType: "creator" };

  const payload = await verifyToken(token);
  if (!payload?.userId) return { accountType: "creator" };

  await dbConnect();
  const user = await User.findOne({ userId: payload.userId }).select("accountType").lean();
  return { accountType: user?.accountType || "creator" };
}
