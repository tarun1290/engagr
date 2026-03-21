"use client";

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  X,
  Crown,
  ChevronDown,
  AlertTriangle,
  ShoppingCart,
  Sparkles,
  ArrowRight,
  FileText,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PLAN_CONFIG, PLAN_ORDER, getPlanConfig, isPlanUpgrade, isPlanDowngrade } from "@/lib/plans";
import { TOPUP_PACKS } from "@/lib/dodo";
import { PlanBadge, PLAN_BADGE_COLORS, PLAN_HIGHLIGHTS } from "./UpgradePrompt";
import {
  getSubscriptionStatus,
  changeSubscriptionPlan,
  cancelSubscriptionWithReason,
  reactivateSubscription,
  createTopUpOrder,
} from "@/app/dashboard/billing-actions";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_DISPLAY = {
  active: { label: "Active", bg: 'var(--success-light)', color: 'var(--success)', border: 'var(--success)' },
  trialing: { label: "Trial", bg: 'var(--info-light)', color: 'var(--info)', border: 'var(--info)' },
  past_due: { label: "Past Due", bg: 'var(--warning-light)', color: 'var(--warning)', border: 'var(--warning)' },
  cancelled: { label: "Cancelled", bg: 'var(--error-light)', color: 'var(--error)', border: 'var(--error)' },
  expired: { label: "Expired", bg: 'var(--error-light)', color: 'var(--error)', border: 'var(--error)' },
};

/* ── Plan Selection Modal ────────────────────────────────────────────────── */

