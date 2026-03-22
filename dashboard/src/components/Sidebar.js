"use client";

import React, { useState } from "react";
import {
  Home, Settings, ChevronLeft, ChevronRight, Zap, Users2, Activity,
  Link2, BookOpen, MessageSquare, LayoutDashboard, Menu, X, LogOut,
  TrendingUp, BarChart3, Link, ShoppingBag, Bot, MessageCircle,
  Contact, Users, Building2, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AccountSwitcher from "./AccountSwitcher";
import { useDashboardConfig } from "@/lib/DashboardConfigContext";
import { isFeatureEnabled } from "@/lib/featureFlags";

/** Map icon name strings from config to actual lucide components */
const ICON_MAP = {
  Home: LayoutDashboard,
  Zap,
  TrendingUp,
  Activity,
  BarChart3,
  Link: Link2,
  Link2,
  ShoppingBag,
  Bot,
  BookOpen,
  MessageCircle,
  MessageSquare,
  Contact,
  Users: Users2,
  Users2,
  Settings,
  Building2,
  Sparkles,
};

function resolveIcon(iconName) {
  return ICON_MAP[iconName] || LayoutDashboard;
}

const SidebarItem = ({ icon: Icon, label, active = false, collapsed = false, onClick, badge }) => (
  <div
    onClick={onClick}
    className={cn(
      "flex items-center px-3 py-2.5 my-0.5 cursor-pointer transition-all duration-150 rounded-lg",
      collapsed ? "justify-center px-0 w-10 mx-auto" : "gap-3"
    )}
    style={{
      backgroundColor: active ? "#EEF2FF" : "transparent",
      color: active ? "#4F46E5" : "#71717A",
      fontWeight: active ? 500 : 400,
    }}
    onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = active ? "#EEF2FF" : "transparent"; }}
  >
    <Icon size={18} strokeWidth={1.5} style={{ color: active ? "#4F46E5" : "#A1A1AA" }} />
    {!collapsed && (
      <>
        <span className="text-sm flex-1 truncate">{label}</span>
        {badge && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: "#F5F3FF", color: "#7C3AED" }}
          >
            {badge}
          </span>
        )}
      </>
    )}
  </div>
);

export default function Sidebar({ isCollapsed, setIsCollapsed, activeTab = "Home", onTabChange, stats }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { config } = useDashboardConfig();

  /**
   * Resolve a config sidebar item into its effective id.
   * If the item has a featureKey and the admin has enabled that feature,
   * use the real page id (enabledId) instead of the beta slug.
   */
  function resolveItem(item) {
    if (item.featureKey && isFeatureEnabled(stats, item.featureKey)) {
      return {
        ...item,
        id: item.enabledId || item.id,
        badge: undefined,     // no longer beta
        betaSlug: undefined,
      };
    }
    return item;
  }

  const handleClick = (item) => {
    const resolved = resolveItem(item);
    if (resolved.betaSlug) {
      onTabChange(`coming-soon:${resolved.betaSlug}`);
    } else {
      onTabChange(resolved.id);
    }
    setMobileOpen(false);
  };

  const renderNav = () => (
    <>
      {/* Logo + Account Type Badge */}
      <div className={cn("px-5 pt-5 pb-1", isCollapsed ? "px-3 text-center" : "")}>
        <span className="text-xl font-bold tracking-tight" style={{ color: "#18181B" }}>
          {isCollapsed ? "E" : "Engagr"}
          {!isCollapsed && <span style={{ color: "#4F46E5" }}>.</span>}
        </span>
      </div>

      {/* Account type badge */}
      {!isCollapsed && (
        <div className="px-5 pb-3">
          <button
            onClick={() => { onTabChange("Settings"); setMobileOpen(false); }}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-opacity hover:opacity-80"
            style={{ backgroundColor: config.badgeBg, color: config.badgeText }}
            title="Change account type in Settings"
          >
            <span>{config.emoji}</span>
            <span>{config.label}</span>
          </button>
        </div>
      )}

      {/* Account Switcher */}
      <div className={cn("px-3 mb-2", isCollapsed ? "px-2" : "")}>
        <AccountSwitcher collapsed={isCollapsed} onAddAccount={() => { window.location.href = "/onboarding"; }} />
      </div>

      <div className="h-px mx-4 my-2" style={{ backgroundColor: "#F0F0F0" }} />

      {/* Config-driven nav sections */}
      <nav className="flex-1 px-3 mt-1">
        {config.sidebar.sections.map((section, sIdx) => (
          <div key={section.title || `section-${sIdx}`}>
            {section.title && (
              <p
                className={cn(
                  "text-[11px] uppercase tracking-[0.15em] font-semibold mb-1.5 px-3",
                  isCollapsed ? "hidden" : "",
                  sIdx > 0 ? "mt-5" : "mt-3"
                )}
                style={{ color: "#A1A1AA" }}
              >
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const resolved = resolveItem(item);
              const Icon = resolveIcon(resolved.icon || item.icon);
              const isActive = resolved.betaSlug
                ? activeTab === `coming-soon:${resolved.betaSlug}`
                : activeTab === resolved.id;

              return (
                <SidebarItem
                  key={item.id}
                  icon={Icon}
                  label={resolved.label}
                  active={isActive}
                  collapsed={isCollapsed}
                  badge={resolved.badge}
                  onClick={() => handleClick(item)}
                />
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: plan badge + settings + logout */}
      <div className="px-3 pb-4 mt-auto">
        <div className="h-px mx-1 mb-3" style={{ backgroundColor: "#F0F0F0" }} />

        {!isCollapsed && (
          <div className="px-3 mb-3">
            <span
              className="text-[10px] font-semibold px-2 py-1 rounded-full"
              style={{ backgroundColor: "#EEF2FF", color: "#4F46E5" }}
            >
              Early Access
            </span>
          </div>
        )}

        <a
          href="/api/auth/logout"
          className={cn(
            "flex items-center px-3 py-2.5 my-0.5 rounded-lg transition-all duration-150",
            isCollapsed ? "justify-center" : "gap-3"
          )}
          style={{ color: "#A1A1AA" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.backgroundColor = "#FEF2F2"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#A1A1AA"; e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          <LogOut size={18} strokeWidth={1.5} />
          {!isCollapsed && <span className="text-sm">Log out</span>}
        </a>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-50 transition-all duration-200",
          isCollapsed ? "w-[72px]" : "w-[260px]"
        )}
        style={{ backgroundColor: "#FFFFFF", borderRight: "1px solid #F0F0F0" }}
      >
        {renderNav()}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute bottom-20 -right-3 w-6 h-6 rounded-full flex items-center justify-center z-[60] shadow-sm transition-colors"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E4E4E7", color: "#A1A1AA" }}
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-3.5 left-4 z-50 p-2 rounded-lg"
        style={{ backgroundColor: "#FFFFFF", border: "1px solid #F0F0F0" }}
        onClick={() => setMobileOpen(true)}
        aria-label="Menu"
      >
        <Menu size={18} style={{ color: "#71717A" }} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[260px] h-full flex flex-col shadow-xl" style={{ backgroundColor: "#FFFFFF" }}>
            <button className="absolute top-4 right-4 p-1" onClick={() => setMobileOpen(false)}>
              <X size={16} style={{ color: "#A1A1AA" }} />
            </button>
            {renderNav()}
          </aside>
        </div>
      )}
    </>
  );
}
