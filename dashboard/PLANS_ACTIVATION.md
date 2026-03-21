# Engagr — Plans Activation Checklist

All subscription tier enforcement and billing UI is commented out with `[PLANS DISABLED]` tags.
The app currently runs in "Early Access" mode — everything is free and unlocked.

## Step 1: Restore Feature Gating (`src/lib/gating.js`)
- [ ] Uncomment all original function implementations
- [ ] Remove the always-allow stubs
- [ ] Re-enable the `import` from `./plans`

## Step 2: Restore Server Action Plan Checks (`src/app/dashboard/actions.js`)
- [ ] Uncomment gating imports (`canUseFeature`, `canAccessPage`, `canConnectMoreAccounts`, `getPlanConfig`)
- [ ] Uncomment `getContacts` page gate (contacts requires Gold+)
- [ ] Uncomment `getAllInteractions` page gate (activity requires Gold+)
- [ ] Uncomment `saveAutomation` plan checks (expired block, automation limit, follow_gate, mention_detection)
- [ ] Uncomment `toggleAutomation` expired/cancelled block
- [ ] Uncomment `saveDiscoveredAccount` Instagram account limit check

## Step 3: Restore Billing & Pricing UI
- [ ] Restore full `BillingPage.js` from git history (plan card, top-ups, invoices, cancel/reactivate modals)
- [ ] Restore `UpgradePrompt.js` full component (quota/feature/page contexts) from git history
- [ ] Restore pricing page header from "Free During Early Access" back to "Choose Your Plan"
- [ ] Restore pricing page bottom CTA from "Get Started — It's Free" back to "Start Your Free Trial Today"

## Step 4: Restore Sidebar (`src/components/Sidebar.js`)
- [ ] Re-add Billing, Analytics, API Keys menu items with `gatedPage` entries
- [ ] Re-add `Lock` icon for gated pages
- [ ] Re-add `getSubscriptionStatus` call and plan badge / DM usage bar in footer
- [ ] Re-add `PLAN_BADGE_COLORS` import from UpgradePrompt
- [ ] Remove "Early Access" badge

## Step 5: Restore Dashboard Page (`src/app/dashboard/page.js`)
- [ ] Re-add `BillingPage`, `UpgradePrompt` imports
- [ ] Re-add `getSubscriptionStatus`, `getTrialWarning`, `getDmQuotaWarning`, `canAccessPage` imports
- [ ] Re-add `subData` state and `getSubscriptionStatus()` call in useEffect
- [ ] Re-add `renderGatedPage()` function and apply to Contacts, Activity, Analytics, API Keys tabs
- [ ] Re-add Billing tab in `renderContent` switch
- [ ] Re-add trial expiry banner, trial expired modal, DM quota warning on Home
- [ ] Re-add DM Usage stat card with real subscription data (replace "Unlimited / Early Access" card)

## Step 6: Restore Automation Page (`src/components/Automation.js`)
- [ ] Re-add `getSubscriptionStatus`, `canUseFeature`, `UpgradePrompt` imports
- [ ] Re-add `subData`, `showFollowGatePrompt`, `showMentionPrompt` state
- [ ] Re-add `getSubscriptionStatus()` call in useEffect
- [ ] Re-add feature gating in `handleFollowToggle` and `handleMentionsToggle`
- [ ] Re-add expired subscription overlay, Follow Gate prompt modal, Mention Detection prompt modal
- [ ] Re-add Gold badge on Mentions Tracker section
- [ ] Re-add DM exhausted warning banner
- [ ] Re-add `isExpired` and `dmExhausted` derived from real subscription data

## Step 7: Restore Notifications (`src/components/NotificationCenter.js`)
- [ ] Re-add `getSubscriptionStatus`, `getTrialWarning`, `getDmQuotaWarning` imports
- [ ] Re-add `Promise.all([getNotifications(), getSubscriptionStatus()])` call
- [ ] Re-add system notification generation for trial/quota warnings

## Step 8: Restore Cron Jobs (`src/app/api/cron/subscription-management/route.js`)
- [ ] Uncomment "1. Trial expiry" block
- [ ] (Also uncomment [PAYMENTS DISABLED] blocks 2 and 4 when Dodo is enabled)

## Step 9: Restore Admin Dashboard (`src/app/admin/dashboard/page.js`)
- [ ] Uncomment "Revenue & Plans" section (MRR, Active Subscribers, Plan Breakdown, Trial Users cards)

## Step 10: Verify
- [ ] `npm run build` passes with zero errors
- [ ] All dashboard pages load correctly
- [ ] Gated pages show UpgradePrompt for trial/silver users
- [ ] Feature gates work on follow_gate and mention_detection
- [ ] Trial expiry warnings appear when trial < 2 days
- [ ] DM quota warnings appear at 80% usage
- [ ] Billing page shows correct plan, usage, and action buttons
- [ ] Sidebar shows plan badge, DM bar, and lock icons
- [ ] No console errors

## Files with `[PLANS DISABLED]` tags:
1. `src/lib/gating.js` — All 7 gating functions stubbed (1 file, 7 stubs)
2. `src/app/dashboard/actions.js` — 5 plan check blocks commented out
3. `src/components/Sidebar.js` — Full rewrite (menu items, lock icons, plan badge, DM bar removed)
4. `src/components/UpgradePrompt.js` — Full component stubbed to return null
5. `src/components/BillingPage.js` — Full component replaced with Early Access placeholder
6. `src/components/Automation.js` — Feature gates, overlays, and prompts removed
7. `src/components/NotificationCenter.js` — System notifications for trial/quota removed
8. `src/app/dashboard/page.js` — Gated pages, trial/quota warnings, DM usage card simplified
9. `src/app/pricing/page.js` — Header and CTA updated for Early Access
10. `src/app/admin/dashboard/page.js` — Revenue & Plans section hidden
11. `src/app/api/cron/subscription-management/route.js` — Trial expiry block commented out