function PlanModal({ currentPlan, onClose, onSelect }) {
  const plans = PLAN_ORDER.filter(p => p !== "trial");

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--overlay)' }}
      onClick={onClose}
    >
      <div
        className="rounded-[28px] p-8 max-w-3xl w-full shadow-2xl"
        style={{ backgroundColor: 'var(--card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Change Plan</h2>
        <p className="text-[14px] mb-8" style={{ color: 'var(--text-muted)' }}>Choose the plan that fits your needs.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((planKey) => {
            const config = getPlanConfig(planKey);
            const isCurrent = planKey === currentPlan;
            const isUpgrade = isPlanUpgrade(currentPlan, planKey);
            const isDowngrade = isPlanDowngrade(currentPlan, planKey);
            const isPopular = planKey === "gold";
            const badgeColor = PLAN_BADGE_COLORS[planKey];
            const highlights = PLAN_HIGHLIGHTS[planKey] || [];

            return (
              <div
                key={planKey}
                className={cn("rounded-[20px] p-6 relative", isPopular && "ring-2")}
                style={{
                  backgroundColor: 'var(--card)',
                  border: `1px solid ${isCurrent ? badgeColor.border : 'var(--border)'}`,
                  ...(isPopular ? { ringColor: 'var(--primary)' } : {}),
                }}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                  >
                    Most Popular
                  </span>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{config.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>&#8377;{config.price}</span>
                    <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>/mo</span>
                  </div>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--text-placeholder)' }}>
                    {config.dmLimitDisplay} DMs/month
                  </p>
                </div>

                <div className="space-y-2.5 mb-6">
                  {highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check size={14} style={{ color: 'var(--success)' }} className="flex-shrink-0" />
                      <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{h}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl text-[13px] font-bold"
                    style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                  >
                    Current Plan
                  </button>
                ) : isUpgrade ? (
                  <button
                    onClick={() => onSelect(planKey, "upgrade")}
                    className="w-full py-2.5 rounded-xl text-[13px] font-bold transition-all"
                    style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    Upgrade
                  </button>
                ) : (
                  <button
                    onClick={() => onSelect(planKey, "downgrade")}
                    className="w-full py-2.5 rounded-xl text-[13px] font-bold transition-all"
                    style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    Downgrade
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-6 text-[13px] font-medium mx-auto block"
          style={{ color: 'var(--text-muted)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Cancellation Modal ──────────────────────────────────────────────────── */

function CancelModal({ currentPlan, periodEnd, onClose, onCancel }) {
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const config = getPlanConfig(currentPlan);

  const reasons = [
    { value: "too_expensive", label: "Too expensive" },
    { value: "not_using", label: "Not using it enough" },
    { value: "switching_competitor", label: "Switching to another tool" },
    { value: "missing_feature", label: "Missing a feature I need" },
    { value: "other", label: "Other" },
  ];

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await onCancel(reason);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--overlay)' }}
      onClick={onClose}
    >
      <div
        className="rounded-[24px] p-8 max-w-md w-full shadow-2xl space-y-6"
        style={{ backgroundColor: 'var(--card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{ backgroundColor: 'var(--warning-light)' }}
        >
          <AlertTriangle size={28} style={{ color: 'var(--warning)' }} />
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Are you sure you want to cancel?</h3>
          <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>
            Your automations will keep running until <span className="font-bold">{formatDate(periodEnd)}</span>.
          </p>
        </div>

        <div className="rounded-xl p-4 space-y-2"
          style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}
        >
          <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-placeholder)' }}>
            You&apos;ll lose access to:
          </p>
          {config.features
            .filter(f => !getPlanConfig("trial").features.includes(f))
            .slice(0, 4)
            .map((f) => (
              <div key={f} className="flex items-center gap-2">
                <X size={14} style={{ color: 'var(--error)' }} />
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  {f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              </div>
            ))
          }
        </div>

        <div>
          <label className="text-[11px] font-black uppercase tracking-widest mb-2 block"
            style={{ color: 'var(--text-placeholder)' }}
          >
            Why are you cancelling?
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-[14px] font-medium outline-none"
            style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }}
          >
            <option value="">Select a reason...</option>
            {reasons.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-[14px] transition-all"
            style={{ backgroundColor: 'var(--primary)', color: 'white' }}
          >
            Keep My Plan
          </button>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex-1 py-3 rounded-xl font-bold text-[14px] transition-all disabled:opacity-60"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', backgroundColor: 'var(--card)' }}
          >
            {cancelling ? "Cancelling..." : "Cancel Subscription"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Downgrade Confirmation ──────────────────────────────────────────────── */

function DowngradeConfirm({ newPlan, effectiveDate, onClose, onConfirm }) {
  const [confirming, setConfirming] = useState(false);
  const config = getPlanConfig(newPlan);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--overlay)' }}
      onClick={onClose}
    >
      <div
        className="rounded-[24px] p-8 max-w-sm w-full shadow-2xl space-y-6"
        style={{ backgroundColor: 'var(--card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Downgrade to {config.name}?</h3>
          <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>
            This takes effect on <span className="font-bold">{formatDate(effectiveDate)}</span>. You&apos;ll keep your current plan until then.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-[14px]"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--card)' }}
          >
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={confirming}
            className="flex-1 py-3 rounded-xl font-bold text-[14px] disabled:opacity-60"
            style={{ backgroundColor: 'var(--primary)', color: 'white' }}
          >
            {confirming ? "Processing..." : "Confirm Downgrade"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Billing Page ───────────────────────────────────────────────────── */

export default function BillingPage({ onNavigate }) {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(null);
  const [reactivating, setReactivating] = useState(false);
  const [celebrationPlan, setCelebrationPlan] = useState(null);

  const fetchStatus = async () => {
    try {
      const data = await getSubscriptionStatus();
      if (data.success) setSub(data);
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin" size={36} style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="text-center py-20">
        <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>Unable to load subscription info.</p>
      </div>
    );
  }

  const plan = sub.plan;
  const config = getPlanConfig(plan);
  const statusConf = STATUS_DISPLAY[sub.status] || STATUS_DISPLAY.active;
  const badgeColor = PLAN_BADGE_COLORS[plan] || PLAN_BADGE_COLORS.trial;

  // DM usage bar
  const dmPercent = sub.dmLimitDisplay === "Unlimited"
    ? Math.min(Math.round((sub.dmsSent / config.dmLimit) * 100), 100)
    : sub.percentageUsed;
  const dmBarColor = dmPercent >= 100 ? 'var(--error)' : dmPercent >= 80 ? 'var(--warning)' : 'var(--success)';

  // Status text
  let statusText = statusConf.label;
  if (sub.status === "trialing" && sub.daysLeftInTrial > 0) {
    statusText = `Trial — ${sub.daysLeftInTrial} day${sub.daysLeftInTrial !== 1 ? 's' : ''} left`;
  }
  if (sub.cancelAtPeriodEnd) {
    statusText = `Cancels on ${formatDate(sub.currentPeriodEnd)}`;
  }

  const handlePlanSelect = async (newPlan, direction) => {
    if (direction === "downgrade") {
      setShowPlanModal(false);
      setShowDowngradeConfirm(newPlan);
      return;
    }
    // Upgrade — immediate
    try {
      const res = await changeSubscriptionPlan(newPlan);
      if (res.success) {
        setShowPlanModal(false);
        setCelebrationPlan(newPlan);
        fetchStatus();
      } else {
        toast.error(res.error || "Failed to change plan.");
      }
    } catch (err) {
      toast.error("Something went wrong.");
    }
  };

  const handleDowngradeConfirm = async () => {
    try {
      const res = await changeSubscriptionPlan(showDowngradeConfirm);
      if (res.success) {
        toast.success(`Downgrade to ${res.planName} scheduled for ${formatDate(res.effectiveDate)}.`);
        setShowDowngradeConfirm(null);
        fetchStatus();
      } else {
        toast.error(res.error || "Failed to schedule downgrade.");
      }
    } catch {
      toast.error("Something went wrong.");
    }
  };

  const handleCancel = async (reason) => {
    try {
      const res = await cancelSubscriptionWithReason(reason);
      if (res.success) {
        toast.success("Subscription cancelled. You can reactivate anytime.");
        setShowCancelModal(false);
        fetchStatus();
      } else {
        toast.error(res.error || "Failed to cancel.");
      }
    } catch {
      toast.error("Something went wrong.");
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      const res = await reactivateSubscription();
      if (res.success || res.disabled) {
        toast.success("Subscription reactivated!");
        fetchStatus();
      } else {
        toast.error(res.error || "Failed to reactivate.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setReactivating(false);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Billing</h2>
        <p className="text-[14px] mt-1" style={{ color: 'var(--text-muted)' }}>
          Manage your subscription, view usage, and purchase top-ups.
        </p>
      </div>

      {/* ── Section A: Current Plan Card ──────────────────────────────────── */}
      <div className="rounded-[28px] p-8 shadow-sm"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{config.name}</h3>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: badgeColor.bg, color: badgeColor.text, border: `1px solid ${badgeColor.border}` }}
              >
                {statusText}
              </span>
            </div>
            {sub.currentPeriodStart && sub.currentPeriodEnd && plan !== "trial" && (
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                {formatDate(sub.currentPeriodStart)} — {formatDate(sub.currentPeriodEnd)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPlanModal(true)}
              className="px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2"
              style={{ backgroundColor: 'var(--primary)', color: 'white' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Sparkles size={16} /> Change Plan
            </button>
          </div>
        </div>

        {/* DM Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>
              DM Usage
            </p>
            <p className="text-[14px] font-bold" style={{ color: 'var(--text-secondary)' }}>
              {sub.dmLimitDisplay === "Unlimited" ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} style={{ color: 'var(--success)' }} /> Unlimited DMs
                </span>
              ) : (
                `${sub.dmsSent} / ${sub.dmLimit} DMs used`
              )}
            </p>
          </div>
          {sub.dmLimitDisplay !== "Unlimited" && (
            <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-alt)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(dmPercent, 100)}%`, backgroundColor: dmBarColor }}
              />
            </div>
          )}
          {sub.topUpRemaining > 0 && (
            <p className="text-[13px] flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
              <ShoppingCart size={14} /> + {sub.topUpRemaining} top-up DMs remaining
            </p>
          )}
        </div>

        {/* Trial expiry notice */}
        {plan === "trial" && sub.daysLeftInTrial <= 2 && sub.daysLeftInTrial > 0 && (
          <div className="mt-6 flex items-center gap-4 px-5 py-4 rounded-xl"
            style={{ backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning)' }}
          >
            <Clock size={20} style={{ color: 'var(--warning)' }} />
            <div className="flex-1">
              <p className="text-[14px] font-bold" style={{ color: 'var(--warning-dark)' }}>
                Your trial ends in {sub.daysLeftInTrial} day{sub.daysLeftInTrial !== 1 ? "s" : ""}
              </p>
              <p className="text-[12px]" style={{ color: 'var(--warning-dark)' }}>Upgrade now to keep your automations running.</p>
            </div>
            <button
              onClick={() => setShowPlanModal(true)}
              className="px-4 py-2 text-[12px] font-bold rounded-xl"
              style={{ backgroundColor: 'var(--warning)', color: 'white' }}
            >
              Upgrade Now
            </button>
          </div>
        )}

        {/* Cancellation reactivation */}
        {sub.cancelAtPeriodEnd && (
          <div className="mt-6 flex items-center gap-4 px-5 py-4 rounded-xl"
            style={{ backgroundColor: 'var(--error-light)', border: '1px solid var(--error)' }}
          >
            <AlertTriangle size={20} style={{ color: 'var(--error)' }} />
            <div className="flex-1">
              <p className="text-[14px] font-bold" style={{ color: 'var(--error-dark)' }}>
                Your plan will end on {formatDate(sub.currentPeriodEnd)}
              </p>
            </div>
            <button
              onClick={handleReactivate}
              disabled={reactivating}
              className="px-4 py-2 text-[12px] font-bold rounded-xl disabled:opacity-60"
              style={{ backgroundColor: 'var(--primary)', color: 'white' }}
            >
              {reactivating ? "Reactivating..." : "Reactivate"}
            </button>
          </div>
        )}

        {/* Cancel link */}
        {plan !== "trial" && !sub.cancelAtPeriodEnd && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="mt-6 text-[13px] font-medium transition-colors"
            style={{ color: 'var(--text-placeholder)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-placeholder)'}
          >
            Cancel subscription
          </button>
        )}

        {/* Downgrade notice */}
        {sub.downgradeToPlan && (
          <div className="mt-4 flex items-center gap-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            <ChevronDown size={14} />
            Downgrade to {getPlanConfig(sub.downgradeToPlan).name} scheduled for {formatDate(sub.downgradeEffectiveDate)}
          </div>
        )}
      </div>

      {/* ── Section C: Top-Up Packs (Silver only) ─────────────────────────── */}
      {plan === "silver" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Need more DMs?</h3>
              {sub.topUpRemaining > 0 && (
                <p className="text-[13px] mt-1" style={{ color: 'var(--accent)' }}>
                  {sub.topUpRemaining} top-up DMs remaining
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(TOPUP_PACKS).map(([key, pack]) => {
              const isBestValue = key === "500";
              return (
                <div
                  key={key}
                  className="rounded-[20px] p-6 relative shadow-sm"
                  style={{ backgroundColor: 'var(--card)', border: `1px solid ${isBestValue ? 'var(--accent)' : 'var(--border)'}` }}
                >
                  {isBestValue && (
                    <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                    >
                      Best Value
                    </span>
                  )}
                  <p className="text-2xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
                    {pack.dms} DMs
                  </p>
                  <p className="text-lg font-bold mb-4" style={{ color: 'var(--text-secondary)' }}>
                    &#8377;{pack.amount / 100}
                  </p>
                  <button
                    onClick={() => {
                      // [PAYMENTS DISABLED] When live, redirect to Dodo Checkout
                      toast.info("Payments are not yet enabled. Check back soon!");
                    }}
                    className="w-full py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <ShoppingCart size={14} /> Buy
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-[12px] mt-3" style={{ color: 'var(--text-placeholder)' }}>
            Top-up DMs never expire. They carry over month to month.
          </p>
        </div>
      )}

      {/* ── Section D: Payment Method ─────────────────────────────────────── */}
      <div className="rounded-[28px] p-8 shadow-sm"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>Payment Method</h3>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}
          >
            <CreditCard size={22} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-medium" style={{ color: 'var(--text-muted)' }}>
              No payment method on file
            </p>
            <p className="text-[12px]" style={{ color: 'var(--text-placeholder)' }}>
              Payment method will be added when you subscribe.
            </p>
          </div>
          <button
            className="px-4 py-2 rounded-xl text-[13px] font-bold transition-all"
            style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            onClick={() => toast.info("Payments are not yet enabled.")}
          >
            Add Payment Method
          </button>
        </div>
      </div>

      {/* ── Section E: Invoice History ────────────────────────────────────── */}
      <div className="rounded-[28px] p-8 shadow-sm"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>Invoices</h3>
        <div className="text-center py-12">
          <FileText size={36} className="mx-auto mb-3" style={{ color: 'var(--text-placeholder)' }} />
          <p className="text-[14px] font-medium" style={{ color: 'var(--text-muted)' }}>No invoices yet</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text-placeholder)' }}>
            Your first invoice will appear after your first payment.
          </p>
        </div>
      </div>

      {/* ── Section F: Usage Stats ────────────────────────────────────────── */}
      <div className="rounded-[28px] p-8 shadow-sm"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>Usage Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "DMs Sent (Month)", value: sub.dmsSent, color: 'var(--primary)' },
            { label: "DMs Sent (Total)", value: sub.dmsSentTotal, color: 'var(--accent)' },
            { label: "Monthly Limit", value: sub.dmLimitDisplay, color: 'var(--info)' },
            { label: "Top-Up Balance", value: sub.topUpRemaining, color: 'var(--warning)' },
          ].map((stat) => (
            <div key={stat.label} className="p-5 rounded-xl"
              style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}
            >
              <p className="text-[10px] font-black uppercase tracking-widest mb-2"
                style={{ color: 'var(--text-placeholder)' }}
              >
                {stat.label}
              </p>
              <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {showPlanModal && (
        <PlanModal
          currentPlan={plan}
          onClose={() => setShowPlanModal(false)}
          onSelect={handlePlanSelect}
        />
      )}
      {showCancelModal && (
        <CancelModal
          currentPlan={plan}
          periodEnd={sub.currentPeriodEnd}
          onClose={() => setShowCancelModal(false)}
          onCancel={handleCancel}
        />
      )}
      {showDowngradeConfirm && (
        <DowngradeConfirm
          newPlan={showDowngradeConfirm}
          effectiveDate={sub.currentPeriodEnd}
          onClose={() => setShowDowngradeConfirm(null)}
          onConfirm={handleDowngradeConfirm}
        />
      )}

      {/* ── Celebration Modal (post-upgrade) ──────────────────────────────── */}
      {celebrationPlan && (() => {
        const cConfig = getPlanConfig(celebrationPlan);
        const cBadge = PLAN_BADGE_COLORS[celebrationPlan] || PLAN_BADGE_COLORS.silver;
        return (
          <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            style={{ backgroundColor: 'var(--overlay)' }}
          >
            <div className="rounded-[28px] p-10 max-w-md w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300"
              style={{ backgroundColor: 'var(--card)' }}
            >
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
                style={{ backgroundColor: cBadge.bg, border: `2px solid ${cBadge.border}` }}
              >
                <Sparkles size={36} style={{ color: cBadge.text }} />
              </div>
              <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                Welcome to {cConfig.name}!
              </h2>
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Your plan has been upgraded successfully. All {cConfig.name} features are now unlocked.
              </p>
              <div className="space-y-2 text-left px-4">
                {(PLAN_HIGHLIGHTS[celebrationPlan] || []).map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 size={15} style={{ color: 'var(--success)' }} className="flex-shrink-0" />
                    <span className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setCelebrationPlan(null)}
                className="w-full py-3.5 rounded-xl font-bold text-[14px] transition-all"
                style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Start Using {cConfig.name}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
