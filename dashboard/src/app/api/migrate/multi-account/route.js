import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import InstagramAccount from "@/models/InstagramAccount";

// POST /api/migrate/multi-account
// Idempotent migration: copies Instagram fields from User → InstagramAccount.
// Protected by CRON_SECRET.
export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  const users = await User.find({
    instagramBusinessId: { $exists: true, $ne: null },
  });

  const results = { migrated: 0, skipped: 0, errors: [] };

  for (const user of users) {
    try {
      const result = await InstagramAccount.findOneAndUpdate(
        { userId: user.userId, instagramUserId: user.instagramBusinessId },
        {
          $setOnInsert: {
            userId: user.userId,
            instagramUserId: user.instagramBusinessId,
            instagramPageScopedId: user.instagramWebhookId || user.instagramBusinessId,
            instagramUsername: user.instagramUsername,
            instagramProfilePic: user.instagramProfilePic,
            accessToken: user.instagramAccessToken,
            tokenExpiresAt: user.tokenExpiresAt,
            tokenExpired: user.tokenExpired || false,
            isConnected: user.isConnected || false,
            isPrimary: true,
            automation: user.automation
              ? JSON.parse(JSON.stringify(user.automation))
              : undefined,
            createdAt: user.createdAt || new Date(),
          },
        },
        { upsert: true, rawResult: true }
      );

      if (result.lastErrorObject?.updatedExisting) {
        results.skipped++;
      } else {
        results.migrated++;
        console.log(`[Migration] Created InstagramAccount for user ${user.userId} (@${user.instagramUsername})`);
      }
    } catch (err) {
      results.errors.push({ userId: user.userId, error: err.message });
      console.error(`[Migration] Error for user ${user.userId}:`, err.message);
    }
  }

  console.log("[Migration] Multi-account migration complete:", results);

  return NextResponse.json({
    success: true,
    ...results,
    timestamp: new Date().toISOString(),
  });
}
