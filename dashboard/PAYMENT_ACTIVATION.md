# Engagr — Dodo Payments Activation Checklist

All payment code is commented out with `[PAYMENTS DISABLED]` tags.

## Prerequisites
- [ ] Dodo Payments account created and verified at dodopayments.com
- [ ] API key generated from Dodo Dashboard
- [ ] 3 subscription products created in Dodo Dashboard:
  - Engagr Silver (₹499/mo, 7-day trial)
  - Engagr Gold (₹999/mo, 7-day trial)
  - Engagr Platinum (₹1,499/mo, 7-day trial)
- [ ] 3 top-up products created in Dodo Dashboard:
  - 200 DM Top-Up (₹149)
  - 500 DM Top-Up (₹299)
  - 1000 DM Top-Up (₹499)
- [ ] Environment variables set:
  - `DODO_PAYMENTS_API_KEY`
  - `DODO_PAYMENTS_WEBHOOK_SECRET`
  - `DODO_PAYMENTS_ENVIRONMENT` (`test_mode` or `live_mode`)
  - `DODO_SILVER_PRODUCT_ID`, `DODO_GOLD_PRODUCT_ID`, `DODO_PLATINUM_PRODUCT_ID`
  - `DODO_TOPUP_200_PRODUCT_ID`, `DODO_TOPUP_500_PRODUCT_ID`, `DODO_TOPUP_1000_PRODUCT_ID`

## Step 1: Uncomment Dodo Core
- [ ] Uncomment `src/lib/dodo.js` (the `getDodo()` function and DodoPayments import)
- [ ] Remove the stub `getDodo()` that returns null

## Step 2: Uncomment Server Actions
- [ ] Uncomment `createSubscription` body in `src/app/dashboard/billing-actions.js`
- [ ] Uncomment `createTopUpPayment` body
- [ ] Uncomment `verifyPaymentStatus` body
- [ ] Uncomment `cancelSubscription` body
- [ ] Uncomment `reactivateSubscription` body
- [ ] Uncomment the Dodo API calls in `changeSubscriptionPlan`
- [ ] Uncomment the Dodo API call in `cancelSubscriptionWithReason`
- [ ] Remove all `return { disabled: true }` stub return statements

## Step 3: Uncomment Webhook Handler
- [ ] Uncomment all event handling logic in `src/app/api/webhooks/dodo/route.js`
- [ ] Remove the stub POST handler that returns `payments_disabled`
- [ ] Set webhook URL in Dodo Dashboard: `https://your-domain.com/api/webhooks/dodo`
- [ ] Subscribe to events: `subscription.active`, `subscription.renewed`, `subscription.on_hold`, `subscription.cancelled`, `subscription.expired`, `subscription.plan_changed`, `payment.succeeded`, `payment.failed`, `refund.succeeded`

## Step 4: Uncomment Client-Side Checkout
- [ ] Uncomment `initDodoCheckout()`, `openDodoCheckout()`, and `redirectToCheckout()` in `src/lib/dodo-checkout.js`
- [ ] Remove the stub functions that just console.log
- [ ] Install `dodopayments-checkout` package: `npm install dodopayments-checkout`

## Step 5: Uncomment Cron Tasks
- [ ] Uncomment "2. Past-due enforcement" block in `src/app/api/cron/subscription-management/route.js`
- [ ] Uncomment "4. Cancel-at-period-end enforcement" block in the same file

## Step 6: Test (use test_mode)
- [ ] Set `DODO_PAYMENTS_ENVIRONMENT=test_mode`
- [ ] Create a test subscription (Silver)
- [ ] Verify webhooks fire `subscription.active`
- [ ] Test plan change with proration (`prorated_immediately`)
- [ ] Test cancellation (`cancel_at_next_billing_date`)
- [ ] Buy a top-up, verify DMs credited via `payment.succeeded` webhook
- [ ] Test payment failure flow → `subscription.on_hold`

## Step 7: Go Live
- [ ] Set `DODO_PAYMENTS_ENVIRONMENT=live_mode`
- [ ] Recreate products in live mode (IDs change between test/live)
- [ ] Update product ID env vars with live product IDs
- [ ] Update webhook URL to production domain
- [ ] Monitor first few real payments closely

## Files with `[PAYMENTS DISABLED]` tags (8 blocks across 5 files):
1. `src/lib/dodo.js` — Dodo SDK instance (1 block)
2. `src/lib/dodo-checkout.js` — Client-side overlay checkout functions (1 block)
3. `src/app/api/webhooks/dodo/route.js` — All webhook event handlers (1 block)
4. `src/app/dashboard/billing-actions.js` — 7 server action bodies + 2 inline blocks (9 blocks)
5. `src/app/api/cron/subscription-management/route.js` — Past-due + cancel-at-period-end (2 blocks)

## MongoDB Migration Note
If you have existing data with old field names (`razorpayCustomerId`, `razorpaySubscriptionId`, etc.),
run this migration in MongoDB Shell:
```javascript
db.users.updateMany({}, { $rename: {
  "subscription.razorpayCustomerId": "subscription.dodoCustomerId",
  "subscription.razorpaySubscriptionId": "subscription.dodoSubscriptionId",
  "subscription.razorpayPlanId": "subscription.dodoProductId"
}});
db.transactions.updateMany({}, { $rename: {
  "razorpayPaymentId": "dodoPaymentId"
}});
// razorpayOrderId and razorpaySignature can be removed:
db.transactions.updateMany({}, { $unset: { "razorpayOrderId": "", "razorpaySignature": "" }});
db.invoices.updateMany({}, { $rename: {
  "razorpayInvoiceId": "dodoPaymentId"
}});
```
