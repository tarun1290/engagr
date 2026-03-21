"use client";

import React, { useState, useEffect } from 'react';
import {
  Home,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  ShieldCheck,
  Users2,
  Activity,
  CreditCard,
  BarChart3,
  KeyRound,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlanConfig } from "@/lib/plans";
import { PLAN_BADGE_COLORS } from "./UpgradePrompt";
import AccountSwitcher from "./AccountSwitcher";
import { getSubscriptionStatus } from "@/app/dashboard/billing-actions";

const MENU_ITEMS = [
  { id: "Home", label: "Home", icon: Home },
  { id: "Automation", label: "Automation", icon: Zap },
  { id: "Contacts", label: "Contacts", icon: Users2, gatedPage: "contacts" },
  { id: "Activity", label: "Activity", icon: Activity, gatedPage: "activity" },
  { id: "Billing", label: "Billing", icon: CreditCard },
  { id: "Analytics", label: "Analytics", icon: BarChart3, gatedPage: "analytics" },
  { id: "API Keys", label: "API Keys", icon: KeyRound, gatedPage: "api_keys" },
];

const BOTTOM_ITEMS = [
  { id: "Settings", label: "Settings", icon: Settings },
];

const SidebarItem = ({ icon: Icon, label, active = false, collapsed = false, locked = false, onClick }) => (
  <div
    onClick={onClick}
    className={cn(
      "flex items-center px-4 py-2 my-1 cursor-pointer transition-all duration-200 group relative rounded-lg",
      collapsed ? "justify-center px-0 w-10 mx-auto" : "gap-3"
    )}
    style={{
      backgroundColor: active ? 'var(--sidebar-active-bg)' : 'transparent',
      color: active ? 'var(--sidebar-text-active)' : locked ? 'var(--sidebar-icon)' : 'var(--sidebar-text)',
      fontWeight: active ? 600 : 400,
      opacity: locked && !active ? 0.65 : 1,
    }}
    onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'; }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    <Icon
      size={18}
      style={{ color: active ? 'var(--sidebar-icon-active)' : 'var(--sidebar-icon)' }}
    />
    {!collapsed && (
      <>
        <span className="text-[14px] whitespace-nowrap flex-1">{label}</span>
        {locked && <Lock size={12} style={{ color: 'var(--sidebar-icon)' }} />}
      </>
    )}
  </div>
);

export default function Sidebar({ isCollapsed, setIsCollapsed, activeTab = "Home", onTabChange }) {
  const [subData, setSubData] = useState(null);

  useEffect(() => {
    getSubscriptionStatus()
      .then((data) => { if (data.success) setSubData(data); })
      .catch(() => {});
  }, []);

  const plan = subData?.plan || "trial";
  const config = getPlanConfig(plan);
  const badgeColor = PLAN_BADGE_COLORS[plan] || PLAN_BADGE_COLORS.trial;

  // DM usage for sidebar footer
  const dmsSent = subData?.dmsSent || 0;
  const dmLimit = subData?.dmLimit || 50;
  const dmDisplay = subData?.dmLimitDisplay || "50";
  const isUnlimited = dmDisplay === "Unlimited";
  const dmPercent = isUnlimited ? 0 : Math.min(Math.round((dmsSent / dmLimit) * 100), 100);
  const dmBarColor = dmPercent >= 100 ? 'var(--error)' : dmPercent >= 80 ? 'var(--warning)' : 'var(--success)';
  const daysLeft = subData?.daysLeftInTrial || 0;
  const isTrial = plan === "trial";

  // Check which pages the user's plan allows
  const userPages = config.pages;

  return (
    <aside
      className={cn(
        "h-screen fixed left-0 top-0 flex flex-col transition-all duration-300 z-50 theme-transition",
        isCollapsed ? "w-20" : "w-64"
      )}
      style={{ backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      <div className={cn(
        "flex items-center gap-3 px-6 py-6 mb-2",
        isCollapsed ? "justify-center px-0" : ""
      )}>
        <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <ShieldCheck className="text-white" size={18} />
        </div>
        {!isCollapsed && (
          <span className="text-xl font-bold tracking-tight uppercase"
            style={{ color: 'var(--text-primary)' }}
          >Engagr</span>
        )}
      </div>

      {/* Account Switcher */}
      <div className={cn("px-4 mb-3", isCollapsed ? "px-2" : "")}>
        <AccountSwitcher
          collapsed={isCollapsed}
          onAddAccount={() => {
            window.location.href = '/onboarding';
          }}
        />
      </div>

      <nav className="flex-1 px-4 space-y-0.5 mt-2">
        {MENU_ITEMS.map((item) => {
          const locked = item.gatedPage && !userPages.includes(item.gatedPage);
          return (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              collapsed={isCollapsed}
              locked={locked}
              onClick={() => onTabChange(item.id)}
            />
          );
        })}
      </nav>

      {/* Plan badge + DM usage footer */}
      <div className="px-4 py-3 theme-transition"
        style={{ borderTop: '1px solid var(--sidebar-border)' }}
      >
        {!isCollapsed && subData && (
          <div className="mb-3 space-y-2">
            {/* Plan badge */}
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: badgeColor.bg, color: badgeColor.text, border: `1px solid ${badgeColor.border}` }}
            >
              {config.name}
            </span>

            {isTrial && daysLeft > 0 ? (
              <div className="space-y-1">
                <p className="text-[11px] font-medium" style={{ color: 'var(--sidebar-text)' }}>
                  Trial — {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                </p>
                <button
                  onClick={() => onTabChange("Billing")}
                  className="text-[11px] font-bold"
                  style={{ color: 'var(--accent)' }}
                >
                  Upgrade
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {/* DM usage bar */}
                {!isUnlimited && (
                  <div className="h-1 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--sidebar-border)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${dmPercent}%`, backgroundColor: dmBarColor }}
                    />
                  </div>
                )}
                <p className="text-[11px] font-medium" style={{ color: 'var(--sidebar-text)', opacity: 0.7 }}>
                  {isUnlimited ? "Unlimited DMs" : `${dmsSent}/${dmLimit} DMs`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Collapsed: just show a small plan dot */}
        {isCollapsed && subData && (
          <div className="flex justify-center mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: badgeColor.text }} />
          </div>
        )}

        {BOTTOM_ITEMS.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeTab === item.id}
            collapsed={isCollapsed}
            onClick={() => onTabChange(item.id)}
          />
        ))}
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute bottom-32 -right-3 w-6 h-6 rounded-full flex items-center justify-center transition-colors z-[60] shadow-sm"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
