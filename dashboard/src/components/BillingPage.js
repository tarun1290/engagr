"use client";

// [PLANS DISABLED] BillingPage replaced with Early Access placeholder.
// The full billing UI (plan card, top-up packs, invoices, cancel/reactivate modals)
// is preserved in git history. Uncomment when enabling paid plans.
// See PLANS_ACTIVATION.md for the full restoration checklist.

import React from 'react';
import { Sparkles } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
        style={{ backgroundColor: 'var(--success-light)', border: '1px solid var(--success)' }}
      >
        <Sparkles size={36} style={{ color: 'var(--success)' }} />
      </div>

      <h2 className="text-3xl font-black tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>
        Early Access
      </h2>
      <p className="text-[15px] font-medium mb-4 max-w-md" style={{ color: 'var(--text-muted)' }}>
        You have full access to all Engagr features during our Early Access period — completely free.
      </p>
      <p className="text-[13px] max-w-sm" style={{ color: 'var(--text-placeholder)' }}>
        Paid plans with additional limits and premium support will be available soon. We&apos;ll notify you before any changes.
      </p>

      <div
        className="mt-8 px-6 py-3 rounded-2xl inline-flex items-center gap-2"
        style={{ backgroundColor: 'var(--success-light)', border: '1px solid var(--success)' }}
      >
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--success)' }} />
        <span className="text-[13px] font-bold" style={{ color: 'var(--success)' }}>
          All features unlocked
        </span>
      </div>
    </div>
  );
}
