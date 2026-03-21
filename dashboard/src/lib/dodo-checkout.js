"use client";

// [PAYMENTS DISABLED] Uncomment when ready to enable Dodo Payments checkout
//
// import { DodoPayments } from "dodopayments-checkout";
//
// let initialized = false;
//
// /**
//  * Initialize Dodo overlay checkout (call once per app load).
//  * @param {Object} opts
//  * @param {Function} [opts.onSuccess] — Called when checkout completes successfully
//  * @param {Function} [opts.onError] — Called on checkout error
//  * @param {Function} [opts.onClose] — Called when checkout is closed
//  */
// export function initDodoCheckout({ onSuccess, onError, onClose } = {}) {
//   if (initialized) return;
//   DodoPayments.Initialize({
//     mode: process.env.NEXT_PUBLIC_DODO_ENV === "live_mode" ? "live" : "test",
//     displayType: "overlay",
//     onEvent: (event) => {
//       switch (event.event_type) {
//         case "checkout.status":
//           if (event.data?.status === "succeeded") onSuccess?.(event.data);
//           else if (event.data?.status === "failed") onError?.(event.data);
//           break;
//         case "checkout.error":
//           onError?.(event.data);
//           break;
//         case "checkout.closed":
//           onClose?.();
//           break;
//         case "checkout.redirect_requested":
//           window.location.href = event.data?.message?.redirect_to;
//           break;
//       }
//     },
//   });
//   initialized = true;
// }
//
// /**
//  * Open Dodo checkout overlay for a subscription or payment.
//  * @param {string} checkoutUrl — The checkout URL from createSubscription or createTopUpPayment
//  */
// export function openDodoCheckout(checkoutUrl) {
//   if (!initialized) {
//     // Fallback to redirect if overlay not initialized
//     window.location.href = checkoutUrl;
//     return;
//   }
//   DodoPayments.Checkout.open({
//     checkoutUrl,
//     options: {
//       showTimer: true,
//       showSecurityBadge: true,
//       manualRedirect: true, // Fires checkout.status event instead of auto-redirect
//     },
//   });
// }
//
// /**
//  * Redirect-based checkout fallback (always works, no JS SDK needed).
//  * @param {string} paymentLink — The payment link URL from server action
//  */
// export function redirectToCheckout(paymentLink) {
//   window.location.href = paymentLink;
// }
// [/PAYMENTS DISABLED]

// Stubs — prevent crashes if accidentally called
export function initDodoCheckout() {
  console.log("[PAYMENTS DISABLED] Dodo Checkout initialization skipped.");
}

export function openDodoCheckout() {
  console.log("[PAYMENTS DISABLED] Dodo Checkout would open here.");
}

export function redirectToCheckout() {
  console.log("[PAYMENTS DISABLED] Would redirect to Dodo Checkout.");
}
