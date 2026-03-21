import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

// GET /api/cron/subscription-management
// Runs daily via Vercel Cron. Handles:
// 1. Trial expiry (ACTIVE)
// 2. Past-due enforcement (PAYMENTS DISABLED — Dodo Payments)
// 3. Monthly usage reset (ACTIVE)
// 4. Cancel-at-period-end enforcement (PAYMENTS DISABLED — Dodo Payments)
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  const now = new Date();
  const results = { trialExpired: 0, pastDueEnforced: 0, usageReset: 0, periodEndCancelled: 0, errors: [] };

  // [PLANS DISABLED] Trial expiry disabled for Early Access
  // ── 1. Trial expiry ───────────────────────────────────────────
  // try {
  //   const expiredTrials = await User.find({
  //     "subscription.plan": "trial",
  //     "subscription.trialEndsAt": { $lt: now },
  //     "subscription.status": { $nin: ["expired", "active"] },
  //   });
  //
  //   for (const user of expiredTrials) {
  //     await User.findByIdAndUpdate(user._id, {
  //       "subscription.status": "expired",
  //       "automation.isActive": false,
  //     });
  //     results.trialExpired++;
  //   }
  // } catch (err) {
  //   results.errors.push({ task: "trialExpiry", error: err.message });
  // }
  // [/PLANS DISABLED]

  // [PAYMENTS DISABLED] Uncomment when ready to enable Dodo Payments
  // ── 2. Past-due enforcement (3-day grace) ───────────────────────────────
  // try {
  //   const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
  //
  //   const pastDueUsers = await User.find({
  //     "subscription.status": "past_due",
  //   });
  //
  //   for (const user of pastDueUsers) {
  //     const periodEnd = user.subscription?.currentPeriodEnd;
  //     const haltedAt = user.subscription?.metadata_haltedAt;
  //     const referenceDate = haltedAt || periodEnd;
  //
  //     if (referenceDate && new Date(referenceDate) < threeDaysAgo) {
  //       await User.findByIdAndUpdate(user._id, {
  //         "subscription.status": "expired",
  //         "automation.isActive": false,
  //       });
  //       results.pastDueEnforced++;
  //       console.log(`[Cron] Past-due enforced for user ${user.userId}`);
  //     }
  //   }
  // } catch (err) {
  //   results.errors.push({ task: "pastDueEnforcement", error: err.message });
  // }
  // [/PAYMENTS DISABLED]

  // ── 3. Usage reset (ACTIVE) ────────────────────────────────────────────
  try {
    const usersToReset = await User.find({
      "usage.monthlyResetDate": { $lte: now },
      "subscription.status": "active",
    });

    for (const user of usersToReset) {
      // Calculate next reset date (add 1 month)
      const currentReset = new Date(user.usage.monthlyResetDate);
      const nextReset = new Date(currentReset);
      nextReset.setMonth(nextReset.getMonth() + 1);

      await User.findByIdAndUpdate(user._id, {
        "usage.dmsSentThisMonth": 0,
        "usage.monthlyResetDate": nextReset,
        "usage.lastResetAt": now,
        // Do NOT touch topUpDmsRemaining — carries over
      });
      results.usageReset++;
    }
  } catch (err) {
    results.errors.push({ task: "usageReset", error: err.message });
  }

  // [PAYMENTS DISABLED] Uncomment when ready to enable Dodo Payments
  // ── 4. Cancel-at-period-end enforcement ─────────────────────────────────
  // try {
  //   const cancelledAtEnd = await User.find({
  //     "subscription.cancelAtPeriodEnd": true,
  //     "subscription.status": "active",
  //     "subscription.currentPeriodEnd": { $lte: now },
  //   });
  //
  //   for (const user of cancelledAtEnd) {
  //     await User.findByIdAndUpdate(user._id, {
  //       "subscription.status": "cancelled",
  //       "automation.isActive": false,
  //     });
  //     results.periodEndCancelled++;
  //     console.log(`[Cron] Period-end cancellation enforced for user ${user.userId}`);
  //   }
  // } catch (err) {
  //   results.errors.push({ task: "periodEndCancellation", error: err.message });
  // }
  // [/PAYMENTS DISABLED]

  console.log(`[Cron] Subscription management done:`, results);

  return NextResponse.json({
    success: true,
    ...results,
    timestamp: now.toISOString(),
  });
}
