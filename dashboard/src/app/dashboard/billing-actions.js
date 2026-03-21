"use server";

import { cookies } from "next/headers";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { PLANS, TOPUP_PACKS, TRIAL_DM_LIMIT } from "@/lib/dodo";
import { verifyToken } from "@/lib/jwt";
import { isPlanUpgrade, isPlanDowngrade, PLAN_ORDER, getPlanConfig, TRIAL_DAYS } from "@/lib/plans";

// ── Auth helper ───────────────────────────────────────────────────────────
async function getOwnerId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (token) {
    const payload = await verifyToken(token);
    if (payload?.userId) return payload.userId;
  }
  return process.env.OWNER_USER_ID || "owner";
}

// ══════════════════════════════════════════════════════════════════════════
// createSubscription(planName)
// ══════════════════════════════════════════════════════════════════════════
export async function createSubscription(/* planName */) {
  // [PAYMENTS DISABLED] Uncomment when ready to enable Dodo Payments
  //
  // import { getDodo, DODO_PRODUCTS } from "@/lib/dodo";
  //
  // const userId = await getOwnerId();
  // await dbConnect();
  //
  // const user = await User.findOne({ userId });
  // if (!user) return { success: false, error: "User not found." };
  //
  // const planKey = planName.toLowerCase();
  // const productId = DODO_PRODUCTS[planKey];
  // if (!productId || !PLANS[planKey]) {
  //   return { success: false, error: `Invalid plan: ${planName}` };
  // }
  //
  // const dodo = getDodo();
  //
  // // Create Dodo customer if needed
  // let customerId = user.subscription?.dodoCustomerId;
  // if (!customerId) {
  //   const customer = await dodo.customers.create({
  //     email: user.email || undefined,
  //     name: user.name || user.instagramUsername || "Engagr User",
  //   });
  //   customerId = customer.customer_id;
  //   await User.findByIdAndUpdate(user._id, {
  //     "subscription.dodoCustomerId": customerId,
  //   });
  // }
  //
  // // Create subscription with payment link
  // const subscription = await dodo.subscriptions.create({
  //   product_id: productId,
  //   quantity: 1,
  //   customer: { customer_id: customerId },
  //   payment_link: true,
  //   return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&plan=${planKey}`,
  //   metadata: { userId: user.userId, plan: planKey },
  // });
  //
  // await User.findByIdAndUpdate(user._id, {
  //   "subscription.dodoSubscriptionId": subscription.subscription_id,
  //   "subscription.dodoProductId": productId,
  // });
  //
  // return {
  //   success: true,
  //   subscriptionId: subscription.subscription_id,
  //   paymentLink: subscription.payment_link,
  // };
  // [/PAYMENTS DISABLED]

  return { disabled: true, message: "Payments not yet enabled" };
}

// ══════════════════════════════════════════════════════════════════════════
// createTopUpPayment(packSize)
// ══════════════════════════════════════════════════════════════════════════
export async function createTopUpPayment(/* packSize */) {
  // [PAYMENTS DISABLED] Uncomment when ready to enable Dodo Payments
  //
  // import { getDodo, DODO_PRODUCTS } from "@/lib/dodo";
  //
  // const userId = await getOwnerId();
  // await dbConnect();
  //
  // const user = await User.findOne({ userId });
  // if (!user) return { success: false, error: "User not found." };
  //
  // const pack = TOPUP_PACKS[packSize];
  // if (!pack) {
  //   return { success: false, error: `Invalid pack size: ${packSize}. Choose 200, 500, or 1000.` };
  // }
  //
  // const productId = DODO_PRODUCTS[`topup_${packSize}`];
  // if (!productId) {
  //   return { success: false, error: "Top-up product not configured." };
  // }
  //
  // const dodo = getDodo();
  //
  // // Create Dodo customer if needed
  // let customerId = user.subscription?.dodoCustomerId;
  // if (!customerId) {
  //   const customer = await dodo.customers.create({
  //     email: user.email || undefined,
  //     name: user.name || user.instagramUsername || "Engagr User",
  //   });
  //   customerId = customer.customer_id;
  //   await User.findByIdAndUpdate(user._id, {
  //     "subscription.dodoCustomerId": customerId,
  //   });
  // }
  //
  // const payment = await dodo.payments.create({
  //   payment_link: true,
  //   customer: { customer_id: customerId },
  //   product_cart: [{ product_id: productId, quantity: 1 }],
  //   return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?topup=success&pack=${packSize}`,
  //   metadata: { userId: user._id.toString(), type: "topup", packSize: packSize.toString() },
  // });
  //
  // return {
  //   success: true,
  //   paymentLink: payment.payment_link,
  //   paymentId: payment.payment_id,
  // };
  // [/PAYMENTS DISABLED]

  return { disabled: true, message: "Payments not yet enabled" };
}

