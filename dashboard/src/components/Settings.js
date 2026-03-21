"use client";

import React, { useState } from "react";
import { Instagram, Trash2, ShieldOff, AlertTriangle, CheckCircle2, ExternalLink, User, Mail, AtSign } from "lucide-react";
import { deauthorizeInstagram, deleteAccountData } from "@/app/settings/actions";

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

      {/* Connected Account */}
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
