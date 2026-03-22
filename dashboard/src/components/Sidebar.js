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
  Link2,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AccountSwitcher from "./AccountSwitcher";

// [PLANS DISABLED] Removed: CreditCard, BarChart3, KeyRound, Lock imports
// [PLANS DISABLED] Removed: getPlanConfig, PLAN_BADGE_COLORS imports
// [PLANS DISABLED] Removed: getSubscriptionStatus import
// [PLANS DISABLED] Removed: gatedPage entries for Billing, Analytics, API Keys
// [PLANS DISABLED] Removed: lock icons, plan badge, DM usage bar in footer

const BASE_MENU_ITEMS = [
  { id: "Home", label: "Home", icon: Home },
  { id: "Automation", label: "Automation", icon: Zap },
  { id: "Contacts", label: "Contacts", icon: Users2 },
  { id: "Activity", label: "Activity", icon: Activity },
  // [PLANS DISABLED] These items are hidden during Early Access:
  // { id: "Billing", label: "Billing", icon: CreditCard },
  // { id: "Analytics", label: "Analytics", icon: BarChart3, gatedPage: "analytics" },
  // { id: "API Keys", label: "API Keys", icon: KeyRound, gatedPage: "api_keys" },
  // [/PLANS DISABLED]
];

const BOTTOM_ITEMS = [
  { id: "Settings", label: "Settings", icon: Settings },
];

const SidebarItem = ({ icon: Icon, label, active = false, collapsed = false, onClick, beta = false }) => (
  <div
    onClick={onClick}
    className={cn(
      "flex items-center px-4 py-2 my-1 cursor-pointer transition-all duration-200 group relative rounded-lg",
      collapsed ? "justify-center px-0 w-10 mx-auto" : "gap-3"
    )}
    style={{
      backgroundColor: active ? 'var(--sidebar-active-bg)' : 'transparent',
      color: active ? 'var(--sidebar-text-active)' : beta ? 'var(--sidebar-text)' : 'var(--sidebar-text)',
      fontWeight: active ? 600 : 400,
      opacity: beta && !active ? 0.85 : 1,
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
        {beta && (
          <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(124, 58, 237, 0.12)', color: '#7C3AED' }}>
            Beta
          </span>
        )}
      </>
    )}
  </div>
);

export default function Sidebar({ isCollapsed, setIsCollapsed, activeTab = "Home", onTabChange, aiEnabled = false, smartFeatures = {} }) {
  // Build menu: insert real pages when admin-enabled, beta teasers otherwise
  const afterContacts = [];
  if (smartFeatures.smartReplies) {
    afterContacts.push({ id: "Conversations", label: "Conversations", icon: MessageSquare });
  } else {
    afterContacts.push({ id: "beta:conversations", label: "Conversations", icon: MessageSquare, beta: true, betaSlug: "conversations" });
  }

  const afterActivity = [];
  if (smartFeatures.knowledgeBase) {
    afterActivity.push({ id: "Knowledge", label: "Knowledge", icon: BookOpen });
  } else {
    afterActivity.push({ id: "beta:knowledge", label: "Knowledge", icon: BookOpen, beta: true, betaSlug: "knowledge-base" });
  }
  if (aiEnabled) {
    afterActivity.push({ id: "Links", label: "Links", icon: Link2 });
  } else {
    afterActivity.push({ id: "beta:links", label: "Links", icon: Link2, beta: true, betaSlug: "smart-links" });
  }

  const menuItems = [
    ...BASE_MENU_ITEMS.slice(0, 3), // Home, Automation, Contacts
    ...afterContacts,
    ...BASE_MENU_ITEMS.slice(3),    // Activity
    ...afterActivity,
  ];

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
        {menuItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeTab === item.id}
            collapsed={isCollapsed}
            beta={item.beta}
            onClick={() => {
              if (item.beta && item.betaSlug) {
                onTabChange(`coming-soon:${item.betaSlug}`);
              } else {
                onTabChange(item.id);
              }
            }}
          />
        ))}
      </nav>

      {/* [PLANS DISABLED] Plan badge + DM usage footer removed for Early Access */}
      {/* Original code showed plan badge, trial days, DM usage bar */}

      <div className="px-4 py-3 theme-transition"
        style={{ borderTop: '1px solid var(--sidebar-border)' }}
      >
        {!isCollapsed && (
          <div className="mb-3">
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success)' }}
            >
              Early Access
            </span>
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
