"use client";

import React from 'react';
import {
  Lock,
  Check,
  ArrowRight,
  AlertTriangle,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { PLAN_CONFIG, getPlanConfig } from "@/lib/plans";

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

// Feature highlights for each plan
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

/**
 * UpgradePrompt — reusable component shown when a gated feature/page is encountered.
 *
 * @param {string} featureName    — human-readable name (e.g. "Contact Management")
 * @param {string} requiredPlan   — "silver" | "gold" | "platinum"
 * @param {number} requiredPlanPrice — price in INR
 * @param {string} context        — "page" | "feature" | "quota"
 * @param {object} quotaData      — { dmsSent, dmLimit, topUpRemaining, level } (for quota context)
 * @param {string} currentPlan    — user's current plan
 * @param {function} onUpgrade    — callback when upgrade clicked
 * @param {function} onTopUp      — callback when top-up clicked (quota context)
 * @param {function} onDismiss    — callback to dismiss (feature context)
 * @param {function} onComparePlans — callback for "Compare all plans" link
 */
export default function UpgradePrompt({
  featureName,
  requiredPlan = "gold",
  requiredPlanPrice,
  context = "page",
  quotaData,
  currentPlan = "trial",
  onUpgrade,
  onTopUp,
  onDismiss,
  onComparePlans,
}) {
  const planConfig = getPlanConfig(requiredPlan);
  const price = requiredPlanPrice || planConfig.price;
  const highlights = PLAN_HIGHLIGHTS[requiredPlan] || PLAN_HIGHLIGHTS.gold;

  // ── QUOTA context: banner at top of page ────────────────────────────────
  if (context === "quota") {
    const isCritical = quotaData?.level === "critical";
    const bgColor = isCritical ? 'var(--error-light)' : 'var(--warning-light)';
    const borderColor = isCritical ? 'var(--error)' : 'var(--warning)';
    const textColor = isCritical ? 'var(--error-dark)' : 'var(--warning-dark)';
    const iconColor = isCritical ? 'var(--error)' : 'var(--warning)';

    return (
      <div
        className="flex items-center gap-4 px-6 py-4 rounded-2xl"
        style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}
      >
        <AlertTriangle size={20} className="flex-shrink-0" style={{ color: iconColor }} />
        <div className="flex-1">
          <p className="text-[14px] font-bold" style={{ color: textColor }}>
            {isCritical
              ? "You've reached your monthly DM limit. Automations are paused."
              : `You've used ${quotaData?.dmsSent || 0} of ${quotaData?.dmLimit || 0} DMs this month.`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {currentPlan === "silver" && (
            <button
              onClick={onTopUp}
              className="px-4 py-2 text-[12px] font-bold rounded-xl transition-colors flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--card)', border: `1px solid ${borderColor}`, color: textColor }}
            >
              <ShoppingCart size={14} /> Buy DMs
            </button>
          )}
          <button
            onClick={onUpgrade}
            className="px-4 py-2 text-[12px] font-bold rounded-xl transition-colors"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--btn-primary-text)' }}
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    );
  }

  // ── FEATURE context: inline card ────────────────────────────────────────
  if (context === "feature") {
    return (
      <div
        className="flex items-center gap-4 p-4 rounded-2xl"
        style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-medium)' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--primary)', color: 'white' }}
        >
          <Lock size={18} />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>
            {featureName} requires {planConfig.name}
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Upgrade for &#8377;{price}/mo to unlock this feature.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onUpgrade}
            className="px-4 py-2 text-[12px] font-bold rounded-xl transition-colors flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--btn-primary-text)' }}
          >
            <Sparkles size={14} /> Upgrade
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-2 text-[12px] font-medium rounded-xl transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── PAGE context: full-page centered layout ─────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
        style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-medium)' }}
      >
        <Lock size={36} style={{ color: 'var(--accent)' }} />
      </div>

      <h2 className="text-3xl font-black tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>
        Unlock {featureName}
      </h2>
      <p className="text-[15px] font-medium mb-8 max-w-md" style={{ color: 'var(--text-muted)' }}>
        This feature is available on the <PlanBadge plan={requiredPlan} /> plan and above.
      </p>

      <div
        className="rounded-[24px] p-8 max-w-sm w-full mb-8 text-left shadow-sm"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>&#8377;{price}</span>
          <span className="text-[14px] font-medium" style={{ color: 'var(--text-muted)' }}>/month</span>
        </div>

        <div className="space-y-3 mb-8">
          {highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-3">
              <Check size={16} style={{ color: 'var(--accent)' }} className="flex-shrink-0" />
              <span className="text-[14px] font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onUpgrade}
          className="w-full py-3.5 rounded-xl font-bold text-[14px] transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          Upgrade to {planConfig.name} <ArrowRight size={16} />
        </button>
      </div>

      {onComparePlans && (
        <button
          onClick={onComparePlans}
          className="text-[14px] font-bold transition-colors"
          style={{ color: 'var(--primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          Compare all plans
        </button>
      )}
    </div>
  );
}

// Export PlanBadge and PLAN_BADGE_COLORS for use in other components
export { PlanBadge, PLAN_BADGE_COLORS, PLAN_HIGHLIGHTS };