// ══════════════════════════════════════════════════════════════════════════
// verifyPaymentStatus(paymentOrSubId) — check payment/subscription status
// after user redirects back from Dodo checkout
// ══════════════════════════════════════════════════════════════════════════
export async function verifyPaymentStatus(/* paymentOrSubId */) {
  // [PAYMENTS DISABLED] Uncomment when ready to enable Dodo Payments
  //
  // import { getDodo } from "@/lib/dodo";
  //
  // const userId = await getOwnerId();
  // await dbConnect();
  //
  // const user = await User.findOne({ userId });
  // if (!user) return { success: false, error: "User not found." };
  //
  // const dodo = getDodo();
  //
  // // Try to retrieve as subscription first, then as payment
  // try {
  //   const sub = await dodo.subscriptions.retrieve(paymentOrSubId);
  //   if (sub && sub.status === "active") {
  //     return { success: true, type: "subscription", status: sub.status };
  //   }
  // } catch {
  //   // Not a subscription ID, try as payment
  // }
  //
  // try {
  //   const payment = await dodo.payments.retrieve(paymentOrSubId);
  //   if (payment && payment.status === "succeeded") {
  //     return { success: true, type: "payment", status: payment.status };
  //   }
  // } catch {
  //   // Not found
  // }
  //
  // return { success: false, error: "Payment not found or not confirmed." };
  // [/PAYMENTS DISABLED]

  return { disabled: true };
}

// ══════════════════════════════════════════════════════════════════════════
// cancelSubscription()
// ══════════════════════════════════════════════════════════════════════════
export async function cancelSubscription() {
  // [PAYMENTS DISABLED] Uncomment when ready to enable Dodo Payments
  //
  // import { getDodo } from "@/lib/dodo";
  //
  // const userId = await getOwnerId();
  // await dbConnect();
  //
  // const user = await User.findOne({ userId });
  // if (!user) return { success: false, error: "User not found." };
  //
  // const subId = user.subscription?.dodoSubscriptionId;
  // if (!subId) return { success: false, error: "No active subscription found." };
  //
  // const dodo = getDodo();
  // await dodo.subscriptions.update(subId, { cancel_at_next_billing_date: true });
  //
  // await User.findByIdAndUpdate(user._id, {
  //   "subscription.cancelAtPeriodEnd": true,
  //   "subscription.cancelledAt": new Date(),
  // });
  //
  // return { success: true, cancelAtPeriodEnd: true };
  // [/PAYMENTS DISABLED]

  return { disabled: true };
}

