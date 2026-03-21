"use client";

import React from 'react';
import {
  Home,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  ShieldCheck,
  Users2,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

const SidebarItem = ({ icon: Icon, label, active = false, collapsed = false, onClick }) => (
  <div 
    onClick={onClick}
    className={cn(
      "flex items-center px-4 py-2 my-1 cursor-pointer transition-all duration-200 group relative",
      active 
        ? "bg-slate-100/80 text-black font-semibold" 
        : "text-slate-500 hover:bg-slate-100/50 hover:text-black",
      collapsed ? "justify-center px-0 w-10 mx-auto" : "gap-3"
    )}
  >
    <Icon size={18} className={cn(active ? "text-primary" : "text-slate-400 group-hover:text-slate-600")} />
    {!collapsed && <span className="text-[14px] whitespace-nowrap">{label}</span>}
  </div>
);

export default function Sidebar({ isCollapsed, setIsCollapsed, activeTab = "Home", onTabChange }) {
  const menuItems = [
    { id: "Home", label: "Home", icon: Home },
    { id: "Automation", label: "Automation", icon: Zap },
    { id: "Contacts", label: "Contacts", icon: Users2 },
    { id: "Activity", label: "Activity", icon: Activity },
  ];

  return (
    <aside className={cn(
      "h-screen fixed left-0 top-0 bg-[#fdfdfd] border-r border-slate-100 flex flex-col transition-all duration-300 z-50",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className={cn(
        "flex items-center gap-3 px-6 py-6 mb-2",
        isCollapsed ? "justify-center px-0" : ""
      )}>
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center flex-shrink-0 shadow-sm shadow-pink-100">
          <ShieldCheck className="text-white" size={18} />
        </div>
        {!isCollapsed && (
          <span className="text-xl font-bold tracking-tight text-black uppercase">Engagr</span>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-0.5 mt-2">
        {menuItems.map((item) => (
          <SidebarItem 
            key={item.id}
            icon={item.icon} 
            label={item.label} 
            active={activeTab === item.id} 
            collapsed={isCollapsed} 
            onClick={() => onTabChange(item.id)} 
          />
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-100 space-y-0.5 bg-[#fdfdfd]">
        <SidebarItem icon={Settings} label="Settings" active={activeTab === "Settings"} collapsed={isCollapsed} onClick={() => onTabChange("Settings")} />
      </div>

      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute bottom-32 -right-3 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors z-[60] shadow-sm"
      >
        {isCollapsed ? <ChevronRight size={12} className="text-slate-400" /> : <ChevronLeft size={12} className="text-slate-400" />}
      </button>
    </aside>
  );
}
