"use client";

import React, { useState } from "react";
import { ChevronDown, Check, Plus, Star } from "lucide-react";
import { useAccount } from "@/lib/AccountContext";
import { cn } from "@/lib/utils";

export default function AccountSwitcher({ collapsed = false, onAddAccount }) {
  const { accounts, selectedAccountId, setSelectedAccountId, selectedAccount } = useAccount();
  const [open, setOpen] = useState(false);

  if (!accounts.length) {
    return (
      <button
        onClick={onAddAccount}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors",
          collapsed ? "justify-center px-0" : ""
        )}
        style={{ color: "var(--text-placeholder)" }}
      >
        <Plus size={16} />
        {!collapsed && <span>Connect Account</span>}
      </button>
    );
  }

  if (collapsed) {
    return (
      <div className="flex justify-center">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs cursor-pointer"
          style={{
            background: "linear-gradient(to top right, var(--accent), var(--primary))",
          }}
          onClick={() => setOpen(!open)}
          title={selectedAccount?.instagramUsername ? `@${selectedAccount.instagramUsername}` : "Account"}
        >
          {selectedAccount?.instagramUsername?.[0]?.toUpperCase() || "?"}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors"
        style={{ backgroundColor: open ? "var(--surface-alt)" : "transparent" }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.backgroundColor = "var(--sidebar-hover)";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
          style={{
            background: "linear-gradient(to top right, var(--accent), var(--primary))",
          }}
        >
          {selectedAccount?.instagramUsername?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-primary)" }}>
            @{selectedAccount?.instagramUsername || "Select Account"}
          </p>
          <p className="text-[10px] font-medium" style={{ color: "var(--text-placeholder)" }}>
            {selectedAccount?.isPrimary ? "Primary" : "Connected"}
          </p>
        </div>
        <ChevronDown
          size={14}
          className={cn("transition-transform flex-shrink-0", open && "rotate-180")}
          style={{ color: "var(--text-muted)" }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 bottom-full mb-1 rounded-xl overflow-hidden shadow-lg z-50"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          {accounts.map((acc) => (
            <button
              key={acc._id}
              onClick={() => {
                setSelectedAccountId(acc._id);
                setOpen(false);
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 transition-colors"
              style={{
                backgroundColor: acc._id === selectedAccountId ? "var(--surface-alt)" : "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--surface-alt)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  acc._id === selectedAccountId ? "var(--surface-alt)" : "transparent";
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0"
                style={{
                  background: acc.isConnected
                    ? "linear-gradient(to top right, var(--accent), var(--primary))"
                    : "var(--text-placeholder)",
                }}
              >
                {acc.instagramUsername?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[12px] font-bold truncate" style={{ color: "var(--text-primary)" }}>
                  @{acc.instagramUsername}
                </p>
                <div className="flex items-center gap-1.5">
                  {acc.isPrimary && <Star size={8} style={{ color: "var(--warning)" }} />}
                  <span
                    className="text-[9px] font-medium"
                    style={{
                      color: acc.isConnected
                        ? acc.tokenExpired
                          ? "var(--warning)"
                          : "var(--success)"
                        : "var(--text-muted)",
                    }}
                  >
                    {acc.isConnected ? (acc.tokenExpired ? "Token Expired" : "Connected") : "Disconnected"}
                  </span>
                </div>
              </div>
              {acc._id === selectedAccountId && (
                <Check size={14} style={{ color: "var(--primary)" }} className="flex-shrink-0" />
              )}
            </button>
          ))}

          {onAddAccount && (
            <button
              onClick={() => {
                setOpen(false);
                onAddAccount();
              }}
              className="flex items-center gap-2 w-full px-3 py-2.5 transition-colors"
              style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--surface-alt)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Plus size={14} />
              <span className="text-[12px] font-bold">Add Account</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
