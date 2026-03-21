"use client";

import React, { useState } from "react";
import { Instagram, Star, Trash2, ShieldOff, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAccount } from "@/lib/AccountContext";
import {
  disconnectInstagramAccount,
  removeInstagramAccount,
  setPrimaryAccount,
} from "@/app/dashboard/actions";

function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel, danger = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "var(--overlay)" }}>
      <div className="rounded-[24px] p-8 max-w-sm w-full space-y-6 shadow-2xl" style={{ backgroundColor: "var(--card)" }}>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
          style={{ backgroundColor: danger ? "var(--error-light)" : "var(--warning-light)" }}
        >
          <AlertTriangle size={22} style={{ color: danger ? "var(--error)" : "var(--warning)" }} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{title}</h3>
          <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "transparent" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              backgroundColor: danger ? "var(--btn-destructive-bg)" : "var(--warning)",
              color: danger ? "var(--btn-destructive-text)" : "#fff",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageAccounts() {
  const { accounts, refreshAccounts, selectedAccountId, setSelectedAccountId } = useAccount();
  const [loading, setLoading] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const handleSetPrimary = async (accountId) => {
    setLoading(accountId);
    try {
      await setPrimaryAccount(accountId);
      await refreshAccounts();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnect = async (accountId) => {
    setConfirmAction(null);
    setLoading(accountId);
    try {
      await disconnectInstagramAccount(accountId);
      await refreshAccounts();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleRemove = async (accountId) => {
    setConfirmAction(null);
    setLoading(accountId);
    try {
      await removeInstagramAccount(accountId);
      if (selectedAccountId === accountId) {
        setSelectedAccountId(null);
      }
      await refreshAccounts();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  if (!accounts.length) {
    return (
      <div className="rounded-[24px] overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-8 py-6 flex items-center gap-4" style={{ borderBottom: "1px solid var(--surface-alt)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--surface-alt)", color: "var(--primary)" }}>
            <Instagram size={18} />
          </div>
          <div>
            <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>Instagram Accounts</h3>
            <p className="text-[13px] font-medium" style={{ color: "var(--text-placeholder)" }}>Manage your connected accounts</p>
          </div>
        </div>
        <div className="px-8 py-8 text-center">
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No accounts connected.</p>
          <button
            onClick={() => (window.location.href = "/onboarding")}
            className="mt-4 px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2"
            style={{ backgroundColor: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}
          >
            <Plus size={16} /> Connect Instagram
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-[24px] overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-8 py-6 flex items-center justify-between" style={{ borderBottom: "1px solid var(--surface-alt)" }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--surface-alt)", color: "var(--primary)" }}>
              <Instagram size={18} />
            </div>
            <div>
              <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>Instagram Accounts</h3>
              <p className="text-[13px] font-medium" style={{ color: "var(--text-placeholder)" }}>
                {accounts.length} account{accounts.length !== 1 ? "s" : ""} connected
              </p>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = "/onboarding")}
            className="px-4 py-2 rounded-xl font-bold text-[12px] flex items-center gap-1.5 transition-colors"
            style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            <Plus size={14} /> Add Account
          </button>
        </div>

        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {accounts.map((acc) => (
            <div key={acc._id} className="px-8 py-5 flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{
                  background: acc.isConnected
                    ? "linear-gradient(to top right, var(--accent), var(--primary))"
                    : "var(--text-placeholder)",
                }}
              >
                {acc.instagramUsername?.[0]?.toUpperCase() || "?"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-bold truncate" style={{ color: "var(--text-primary)" }}>
                    @{acc.instagramUsername}
                  </p>
                  {acc.isPrimary && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                      style={{ backgroundColor: "var(--warning-light)", color: "var(--warning-dark)", border: "1px solid var(--warning)" }}
                    >
                      Primary
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: acc.isConnected
                        ? acc.tokenExpired ? "var(--warning)" : "var(--success)"
                        : "var(--text-muted)",
                    }}
                  />
                  <span
                    className="text-[11px] font-medium"
                    style={{
                      color: acc.isConnected
                        ? acc.tokenExpired ? "var(--warning)" : "var(--success)"
                        : "var(--text-muted)",
                    }}
                  >
                    {acc.isConnected ? (acc.tokenExpired ? "Token Expired" : "Connected") : "Disconnected"}
                  </span>
                  {acc.automationActive && (
                    <>
                      <span className="text-[9px]" style={{ color: "var(--text-placeholder)" }}>|</span>
                      <span className="text-[11px] font-medium" style={{ color: "var(--primary)" }}>Automation Active</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!acc.isPrimary && acc.isConnected && (
                  <button
                    onClick={() => handleSetPrimary(acc._id)}
                    disabled={loading === acc._id}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
                    style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
                    title="Set as primary"
                  >
                    <Star size={12} />
                  </button>
                )}

                {acc.isConnected && (
                  <button
                    onClick={() => setConfirmAction({ type: "disconnect", accountId: acc._id, username: acc.instagramUsername })}
                    disabled={loading === acc._id}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
                    style={{ border: "1px solid var(--warning-light)", color: "var(--warning)" }}
                    title="Disconnect"
                  >
                    <ShieldOff size={12} />
                  </button>
                )}

                <button
                  onClick={() => setConfirmAction({ type: "remove", accountId: acc._id, username: acc.instagramUsername })}
                  disabled={loading === acc._id}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
                  style={{ border: "1px solid var(--error-light)", color: "var(--error)" }}
                  title="Remove"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {confirmAction?.type === "disconnect" && (
        <ConfirmDialog
          title={`Disconnect @${confirmAction.username}?`}
          message="This will remove the access token and stop all automation for this account. You can reconnect later."
          confirmLabel="Disconnect"
          onConfirm={() => handleDisconnect(confirmAction.accountId)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {confirmAction?.type === "remove" && (
        <ConfirmDialog
          title={`Remove @${confirmAction.username}?`}
          message="This will permanently remove this account from Engagr. Events linked to it will remain in your history."
          confirmLabel="Remove Account"
          onConfirm={() => handleRemove(confirmAction.accountId)}
          onCancel={() => setConfirmAction(null)}
          danger
        />
      )}
    </>
  );
}
