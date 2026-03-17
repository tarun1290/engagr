"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import {
  Zap,
  MessageSquare,
  Share2,
  TrendingUp,
  ArrowUpRight,
  ChevronRight,
  Plus,
  MousePointer2,
  BellRing
} from "lucide-react";
import { cn } from "@/lib/utils";
import HelpCenter from "@/components/Help";
import Automation from "@/components/Automation";
import { getDashboardStats } from './actions';

const FeatureCard = ({ icon: Icon, title, description, badge, activeStatus = "Active" }) => (
  <div className="bg-white p-7 border-r border-slate-100 last:border-0 flex-1 group cursor-pointer hover:bg-slate-50/50 transition-all">
    <div className="flex flex-col h-full justify-between gap-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                <Icon size={20} className="text-slate-600 group-hover:text-primary transition-colors" />
            </div>
            {badge && <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ring-1 ring-amber-200">New</span>}
        </div>
        <div>
            <h4 className="text-[16px] font-bold text-slate-900 mb-1">{title}</h4>
            <p className="text-[13px] text-slate-500 leading-snug">{description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeStatus}</span>
          </div>
          <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  </div>
);

export default function Home() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [stats, setStats] = useState({ contacts: 0, sentToday: 0, transmissionTrend: 0, latestEvents: [] });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "Home":
        return (
          <div className="space-y-16">
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-100">
              <div className="space-y-3">
                <h2 className="text-6xl font-black text-black tracking-tight leading-none flex items-center gap-6">
                    Hello, {stats.instagram?.username || "there"}!
                    {stats.instagram?.isConnected && stats.instagram.profilePic && (
                      <div className="w-14 h-14 rounded-full p-1 bg-gradient-to-tr from-[#FFDA3A] via-[#FF3040] to-[#E5266E] animate-in zoom-in-50 duration-500">
                        <img src={stats.instagram.profilePic} alt="" className="w-full h-full rounded-full border-2 border-white object-cover" />
                      </div>
                    )}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Active System</span>
                  </div>
                  <p className="text-[15px] font-medium text-slate-400">
                     {stats.contacts} registered contacts across your linked {stats.instagram?.isConnected ? (
                       <span className="text-primary font-bold lowercase tracking-tight">@{stats.instagram.username}</span>
                     ) : (
                       "Instagram Account"
                     )}.
                  </p>
                  <div className="w-1 h-1 rounded-full bg-slate-200" />
                  <button className="text-primary text-[14px] font-bold hover:underline">View Insights</button>
                </div>
              </div>
              <button className="bg-primary text-white px-8 py-4 rounded-2xl font-bold text-[14px] hover:opacity-90 transition-all shadow-xl shadow-pink-100 flex items-center gap-2">
                <Plus size={20} /> Create Automation
              </button>
            </section>

            <section>
              <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-black">Active Modules</h3>
                  <button className="text-slate-400 text-[14px] font-bold hover:text-primary flex items-center gap-1 transition-colors">
                      Explore Templates <ArrowUpRight size={16} />
                  </button>
              </div>
              <div className="bg-white border border-slate-100 rounded-[32px] flex flex-col lg:flex-row overflow-hidden shadow-sm">
                  <FeatureCard
                      icon={MessageSquare}
                      title="Comment-to-DM"
                      description="Automatically reply to post comments and send private DMs instantly."
                  />
                  <FeatureCard
                      icon={BellRing}
                      title="Mentions Tracker"
                      description="Capture every time someone mentions @yourbrand in stories or posts."
                  />
                  <FeatureCard
                      icon={Share2}
                      title="Reel Share Linker"
                      description="Detect when reels are shared in DMs and provide direct watch links."
                  />
                  <FeatureCard
                      icon={MousePointer2}
                      title="Interactive Flows"
                      description="Use button templates and generic cards to engage users visually."
                      badge
                  />
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                 <div className="lg:col-span-2 bg-pink-50 p-10 rounded-[40px] border border-pink-100 flex flex-col justify-between group overflow-hidden relative min-h-[240px]">
                     <div className="relative z-10">
                          <p className="text-pink-400 text-[12px] font-black uppercase tracking-[0.2em] mb-4">Transmission Health</p>
                          <h2 className="text-6xl font-black tracking-tighter mb-2 text-primary">{stats.sentToday}</h2>
                          <p className="text-primary/70 text-sm font-medium">Successful replies processed today.</p>
                     </div>
                     <div className="relative z-10 flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-pink-200 rounded-full overflow-hidden">
                              <div className="w-full h-full bg-primary shadow-[0_0_15px_rgba(229,38,110,0.5)]"></div>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Optimal</span>
                     </div>
                     <Zap size={180} className="absolute -bottom-10 -right-10 text-primary/10 -rotate-12 group-hover:scale-110 transition-transform duration-1000" />
                 </div>

                 <div className="bg-white p-10 rounded-[40px] border border-slate-100 flex flex-col justify-center">
                      <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4">Active Trend</p>
                      <h3 className={cn("text-5xl font-black mb-1", stats.transmissionTrend >= 0 ? "text-emerald-500" : "text-rose-500")}>
                          {stats.transmissionTrend > 0 ? '+' : ''}{stats.transmissionTrend}%
                      </h3>
                      <p className="text-slate-500 text-sm font-medium">Growth vs yesterday.</p>
                 </div>

                 <div className="bg-slate-50 p-10 rounded-[40px] flex flex-col justify-center border border-slate-100">
                      <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4">Contacts</p>
                      <h3 className="text-5xl font-black text-slate-900 mb-1">{stats.contacts}</h3>
                      <p className="text-slate-500 text-sm font-medium">Unique IDs tracked.</p>
                 </div>
            </section>
          </div>
        );
      case "Help":
        return <HelpCenter />;
      case "Automation":
        return <Automation />;
      default:
        return (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-slate-400">{activeTab} Section</h3>
              <p className="text-slate-500">This module is currently under development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className={cn(
        "flex flex-col min-h-screen transition-all duration-300",
        isCollapsed ? "pl-20" : "pl-64"
      )}>
        <Navbar />
        <div className="p-12 max-w-7xl w-full mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
