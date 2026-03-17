"use client";

import React, { useState } from "react";
import { Instagram, Trash2, ShieldOff, AlertTriangle, CheckCircle2, ExternalLink, User, Mail, AtSign } from "lucide-react";
import { deauthorizeInstagram, deleteAccountData } from "@/app/settings/actions";

function SectionCard({ title, description, icon: Icon, iconColor = "text-slate-400", children }) {
  return (
    <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center ${iconColor}`}>
          <Icon size={18} />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900">{title}</h3>
          <p className="text-[13px] text-slate-400 font-medium">{description}</p>
        </div>
      </div>
      <div className="px-8 py-6">{children}</div>
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel, danger = false }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-[24px] p-8 max-w-sm w-full space-y-6 shadow-2xl">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${danger ? "bg-red-50" : "bg-amber-50"}`}>
          <AlertTriangle size={22} className={danger ? "text-red-500" : "text-amber-500"} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black text-slate-900">{title}</h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 text-white rounded-xl font-bold text-sm transition-all ${danger ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
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

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-3xl font-black text-black tracking-tight">Settings</h2>
        <p className="text-slate-400 text-sm font-medium mt-1">Manage your account, privacy and data.</p>
      </div>

      {/* Connected Account */}
      <SectionCard
        icon={Instagram}
        iconColor="text-pink-500"
        title="Instagram Connection"
        description="Your connected business account"
      >
        {stats?.instagram?.isConnected ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              {stats.instagram.profilePic && (
                <img src={stats.instagram.profilePic} alt="" className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
              )}
              <div>
                <p className="font-black text-slate-900 text-base">@{stats.instagram.username}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Connected</span>
                </div>
              </div>
            </div>

            {deauthDone ? (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm font-medium">
                <CheckCircle2 size={16} /> Instagram disconnected successfully. Refresh to update.
              </div>
            ) : (
              <button
                onClick={() => setShowDeauthConfirm(true)}
                disabled={deauthLoading}
                className="flex items-center gap-2 px-5 py-3 border border-amber-200 bg-amber-50 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-100 transition-all disabled:opacity-60"
              >
                <ShieldOff size={16} />
                {deauthLoading ? "Disconnecting..." : "Disconnect Instagram"}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            No Instagram account connected.
          </div>
        )}
      </SectionCard>

      {/* Deauthorize Info */}
      <SectionCard
        icon={ShieldOff}
        iconColor="text-amber-500"
        title="Deauthorize App"
        description="Remove Ai DM Bot access from your Meta account"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            You can revoke Ai DM Bot&apos;s access to your Instagram and Facebook data directly from Meta&apos;s settings. This removes all permissions granted to the app.
          </p>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Meta Deauthorize Callback URL</p>
            <code className="text-xs text-pink-600 font-mono break-all">
              https://aidmbot.vercel.app/api/auth/deauthorize
            </code>
          </div>
          <a
            href="https://www.facebook.com/settings?tab=applications"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            Manage App Permissions on Facebook <ExternalLink size={14} />
          </a>
        </div>
      </SectionCard>

      {/* Data Deletion */}
      <SectionCard
        icon={Trash2}
        iconColor="text-red-400"
        title="Data Deletion"
        description="Permanently delete your account and all associated data"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Deletes your account, Instagram tokens, all recorded events, automation settings, and contact data from our systems. This action is <strong className="text-slate-700">irreversible</strong>.
          </p>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Meta Data Deletion Callback URL</p>
            <code className="text-xs text-pink-600 font-mono break-all">
              https://aidmbot.vercel.app/api/auth/data-deletion
            </code>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Data Deletion Status URL</p>
            <code className="text-xs text-pink-600 font-mono break-all">
              https://aidmbot.vercel.app/data-deletion-status
            </code>
          </div>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteLoading}
            className="flex items-center gap-2 px-5 py-3 border border-red-200 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all disabled:opacity-60"
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
