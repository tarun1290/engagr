"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Event from "@/models/Event";
import InstagramAccount from "@/models/InstagramAccount";
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

// Disconnect Instagram — removes tokens from a specific account (or primary)
export async function deauthorizeInstagram(accountId) {
  const userId = await getOwnerId();
  await dbConnect();

  if (accountId) {
    // Disconnect a specific account
    await InstagramAccount.findOneAndUpdate(
      { _id: accountId, userId },
      {
        $unset: { accessToken: 1 },
        $set: { isConnected: false, tokenExpired: false, "automation.isActive": false },
      }
    );
  } else {
    // Disconnect the primary / all accounts
    await InstagramAccount.updateMany(
      { userId },
      {
        $unset: { accessToken: 1 },
        $set: { isConnected: false, tokenExpired: false, "automation.isActive": false },
      }
    );
  }

  // Keep legacy User in sync
  await User.findOneAndUpdate(
    { userId },
    {
      $unset: { instagramAccessToken: 1, instagramBusinessId: 1, instagramUsername: 1, instagramProfilePic: 1 },
      $set: { isConnected: false, tokenExpired: false },
    }
  );

  return { success: true };
}

// Delete all user data and log out
export async function deleteAccountData() {
  const userId = await getOwnerId();
  await dbConnect();

  // Delete events for all of this user's accounts
  const accounts = await InstagramAccount.find({ userId });
  for (const account of accounts) {
    await Event.deleteMany({
      $or: [
        { accountId: account._id },
        { targetBusinessId: account.instagramUserId },
      ],
    });
  }

  // Also clean up any legacy events by User.instagramBusinessId
  const user = await User.findOne({ userId });
  if (user?.instagramBusinessId) {
    await Event.deleteMany({ targetBusinessId: user.instagramBusinessId });
  }

  // Delete all InstagramAccounts for this user
  await InstagramAccount.deleteMany({ userId });

  // Delete the User
  await User.deleteOne({ userId });

  // Clear auth cookie
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");

  redirect("/sign-up");
}
