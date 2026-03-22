"use client";

import React, { useState } from 'react';
import {
  Home, Settings, ChevronLeft, ChevronRight, Zap, Users2, Activity,
  Link2, BookOpen, MessageSquare, LayoutDashboard, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AccountSwitcher from "./AccountSwitcher";

const BASE_MENU_ITEMS = [
  { id: "Home", label: "Home", icon: LayoutDashboard, group: "MAIN" },
  { id: "Automation", label: "Automation", icon: Zap, group: "MAIN" },
  { id: "Contacts", label: "Contacts", icon: Users2, group: "MAIN" },
  { id: "Activity", label: "Activity", icon: Activity, group: "MAIN" },
];

const SidebarItem = ({ icon: Icon, label, active = false, collapsed = false, onClick, beta = false }) => (
  <div
    onClick={onClick}
    className={cn(
      "flex items-center px-3 py-2.5 my-0.5 cursor-pointer transition-all duration-150 rounded-lg",
      collapsed ? "justify-center px-0 w-10 mx-auto" : "gap-3"
    )}
    style={{
      backgroundColor: active ? '#EEF2FF' : 'transparent',
      color: active ? '#4F46E5' : '#71717A',
      fontWeight: active ? 500 : 400,
    }}
    onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = active ? '#EEF2FF' : 'transparent'; }}
  >
    <Icon size={18} strokeWidth={1.5} style={{ color: active ? '#4F46E5' : '#A1A1AA' }} />
    {!collapsed && (
      <>
        <span className="text-sm flex-1 truncate">{label}</span>
        {beta && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: '#F5F3FF', color: '#7C3AED' }}>
            Beta
          </span>
        )}
      </>
    )}
  </div>
);

export default function Sidebar({ isCollapsed, setIsCollapsed, activeTab = "Home", onTabChange, aiEnabled = false, smartFeatures = {} }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Build dynamic menu items — real pages when admin-enabled, beta teasers otherwise
  const betaItems = [];
  if (smartFeatures?.smartReplies) {
    betaItems.push({ id: "Conversations", label: "Conversations", icon: MessageSquare, group: "BETA" });
  } else {
    betaItems.push({ id: "beta:conversations", label: "Conversations", icon: MessageSquare, beta: true, betaSlug: "conversations", group: "BETA" });
  }
  if (smartFeatures?.knowledgeBase) {
    betaItems.push({ id: "Knowledge", label: "Knowledge", icon: BookOpen, group: "BETA" });
  } else {
    betaItems.push({ id: "beta:knowledge", label: "Knowledge", icon: BookOpen, beta: true, betaSlug: "knowledge-base", group: "BETA" });
  }
  if (aiEnabled) {
    betaItems.push({ id: "Links", label: "Links", icon: Link2, group: "BETA" });
  } else {
    betaItems.push({ id: "beta:links", label: "Links", icon: Link2, beta: true, betaSlug: "smart-links", group: "BETA" });
  }

  const handleClick = (item) => {
    if (item.beta && item.betaSlug) {
      onTabChange(`coming-soon:${item.betaSlug}`);
    } else {
      onTabChange(item.id);
    }
    setMobileOpen(false);
  };

  const renderNav = () => (
    <>
      {/* Logo */}
      <div className={cn("px-5 pt-5 pb-4", isCollapsed ? "px-3 text-center" : "")}>
        <span className="text-xl font-bold tracking-tight" style={{ color: '#18181B' }}>
          {isCollapsed ? "E" : "Engagr"}
          {!isCollapsed && <span style={{ color: '#4F46E5' }}>.</span>}
        </span>
      </div>

      {/* Account Switcher */}
      <div className={cn("px-3 mb-2", isCollapsed ? "px-2" : "")}>
        <AccountSwitcher collapsed={isCollapsed} onAddAccount={() => { window.location.href = '/onboarding'; }} />
      </div>

      <div className="h-px mx-4 my-2" style={{ backgroundColor: '#F0F0F0' }} />

      {/* Main nav */}
      <nav className="flex-1 px-3 mt-1">
        <p className={cn("text-[11px] uppercase tracking-[0.15em] font-semibold mt-3 mb-1.5 px-3", isCollapsed ? "hidden" : "")}
          style={{ color: '#A1A1AA' }}>Main</p>
        {BASE_MENU_ITEMS.map((item) => (
          <SidebarItem key={item.id} icon={item.icon} label={item.label}
            active={activeTab === item.id} collapsed={isCollapsed}
            onClick={() => handleClick(item)} />
        ))}

        <p className={cn("text-[11px] uppercase tracking-[0.15em] font-semibold mt-5 mb-1.5 px-3", isCollapsed ? "hidden" : "")}
          style={{ color: '#A1A1AA' }}>Beta</p>
        {betaItems.map((item) => (
          <SidebarItem key={item.id} icon={item.icon} label={item.label}
            active={activeTab === item.id} collapsed={isCollapsed}
            beta={item.beta} onClick={() => handleClick(item)} />
        ))}
      </nav>

      {/* Bottom: plan badge + settings */}
      <div className="px-3 pb-4 mt-auto">
        <div className="h-px mx-1 mb-3" style={{ backgroundColor: '#F0F0F0' }} />

        {!isCollapsed && (
          <div className="px-3 mb-3">
            <span className="text-[10px] font-semibold px-2 py-1 rounded-full"
              style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
              Early Access
            </span>
          </div>
        )}

        <SidebarItem icon={Settings} label="Settings" active={activeTab === "Settings"}
          collapsed={isCollapsed} onClick={() => handleClick({ id: "Settings" })} />
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-50 transition-all duration-200",
        isCollapsed ? "w-[72px]" : "w-[260px]"
      )} style={{ backgroundColor: '#FFFFFF', borderRight: '1px solid #F0F0F0' }}>
        {renderNav()}

        <button onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute bottom-20 -right-3 w-6 h-6 rounded-full flex items-center justify-center z-[60] shadow-sm transition-colors"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E4E7', color: '#A1A1AA' }}>
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile hamburger */}
      <button className="lg:hidden fixed top-3.5 left-4 z-50 p-2 rounded-lg"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #F0F0F0' }}
        onClick={() => setMobileOpen(true)} aria-label="Menu">
        <Menu size={18} style={{ color: '#71717A' }} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[260px] h-full flex flex-col shadow-xl" style={{ backgroundColor: '#FFFFFF' }}>
            <button className="absolute top-4 right-4 p-1" onClick={() => setMobileOpen(false)}>
              <X size={16} style={{ color: '#A1A1AA' }} />
            </button>
            {renderNav()}
          </aside>
        </div>
      )}
    </>
  );
}
