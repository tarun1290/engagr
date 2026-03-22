"use client";

import React, { useState } from "react";
import { Instagram, Trash2, ShieldOff, AlertTriangle, CheckCircle2, ExternalLink, User, Mail, AtSign, Brain, ShoppingBag, CreditCard, Building2, Palette, Users2 } from "lucide-react";
import { deauthorizeInstagram, deleteAccountData, updateAccountType } from "@/app/settings/actions";
import ManageAccounts from "./ManageAccounts";

const BASE_URL = "https://engagr-dm.vercel.app";

function SectionCard({ title, description, icon: Icon, iconColor, children }) {
  return (
    <div className="rounded-[24px] overflow-hidden theme-transition" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="px-8 py-6 flex items-center gap-4" style={{ borderBottom: '1px solid var(--surface-alt)' }}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: iconColor || 'var(--text-placeholder)' }}
        >
          <Icon size={18} />
        </div>
        <div>
          <h3 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <p className="text-[13px] font-medium" style={{ color: 'var(--text-placeholder)' }}>{description}</p>
        </div>
      </div>
      <div className="px-8 py-6">{children}</div>
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel, danger = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: 'var(--overlay)' }}>
      <div className="rounded-[24px] p-8 max-w-sm w-full space-y-6 shadow-2xl" style={{ backgroundColor: 'var(--card)' }}>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
          style={{ backgroundColor: danger ? 'var(--error-light)' : 'var(--warning-light)' }}
        >
          <AlertTriangle size={22} style={{ color: danger ? 'var(--error)' : 'var(--warning)' }} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', backgroundColor: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-alt)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              backgroundColor: danger ? 'var(--btn-destructive-bg)' : 'var(--warning)',
              color: danger ? 'var(--btn-destructive-text)' : '#fff',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = danger ? 'var(--btn-destructive-hover)' : 'var(--warning-dark)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = danger ? 'var(--btn-destructive-bg)' : 'var(--warning)'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-8 max-w-2xl theme-transition">
      <div>
        <div className="h-8 w-40 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
        <div className="h-4 w-72 rounded mt-2 animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-[24px] overflow-hidden" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="px-8 py-6 flex items-center gap-4" style={{ borderBottom: '1px solid var(--surface-alt)' }}>
            <div className="w-10 h-10 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-40 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
              <div className="h-3 w-56 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
            </div>
          </div>
          <div className="px-8 py-6 space-y-3">
            <div className="h-4 w-full rounded animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
            <div className="h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
            <div className="h-10 w-48 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Settings({ stats }) {
  const [accountType, setAccountType] = useState(stats?.accountType || null);
  const [accountTypeSaving, setAccountTypeSaving] = useState(false);
  const [accountTypeSaved, setAccountTypeSaved] = useState(false);
  const [deauthLoading, setDeauthLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeauthConfirm, setShowDeauthConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deauthDone, setDeauthDone] = useState(false);

  const handleDeauthorize = async () => {
    setShowDeauthConfirm(false);
    setDeauthLoading(true);
    try {
      await deauthorizeInstagram();
      setDeauthDone(true);
    } catch (e) {
      console.error(e);
    } finally {
      setDeauthLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setDeleteLoading(true);
    await deleteAccountData(); // redirects to /sign-up on success
  };

  if (!stats) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-8 max-w-2xl theme-transition">
      <div>
        <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Settings</h2>
        <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-placeholder)' }}>Manage your account, privacy and data.</p>
      </div>

      {/* Account Type */}
      <SectionCard
        icon={Building2}
        iconColor="var(--primary)"
        title="Account Type"
        description="How you use Engagr"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "creator", label: "Creator", icon: Palette, color: "#EC4899" },
              { value: "business", label: "Business", icon: Building2, color: "#4F46E5" },
              { value: "agency", label: "Agency", icon: Users2, color: "#0EA5E9" },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = accountType === t.value;
              return (
                <button
                  key={t.value}
                  onClick={async () => {
                    setAccountType(t.value);
                    setAccountTypeSaving(true);
                    setAccountTypeSaved(false);
                    await updateAccountType(t.value);
                    setAccountTypeSaving(false);
                    setAccountTypeSaved(true);
                    setTimeout(() => setAccountTypeSaved(false), 2000);
                  }}
                  disabled={accountTypeSaving}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all disabled:opacity-60"
                  style={{
                    backgroundColor: isActive ? `${t.color}0D` : "var(--surface-alt)",
                    border: `2px solid ${isActive ? t.color : "var(--border)"}`,
                  }}
                >
                  <Icon size={20} style={{ color: isActive ? t.color : "var(--text-muted)" }} />
                  <span className="text-xs font-black" style={{ color: isActive ? t.color : "var(--text-secondary)" }}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
          {accountTypeSaving && (
            <p className="text-[11px] font-bold animate-pulse" style={{ color: "var(--text-placeholder)" }}>Saving...</p>
          )}
          {accountTypeSaved && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} style={{ color: "var(--success)" }} />
              <p className="text-[11px] font-bold" style={{ color: "var(--success)" }}>Account type updated</p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Manage Instagram Accounts */}
      <ManageAccounts />

      {/* Connected Account (Legacy) */}
      <SectionCard
        icon={Instagram}
        iconColor="var(--primary)"
        title="Instagram Connection"
        description="Your connected business account"
      >
        {stats?.instagram?.isConnected ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
              {stats.instagram.profilePic && (
                <img
                  src={stats.instagram.profilePic}
                  alt=""
                  className="w-12 h-12 rounded-full shadow-sm object-cover"
                  style={{ border: '2px solid var(--card)' }}
                />
              )}
              <div>
                <p className="font-black text-base" style={{ color: 'var(--text-primary)' }}>@{stats.instagram.username}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--success)' }} />
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--success)' }}>Connected</span>
                </div>
              </div>
            </div>

            {deauthDone ? (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
                style={{ color: 'var(--success)', backgroundColor: 'var(--success-light)', border: '1px solid var(--border)' }}
              >
                <CheckCircle2 size={16} /> Instagram disconnected successfully. Refresh to update.
              </div>
            ) : (
              <button
                onClick={() => setShowDeauthConfirm(true)}
                disabled={deauthLoading}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
                style={{ border: '1px solid var(--warning-light)', backgroundColor: 'var(--warning-light)', color: 'var(--warning-dark)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--warning-light)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--warning-light)'}
              >
                <ShieldOff size={16} />
                {deauthLoading ? "Disconnecting..." : "Disconnect Instagram"}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm font-medium" style={{ color: 'var(--text-placeholder)' }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--text-muted)' }} />
            No Instagram account connected.
          </div>
        )}
      </SectionCard>

      {/* Deauthorize Info */}
      <SectionCard
        icon={ShieldOff}
        iconColor="var(--warning)"
        title="Deauthorize App"
        description="Remove Engagr access from your Meta account"
      >
        <div className="space-y-4">
          <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            You can revoke Engagr&apos;s access to your Instagram and Facebook data directly from Meta&apos;s settings. This removes all permissions granted to the app.
          </p>
          <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
            <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>Meta Deauthorize Callback URL</p>
            <code className="text-xs font-mono break-all" style={{ color: 'var(--primary)' }}>
              {BASE_URL}/api/auth/deauthorize
            </code>
          </div>
          <a
            href="https://www.facebook.com/settings?tab=applications"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            Manage App Permissions on Facebook <ExternalLink size={14} />
          </a>
        </div>
      </SectionCard>

      {/* Data Deletion */}
      <SectionCard
        icon={Trash2}
        iconColor="var(--error)"
        title="Data Deletion"
        description="Permanently delete your account and all associated data"
      >
        <div className="space-y-4">
          <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Deletes your account, Instagram tokens, all recorded events, automation settings, and contact data from our systems. This action is <strong style={{ color: 'var(--text-secondary)' }}>irreversible</strong>.
          </p>

          <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
            <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>Meta Data Deletion Callback URL</p>
            <code className="text-xs font-mono break-all" style={{ color: 'var(--primary)' }}>
              {BASE_URL}/api/auth/data-deletion
            </code>
          </div>

          <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
            <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>Data Deletion Status URL</p>
            <code className="text-xs font-mono break-all" style={{ color: 'var(--primary)' }}>
              {BASE_URL}/data-deletion-status
            </code>
          </div>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteLoading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
            style={{ border: '1px solid var(--error-light)', backgroundColor: 'var(--error-light)', color: 'var(--error)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--error-light)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--error-light)'}
          >
            <Trash2 size={16} />
            {deleteLoading ? "Deleting..." : "Delete My Account & Data"}
          </button>
        </div>
      </SectionCard>

      {/* AI Settings — admin-gated, completely hidden if not enabled */}
      {stats?.aiFeatureEnabled && (
        <SectionCard title="AI Product Detection" description="AI-powered product identification for shared reels" icon={Brain} iconColor="#7c3aed">
          <div className="px-8 py-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>AI Provider</span>
              <span className="text-[13px] font-medium px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-muted)' }}>
                {(process.env.NEXT_PUBLIC_AI_PROVIDER || 'claude').toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Detections this month</span>
              <span className="text-[13px] font-black" style={{ color: 'var(--primary)' }}>
                {stats?.usage?.aiDetectionsThisMonth || 0}
              </span>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--surface-alt)' }}>
              <p className="text-[12px] font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Affiliate Links</p>
              <p className="text-[11px]" style={{ color: 'var(--text-placeholder)' }}>
                Coming soon. Currently, all links use direct product search URLs. You can override any link with your own URL from the Links page.
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Beta Shopify teaser — hidden when admin has enabled the real feature */}
      {!stats?.smartFeaturesEnabled?.shopify && (
        <div className="rounded-[24px] overflow-hidden theme-transition" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="px-8 py-6 flex items-center gap-4" style={{ borderBottom: '1px solid var(--surface-alt)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-placeholder)' }}>
              <ShoppingBag size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Shopify Integration</h3>
                <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(124, 58, 237, 0.12)', color: '#7C3AED' }}>Beta</span>
              </div>
              <p className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>Connect your Shopify store to sync products and enable AI-powered product recommendations in DMs</p>
            </div>
          </div>
          <div className="px-8 py-4">
            <span className="text-[12px] font-bold" style={{ color: 'var(--primary)' }}>Learn more &rarr;</span>
          </div>
        </div>
      )}

      <div className="rounded-[24px] overflow-hidden theme-transition" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="px-8 py-6 flex items-center gap-4" style={{ borderBottom: '1px solid var(--surface-alt)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-placeholder)' }}>
            <CreditCard size={18} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Subscription Plans</h3>
              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(124, 58, 237, 0.12)', color: '#7C3AED' }}>Beta</span>
            </div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>Flexible plans launching soon. You&apos;re on Early Access — all features free.</p>
          </div>
        </div>
        <div className="px-8 py-4">
          <span className="text-[12px] font-bold" style={{ color: 'var(--primary)' }}>Learn more &rarr;</span>
        </div>
      </div>

      {/* Confirm Dialogs */}
      {showDeauthConfirm && (
        <ConfirmDialog
          title="Disconnect Instagram?"
          message="This will remove your Instagram access tokens and disconnect automation. You can reconnect at any time."
          confirmLabel="Yes, Disconnect"
          onConfirm={handleDeauthorize}
          onCancel={() => setShowDeauthConfirm(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete all data?"
          message="This permanently deletes your account, all events, tokens, and automation settings. This cannot be undone."
          confirmLabel="Delete Everything"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          danger
        />
      )}
    </div>
  );
}