// ══════════════════════════════════════════════════════════════════════════
// reactivateSubscription()
// ══════════════════════════════════════════════════════════════════════════
export async function reactivateSubscription() {
  // [PAYMENTS DISABLED] Uncomment when ready to enable Dodo Payments
  //
  // import { getDodo, DODO_PRODUCTS } from "@/lib/dodo";
  //
  // const userId = await getOwnerId();
  // await dbConnect();
  //
  // const user = await User.findOne({ userId });
  // if (!user) return { success: false, error: "User not found." };
  //
  // if (!user.subscription?.cancelAtPeriodEnd) {
  //   return { success: false, error: "Subscription is not pending cancellation." };
  // }
  //
  // if (user.subscription.currentPeriodEnd && new Date() > user.subscription.currentPeriodEnd) {
  //   return { success: false, error: "Billing period has already ended. Please create a new subscription." };
  // }
  //
  // const planKey = user.subscription.plan;
  // const productId = user.subscription.dodoProductId || DODO_PRODUCTS[planKey];
  // if (!productId) {
  //   return { success: false, error: "Cannot determine plan. Please create a new subscription." };
  // }
  //
  // const dodo = getDodo();
  // const customerId = user.subscription.dodoCustomerId;
  //
  // // Create a new subscription (Dodo may not support reactivation directly)
  // const subscription = await dodo.subscriptions.create({
  //   product_id: productId,
  //   quantity: 1,
  //   customer: { customer_id: customerId },
  //   payment_link: true,
  //   return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&plan=${planKey}`,
  //   metadata: { userId: user.userId, plan: planKey, reactivation: "true" },
  // });
  //
  // await User.findByIdAndUpdate(user._id, {
  //   "subscription.dodoSubscriptionId": subscription.subscription_id,
  //   "subscription.cancelAtPeriodEnd": false,
  //   "subscription.cancelledAt": null,
  //   "subscription.cancellationReason": null,
  // });
  //
  // return {
  //   success: true,
  //   subscriptionId: subscription.subscription_id,
  //   paymentLink: subscription.payment_link,
  // };
  // [/PAYMENTS DISABLED]

  return { disabled: true };
}

// ══════════════════════════════════════════════════════════════════════════
// changeSubscriptionPlan(newPlan) — prorated upgrade / scheduled downgrade
// ══════════════════════════════════════════════════════════════════════════
export async function changeSubscriptionPlan(newPlan) {
  const userId = await getOwnerId();
  await dbConnect();

  const user = await User.findOne({ userId });
  if (!user) return { success: false, error: "User not found." };

  const currentPlan = user.subscription?.plan || "trial";
  const status = user.subscription?.status || "trialing";

  // Validate new plan
  if (!PLAN_ORDER.includes(newPlan) || newPlan === "trial") {
    return { success: false, error: `Invalid target plan: ${newPlan}` };
  }
  if (newPlan === currentPlan) {
    return { success: false, error: "You are already on this plan." };
  }

  const newConfig = getPlanConfig(newPlan);

  if (isPlanUpgrade(currentPlan, newPlan)) {
    // ── UPGRADE: immediate switch ──────────────────────────────────────
    // When payments are enabled, Dodo handles proration natively via
    // dodo.subscriptions.changePlan() with proration_billing_mode.
    // For now, just update the plan immediately.

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    await User.findByIdAndUpdate(user._id, {
      "subscription.plan": newPlan,
      "subscription.status": "active",
      "subscription.currentPeriodStart": now,
      "subscription.currentPeriodEnd": periodEnd,
      "subscription.cancelAtPeriodEnd": false,
      "subscription.cancelledAt": null,
      "subscription.cancellationReason": null,
      "subscription.downgradeToPlan": null,
      "subscription.downgradeEffectiveDate": null,
    });

    // [PAYMENTS DISABLED] When Dodo Payments is enabled:
    // import { getDodo, DODO_PRODUCTS } from "@/lib/dodo";
    // const dodo = getDodo();
    // const subId = user.subscription?.dodoSubscriptionId;
    // if (subId) {
    //   await dodo.subscriptions.changePlan(subId, {
    //     product_id: DODO_PRODUCTS[newPlan],
    //     quantity: 1,
    //     proration_billing_mode: "prorated_immediately",
    //   });
    // }

    return {
      success: true,
      action: "upgraded",
      plan: newPlan,
      planName: newConfig.name,
    };
  }

  if (isPlanDowngrade(currentPlan, newPlan)) {
    // ── DOWNGRADE: scheduled at period end ─────────────────────────────
    const periodEnd = user.subscription?.currentPeriodEnd || new Date();

    await User.findByIdAndUpdate(user._id, {
      "subscription.downgradeToPlan": newPlan,
      "subscription.downgradeEffectiveDate": periodEnd,
    });

    return {
      success: true,
      action: "downgrade_scheduled",
      plan: newPlan,
      planName: newConfig.name,
      effectiveDate: periodEnd.toISOString(),
    };
  }

  return { success: false, error: "Unable to determine plan change direction." };
}

