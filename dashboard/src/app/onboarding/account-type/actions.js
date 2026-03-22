"use server";

import { cookies } from "next/headers";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";

export async function updateAccountType(accountType) {
  if (!["creator", "business", "agency"].includes(accountType)) {
    return { error: "Invalid account type." };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return { error: "Not authenticated." };

  const payload = await verifyToken(token);
  if (!payload?.userId) return { error: "Invalid session." };

  await dbConnect();
  await User.findOneAndUpdate(
    { userId: payload.userId },
    { accountType }
  );

  return { success: true };
}
