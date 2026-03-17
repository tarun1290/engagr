"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Event from "@/models/Event";
import { verifyToken } from "@/lib/jwt";

async function getOwnerId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (token) {
    const payload = await verifyToken(token);
    if (payload?.userId) return payload.userId;
  }
  return process.env.OWNER_USER_ID || "owner";
}

// Disconnect Instagram — removes tokens, keeps account
export async function deauthorizeInstagram() {
  const userId = await getOwnerId();
  await dbConnect();

  await User.findOneAndUpdate(
    { userId },
    {
      $unset: { instagramAccessToken: 1, pageAccessToken: 1, instagramBusinessId: 1, instagramUsername: 1, instagramProfilePic: 1, pageId: 1 },
      $set: { isConnected: false },
    }
  );

  return { success: true };
}

// Delete all user data and log out
export async function deleteAccountData() {
  const userId = await getOwnerId();
  await dbConnect();

  const user = await User.findOne({ userId });
  if (user?.instagramBusinessId) {
    await Event.deleteMany({ targetBusinessId: user.instagramBusinessId });
  }
  await User.deleteOne({ userId });

  // Clear auth cookie
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");

  redirect("/sign-up");
}