// ══════════════════════════════════════════════════════════════════════════
// cancelSubscriptionWithReason(reason) — cancel + store reason
// ══════════════════════════════════════════════════════════════════════════
export async function cancelSubscriptionWithReason(reason) {
  const userId = await getOwnerId();
  await dbConnect();

  const user = await User.findOne({ userId });
  if (!user) return { success: false, error: "User not found." };

  const validReasons = ["too_expensive", "not_using", "switching_competitor", "missing_feature", "other"];
  const safeReason = validReasons.includes(reason) ? reason : null;

  // Store the cancellation reason
  await User.findByIdAndUpdate(user._id, {
    "subscription.cancelAtPeriodEnd": true,
    "subscription.cancelledAt": new Date(),
    "subscription.cancellationReason": safeReason,
  });

  // [PAYMENTS DISABLED] When Dodo Payments is enabled:
  // import { getDodo } from "@/lib/dodo";
  // const dodo = getDodo();
  // const subId = user.subscription?.dodoSubscriptionId;
  // if (subId) {
  //   await dodo.subscriptions.update(subId, { cancel_at_next_billing_date: true });
  // }

  return {
    success: true,
    cancelAtPeriodEnd: true,
    effectiveDate: user.subscription?.currentPeriodEnd?.toISOString() || null,
  };
}

// ══════════════════════════════════════════════════════════════════════════
// getSubscriptionStatus() — ACTIVE (read-only, needed for gating)
// ══════════════════════════════════════════════════════════════════════════
export async function getSubscriptionStatus() {
  const userId = await getOwnerId();
  await dbConnect();

  const user = await User.findOne({ userId });
  if (!user) return { success: false, error: "User not found." };

  const sub = user.subscription || {};
  const usage = user.usage || {};
  const plan = sub.plan || "trial";

  // Use canonical plan config
  const config = getPlanConfig(plan);
  const dmLimit = plan === "trial" ? TRIAL_DM_LIMIT : config.dmLimit;

  const dmsSent = usage.dmsSentThisMonth || 0;
  const topUpRemaining = usage.topUpDmsRemaining || 0;
  const totalAvailable = dmLimit + topUpRemaining;
  const dmsRemaining = Math.max(0, totalAvailable - dmsSent);
  const percentageUsed = totalAvailable > 0 ? Math.round((dmsSent / totalAvailable) * 100) : 0;

  // Trial info
  const trialEndsAt = sub.trialEndsAt ? new Date(sub.trialEndsAt) : null;
  const daysLeftInTrial = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    success: true,
    plan,
    planLabel: config.name,
    status: sub.status || "trialing",
    dmLimit,
    dmLimitDisplay: config.dmLimitDisplay,
    dmsSent,
    dmsRemaining,
    topUpRemaining,
    percentageUsed,
    isApproachingLimit: percentageUsed >= 80,
    isOverLimit: dmsSent >= totalAvailable,
    daysLeftInTrial,
    trialEndsAt: trialEndsAt?.toISOString() || null,
    currentPeriodStart: sub.currentPeriodStart?.toISOString() || null,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || null,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
    cancelledAt: sub.cancelledAt?.toISOString() || null,
    cancellationReason: sub.cancellationReason || null,
    downgradeToPlan: sub.downgradeToPlan || null,
    downgradeEffectiveDate: sub.downgradeEffectiveDate?.toISOString() || null,
    dmsSentTotal: usage.dmsSentTotal || 0,
    topUpEnabled: config.topUpEnabled,
    features: config.features,
    pages: config.pages,
  };
}

// ══════════════════════════════════════════════════════════════════════════
// getLoggedInPlan() — lightweight check for pricing page
// ══════════════════════════════════════════════════════════════════════════
export async function getLoggedInPlan() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return { loggedIn: false };
    const payload = await verifyToken(token);
    if (!payload?.userId) return { loggedIn: false };

    await dbConnect();
    const user = await User.findOne({ userId: payload.userId }).select("subscription.plan subscription.status").lean();
    if (!user) return { loggedIn: false };

    return {
      loggedIn: true,
      plan: user.subscription?.plan || "trial",
      status: user.subscription?.status || "trialing",
    };
  } catch {
    return { loggedIn: false };
  }
}
