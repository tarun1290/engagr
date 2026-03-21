"use client";

import React from 'react';
// [PLANS DISABLED] UpgradePrompt stubbed to return null for Early Access mode.
// The original component renders upgrade CTAs in 3 contexts: quota, feature, page.
// Uncomment the full implementation when enabling paid plans.

import { getPlanConfig } from "@/lib/plans";

const PLAN_BADGE_COLORS = {
  trial:    { bg: 'var(--surface-alt)', text: 'var(--text-muted)', border: 'var(--border)' },
  silver:   { bg: 'var(--surface-alt)', text: 'var(--text-secondary)', border: 'var(--border)' },
  gold:     { bg: 'var(--warning-light)', text: 'var(--warning-dark)', border: 'var(--warning)' },
  platinum: { bg: 'var(--primary-light)', text: 'var(--primary)', border: 'var(--primary-medium)' },
};

function PlanBadge({ plan }) {
  const c = PLAN_BADGE_COLORS[plan] || PLAN_BADGE_COLORS.trial;
  const config = getPlanConfig(plan);
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {config.name}
    </span>
  );
}

const PLAN_HIGHLIGHTS = {
  silver: [
    "500 DMs per month",
    "Unlimited automations",
    "Top-up DM packs",
    "Comment-to-DM + Reel Share",
  ],
  gold: [
    "Unlimited DMs (10,000/mo)",
    "Follower verification gate",
    "Mention detection",
    "Contacts & activity log",
  ],
  platinum: [
    "Unlimited DMs (50,000/mo)",
    "Up to 5 Instagram accounts",
    "API access & white-label",
    "Advanced analytics",
  ],
};

// [PLANS DISABLED] Original full component commented out — see git history or PLANS_ACTIVATION.md
// export default function UpgradePrompt({ featureName, requiredPlan, ... }) { ... }

export default function UpgradePrompt() {
  return null; // [PLANS DISABLED] No upgrade prompts during Early Access
}
// [/PLANS DISABLED]

// Export PlanBadge and PLAN_BADGE_COLORS for use in other components
export { PlanBadge, PLAN_BADGE_COLORS, PLAN_HIGHLIGHTS };
