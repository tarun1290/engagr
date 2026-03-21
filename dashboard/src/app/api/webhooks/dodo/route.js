import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// [PAYMENTS DISABLED] Uncomment when ready to enable Dodo Payments
//
// import { Webhook } from "standardwebhooks";
// import dbConnect from "@/lib/dbConnect";
// import User from "@/models/User";
// import Transaction from "@/models/Transaction";
// import Invoice from "@/models/Invoice";
//
// export async function POST(request) {
//   const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
//   if (!webhookSecret) {
//     console.error("[DodoWH] Missing DODO_PAYMENTS_WEBHOOK_SECRET");
//     return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
//   }
//
//   let rawBody;
//   try {
//     rawBody = await request.text();
//   } catch {
//     return NextResponse.json({ error: "Bad request" }, { status: 400 });
//   }
//
//   // Verify webhook signature using Standard Webhooks spec
//   const webhookHeaders = {
//     "webhook-id": request.headers.get("webhook-id") || "",
//     "webhook-signature": request.headers.get("webhook-signature") || "",
//     "webhook-timestamp": request.headers.get("webhook-timestamp") || "",
//   };
//
//   let payload;
//   try {
//     const wh = new Webhook(webhookSecret);
//     payload = wh.verify(rawBody, webhookHeaders);
//   } catch (err) {
//     console.warn("[DodoWH] Invalid signature:", err.message);
//     return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
//   }
//
//   const eventType = payload.type;
//   const data = payload.data;
//   console.log(`[DodoWH] Event: ${eventType}`);
//
//   try {
//     await dbConnect();
//
//     switch (eventType) {
//       // ── Subscription events ──────────────────────────────────────────
//       case "subscription.active":
//         await handleSubscriptionActive(data);
//         break;
//       case "subscription.renewed":
//         await handleSubscriptionRenewed(data);
//         break;
//       case "subscription.on_hold":
//         await handleSubscriptionOnHold(data);
//         break;
//       case "subscription.cancelled":
//         await handleSubscriptionCancelled(data);
//         break;
//       case "subscription.expired":
//         await handleSubscriptionExpired(data);
//         break;
//       case "subscription.plan_changed":
//         await handleSubscriptionPlanChanged(data);
//         break;
//
//       // ── Payment events ───────────────────────────────────────────────
//       case "payment.succeeded":
//         await handlePaymentSucceeded(data);
//         break;
//       case "payment.failed":
//         await handlePaymentFailed(data);
//         break;
//
//       // ── Refund events ────────────────────────────────────────────────
//       case "refund.succeeded":
//         await handleRefundSucceeded(data);
//         break;
//
//       default:
//         console.log(`[DodoWH] Unhandled event: ${eventType}`);
//     }
//   } catch (err) {
//     console.error(`[DodoWH] Error processing ${eventType}:`, err.message);
//   }
//
//   return NextResponse.json({ received: true }, { status: 200 });
// }
//
// // ══════════════════════════════════════════════════════════════════════════
// // Event handlers
// // ══════════════════════════════════════════════════════════════════════════
//
// function resolvePlanFromProductId(productId) {
//   if (productId === process.env.DODO_SILVER_PRODUCT_ID) return "silver";
//   if (productId === process.env.DODO_GOLD_PRODUCT_ID) return "gold";
//   if (productId === process.env.DODO_PLATINUM_PRODUCT_ID) return "platinum";
//   return null;
// }
//
// async function handleSubscriptionActive(data) {
//   const subscriptionId = data.subscription_id;
//   if (!subscriptionId) return;
//
//   const user = await User.findOne({ "subscription.dodoSubscriptionId": subscriptionId });
//   if (!user) {
//     console.warn(`[DodoWH] No user found for subscription ${subscriptionId}`);
//     return;
//   }
//
//   const plan = resolvePlanFromProductId(data.product_id) || data.metadata?.plan || user.subscription?.plan || "silver";
//
//   const now = new Date();
//   const periodEnd = new Date(now);
//   periodEnd.setDate(periodEnd.getDate() + 30);
//
//   await User.findByIdAndUpdate(user._id, {
//     "subscription.status": "active",
//     "subscription.plan": plan,
//     "subscription.currentPeriodStart": now,
//     "subscription.currentPeriodEnd": periodEnd,
//     "subscription.cancelAtPeriodEnd": false,
//     "subscription.cancelledAt": null,
//     "usage.monthlyResetDate": periodEnd,
//     "usage.dmsSentThisMonth": 0,
//   });
//
//   const amount = data.recurring_pre_tax_amount || 0;
//   const tax = Math.round(amount * 0.18);
//
//   await Invoice.create({
//     userId: user._id,
//     dodoPaymentId: data.payment_id || null,
//     amount,
//     tax,
//     total: amount + tax,
//     plan,
//     periodStart: now,
//     periodEnd,
//     status: "paid",
//     paidAt: now,
//   });
//
//   await Transaction.create({
//     userId: user._id,
//     type: "subscription",
//     amount,
//     currency: data.currency || "INR",
//     dodoPaymentId: data.payment_id,
//     plan,
//     status: "success",
//     metadata: { subscriptionId, event: "subscription.active" },
//   });
//
//   console.log(`[DodoWH] Subscription activated for user ${user.userId}, plan=${plan}`);
// }
//
// async function handleSubscriptionRenewed(data) {
//   const subscriptionId = data.subscription_id;
//   if (!subscriptionId) return;
//
//   const user = await User.findOne({ "subscription.dodoSubscriptionId": subscriptionId });
//   if (!user) {
//     console.warn(`[DodoWH] No user found for subscription ${subscriptionId}`);
//     return;
//   }
//
//   const now = new Date();
//   const periodEnd = new Date(now);
//   periodEnd.setDate(periodEnd.getDate() + 30);
//
//   const updateFields = {
//     "subscription.currentPeriodStart": now,
//     "subscription.currentPeriodEnd": periodEnd,
//     "subscription.status": "active",
//     "usage.dmsSentThisMonth": 0,
//     "usage.monthlyResetDate": periodEnd,
//     "usage.lastResetAt": now,
//   };
//
//   // Apply pending downgrade if effective
//   if (user.subscription?.downgradeToPlan && user.subscription?.downgradeEffectiveDate) {
//     if (now >= user.subscription.downgradeEffectiveDate) {
//       updateFields["subscription.plan"] = user.subscription.downgradeToPlan;
//       updateFields["subscription.downgradeToPlan"] = null;
//       updateFields["subscription.downgradeEffectiveDate"] = null;
//       console.log(`[DodoWH] Downgrade applied: ${user.subscription.plan} → ${user.subscription.downgradeToPlan}`);
//     }
//   }
//
//   await User.findByIdAndUpdate(user._id, updateFields);
//
//   const amount = data.recurring_pre_tax_amount || 0;
//   const tax = Math.round(amount * 0.18);
//
//   await Invoice.create({
//     userId: user._id,
//     dodoPaymentId: data.payment_id || null,
//     amount,
//     tax,
//     total: amount + tax,
//     plan: user.subscription?.plan,
//     periodStart: now,
//     periodEnd,
//     status: "paid",
//     paidAt: now,
//   });
//
//   await Transaction.create({
//     userId: user._id,
//     type: "subscription",
//     amount,
//     currency: data.currency || "INR",
//     dodoPaymentId: data.payment_id,
//     plan: user.subscription?.plan,
//     status: "success",
//     metadata: { subscriptionId, event: "subscription.renewed" },
//   });
//
//   console.log(`[DodoWH] Subscription renewed for user ${user.userId}`);
// }
//
// async function handleSubscriptionOnHold(data) {
//   const subscriptionId = data.subscription_id;
//   if (!subscriptionId) return;
//   const user = await User.findOne({ "subscription.dodoSubscriptionId": subscriptionId });
//   if (!user) return;
//   await User.findByIdAndUpdate(user._id, { "subscription.status": "past_due" });
//   console.log(`[DodoWH] Subscription on hold (past_due) for user ${user.userId}`);
// }
//
// async function handleSubscriptionCancelled(data) {
//   const subscriptionId = data.subscription_id;
//   if (!subscriptionId) return;
//   const user = await User.findOne({ "subscription.dodoSubscriptionId": subscriptionId });
//   if (!user) return;
//   if (user.subscription?.cancelAtPeriodEnd) {
//     console.log(`[DodoWH] Subscription cancelled at period end for user ${user.userId}`);
//   } else {
//     await User.findByIdAndUpdate(user._id, {
//       "subscription.status": "cancelled",
//       "subscription.cancelledAt": new Date(),
//     });
//     console.log(`[DodoWH] Subscription immediately cancelled for user ${user.userId}`);
//   }
// }
//
// async function handleSubscriptionExpired(data) {
//   const subscriptionId = data.subscription_id;
//   if (!subscriptionId) return;
//   const user = await User.findOne({ "subscription.dodoSubscriptionId": subscriptionId });
//   if (!user) return;
//   await User.findByIdAndUpdate(user._id, {
//     "subscription.status": "expired",
//     "automation.isActive": false,
//   });
//   console.log(`[DodoWH] Subscription expired for user ${user.userId} — automation paused`);
// }
//
// async function handleSubscriptionPlanChanged(data) {
//   const subscriptionId = data.subscription_id;
//   if (!subscriptionId) return;
//   const user = await User.findOne({ "subscription.dodoSubscriptionId": subscriptionId });
//   if (!user) return;
//   const newPlan = resolvePlanFromProductId(data.product_id);
//   if (newPlan) {
//     await User.findByIdAndUpdate(user._id, {
//       "subscription.plan": newPlan,
//       "subscription.dodoProductId": data.product_id,
//       "subscription.downgradeToPlan": null,
//       "subscription.downgradeEffectiveDate": null,
//     });
//     console.log(`[DodoWH] Plan changed to ${newPlan} for user ${user.userId}`);
//   }
// }
//
// async function handlePaymentSucceeded(data) {
//   const paymentId = data.payment_id;
//   if (!paymentId) return;
//
//   // Check if this is a top-up payment via metadata
//   if (data.metadata?.type !== "topup") return;
//
//   const packSize = parseInt(data.metadata?.packSize || "0", 10);
//   if (!packSize) return;
//
//   // Find pending transaction
//   const existing = await Transaction.findOne({ dodoPaymentId: paymentId, status: "success" });
//   if (existing) {
//     console.log(`[DodoWH] Top-up payment already processed: ${paymentId}`);
//     return;
//   }
//
//   const userId = data.metadata?.userId;
//   if (!userId) return;
//
//   const user = await User.findById(userId);
//   if (!user) return;
//
//   await Transaction.create({
//     userId: user._id,
//     type: "topup",
//     amount: data.total_amount || 0,
//     currency: data.currency || "INR",
//     dodoPaymentId: paymentId,
//     topUpDms: packSize,
//     status: "success",
//     metadata: { event: "payment.succeeded", packSize },
//   });
//
//   await User.findByIdAndUpdate(user._id, { $inc: { "usage.topUpDmsRemaining": packSize } });
//   console.log(`[DodoWH] Top-up captured: +${packSize} DMs for user ${user.userId}`);
// }
//
// async function handlePaymentFailed(data) {
//   const paymentId = data.payment_id;
//   if (!paymentId) return;
//
//   await Transaction.create({
//     userId: null,
//     type: data.metadata?.type === "topup" ? "topup" : "subscription",
//     amount: data.total_amount || 0,
//     currency: data.currency || "INR",
//     dodoPaymentId: paymentId,
//     status: "failed",
//     metadata: { error: data.failure_reason, event: "payment.failed" },
//   });
//
//   console.log(`[DodoWH] Payment failed: ${paymentId} — ${data.failure_reason}`);
// }
//
// async function handleRefundSucceeded(data) {
//   const paymentId = data.payment_id;
//   const originalTxn = paymentId
//     ? await Transaction.findOne({ dodoPaymentId: paymentId })
//     : null;
//
//   await Transaction.create({
//     userId: originalTxn?.userId || null,
//     type: "refund",
//     amount: data.amount || 0,
//     currency: data.currency || "INR",
//     dodoPaymentId: paymentId,
//     status: "refunded",
//     metadata: { refundId: data.refund_id, reason: data.reason, event: "refund.succeeded" },
//   });
//
//   console.log(`[DodoWH] Refund succeeded for payment ${paymentId}, amount=${data.amount}`);
// }
// [/PAYMENTS DISABLED]

// Stub — returns 200 so Dodo test webhooks don't 404
export async function POST() {
  console.log("[PAYMENTS DISABLED] Dodo webhook received but payments are not enabled.");
  return NextResponse.json({ status: "payments_disabled" });
}
