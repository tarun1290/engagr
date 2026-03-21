"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import {
  Zap,
  MessageSquare,
  Share2,
  ArrowUpRight,
  ChevronRight,
  Plus,
  MousePointer2,
  BellRing,
  MessageCircle,
  AtSign,
  Heart,
  Play,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  SkipForward,
  AlertTriangle,
  Image,
  ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Automation from "@/components/Automation";
import Settings from "@/components/Settings";
import Contacts from "@/components/Contacts";
import Activity from "@/components/Activity";
import { getDashboardStats } from './actions';

const INTERACTION_TYPE_CONFIG = {
  comment:    { label: "Comment",    icon: MessageCircle, color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-100"   },
  mention:    { label: "Mention",    icon: AtSign,        color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100" },
  dm:         { label: "DM",         icon: MessageSquare, color: "text-pink-500",   bg: "bg-pink-50",   border: "border-pink-100"   },
  reel_share: { label: "Reel Share", icon: Play,          color: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-100"  },
  reaction:   { label: "Reaction",   icon: Heart,         color: "text-rose-500",   bg: "bg-rose-50",   border: "border-rose-100"   },
  postback:   { label: "Button Tap", icon: MousePointer2, color: "text-cyan-500",   bg: "bg-cyan-50",   border: "border-cyan-100"   },
};

const REPLY_STATUS_CONFIG = {
  sent:          { label: "Replied",  icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  failed:        { label: "Failed",   icon: XCircle,      color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-100"    },
  fallback:      { label: "Fallback", icon: RefreshCw,    color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100"   },
  skipped:       { label: "Skipped",  icon: SkipForward,  color: "text-slate-400",   bg: "bg-slate-50",   border: "border-slate-200"   },
  token_expired: { label: "Expired",  icon: XCircle,      color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-100"  },
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ATTACHMENT_LABELS = {
  reel: "Reel", post_share: "Post", image: "Image",
  video: "Video", audio: "Voice", media: "Media",
};

function InteractionRow({ event }) {
  const typeConf = INTERACTION_TYPE_CONFIG[event.type] || INTERACTION_TYPE_CONFIG.comment;
  const statusConf = REPLY_STATUS_CONFIG[event.reply?.status] || REPLY_STATUS_CONFIG.skipped;
  const TypeIcon = typeConf.icon;
  const StatusIcon = statusConf.icon;

  const thumbnail = event.content?.thumbnailUrl || event.content?.mediaUrl;
  const mediaLink = event.content?.permalink || event.content?.mediaUrl;
  const attachmentLabel = ATTACHMENT_LABELS[event.content?.attachmentType];
  const displayText = event.content?.text
    || (attachmentLabel ? `Sent a ${attachmentLabel.toLowerCase()}` : null)
    || event.reply?.publicReply
    || "—";

  return (
    <div className="flex items-start gap-4 px-6 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
      {/* Type icon */}
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border mt-0.5", typeConf.bg, typeConf.border)}>
        <TypeIcon size={15} className={typeConf.color} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Header row: type · avatar · username · attachment pill */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className={cn("text-[10px] font-black uppercase tracking-widest", typeConf.color)}>
            {typeConf.label}
          </span>
          {event.from?.username ? (
            <span className="text-[12px] font-bold text-slate-700">@{event.from.username}</span>
          ) : event.from?.name ? (
            <span className="text-[12px] font-semibold text-slate-600">{event.from.name}</span>
          ) : event.from?.id ? (
            <span className="text-[11px] font-mono text-slate-400">{event.from.id}</span>
          ) : null}
          {attachmentLabel && (
            <span className="text-[9px] font-black text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
              {attachmentLabel}
            </span>
          )}
        </div>

        {/* Content row: thumbnail + text */}
        <div className="flex items-center gap-3">
          {thumbnail && (
            mediaLink ? (
              <a href={mediaLink} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                <img
                  src={thumbnail}
                  alt="media"
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 hover:border-primary transition-colors"
                />
              </a>
            ) : (
              <img
                src={thumbnail}
                alt="media"
                className="w-11 h-11 rounded-xl object-cover border border-slate-200 flex-shrink-0"
              />
            )
          )}
          <p className="text-[13px] text-slate-500 truncate leading-tight">{displayText}</p>
        </div>
      </div>

      {/* Reply status */}
      <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border flex-shrink-0 mt-0.5", statusConf.bg, statusConf.border)}>
        <StatusIcon size={11} className={statusConf.color} />
        <span className={cn("text-[10px] font-bold uppercase tracking-wider", statusConf.color)}>
          {statusConf.label}
        </span>
      </div>

      {/* Time */}
      <span className="text-[11px] text-slate-400 flex-shrink-0 mt-1">{timeAgo(event.createdAt)}</span>
    </div>
  );
}

const FeatureCard = ({ icon: Icon, title, description, badge, activeStatus = "Active", onClick }) => (
  <div
    onClick={onClick}
    className={cn(
      "bg-white p-7 border-r border-slate-100 last:border-0 flex-1 group transition-all",
      onClick ? "cursor-pointer hover:bg-slate-50/50" : "cursor-default"
    )}
  >
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
  const [stats, setStats] = useState({
    contacts: 0,
    sentToday: 0,
    transmissionTrend: 0,
    totalInteractions: 0,
    interactionsByType: [],
    recentInteractions: [],
  });

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
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "Contacts":
        return <Contacts />;
      case "Activity":
        return <Activity />;
      case "Home":
        return (
          <div className="space-y-16">
            {/* Token expiry warning */}
            {stats.tokenExpired && (
              <div className="flex items-start gap-4 px-6 py-4 bg-orange-50 border border-orange-200 rounded-2xl">
                <AlertTriangle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-orange-800">Instagram token has expired</p>
                  <p className="text-[12px] text-orange-600 mt-0.5">Your automation has stopped working. Reconnect your Instagram account to restore it.</p>
                </div>
                <button
                  onClick={() => window.location.href = '/onboarding'}
                  className="px-4 py-2 bg-orange-500 text-white text-[12px] font-bold rounded-xl hover:bg-orange-600 transition-colors flex-shrink-0"
                >
                  Reconnect
                </button>
              </div>
            )}

            {/* Hero header */}
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
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Active System</span>
                  </div>
                  <p className="text-[15px] font-medium text-slate-400">
                    {stats.contacts} registered contacts across your linked{" "}
                    {stats.instagram?.isConnected ? (
                      <span className="text-primary font-bold lowercase tracking-tight">@{stats.instagram.username}</span>
                    ) : (
                      "Instagram Account"
                    )}.
                  </p>
                  <div className="w-1 h-1 rounded-full bg-slate-200" />
                  <button
                    onClick={() => document.getElementById("interactions-section")?.scrollIntoView({ behavior: "smooth" })}
                    className="text-primary text-[14px] font-bold hover:underline"
                  >
                    View Insights
                  </button>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("Automation")}
                className="bg-primary text-white px-8 py-4 rounded-2xl font-bold text-[14px] hover:opacity-90 transition-all shadow-xl shadow-pink-100 flex items-center gap-2"
              >
                <Plus size={20} /> Create Automation
              </button>
            </section>

            {/* Active Modules */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-black">Active Modules</h3>
                <button
                  onClick={() => setActiveTab("Automation")}
                  className="text-slate-400 text-[14px] font-bold hover:text-primary flex items-center gap-1 transition-colors"
                >
                  Explore Templates <ArrowUpRight size={16} />
                </button>
              </div>
              <div className="bg-white border border-slate-100 rounded-[32px] flex flex-col lg:flex-row overflow-hidden shadow-sm">
                <FeatureCard
                  icon={MessageSquare}
                  title="Comment-to-DM"
                  description="Automatically reply to post comments and send private DMs instantly."
                  onClick={() => setActiveTab("Automation")}
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
                  onClick={() => setActiveTab("Automation")}
                />
              </div>
            </section>

            {/* Automation Status Card */}
            {stats.automation && (
              <section>
                <h3 className="text-2xl font-black text-black mb-6">Automation Status</h3>
                <div className="bg-white border border-slate-100 rounded-[28px] p-8 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-start gap-8">
                    {/* Status indicator */}
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center border",
                        stats.automation.isActive ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-200"
                      )}>
                        <ToggleRight size={22} className={stats.automation.isActive ? "text-emerald-600" : "text-slate-400"} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Status</p>
                        <p className={cn("text-[16px] font-black", stats.automation.isActive ? "text-emerald-600" : "text-slate-400")}>
                          {stats.automation.isActive ? "Live & Active" : "Inactive"}
                        </p>
                      </div>
                    </div>

                    <div className="h-px md:h-auto md:w-px bg-slate-100" />

                    {/* Trigger type */}
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Trigger</p>
                      <p className="text-[14px] font-bold text-slate-700">
                        {stats.automation.postTrigger === "any" ? "Any post or reel" : "Specific post"}
                      </p>
                      <p className="text-[12px] text-slate-400 mt-0.5">
                        {stats.automation.commentTrigger === "any"
                          ? "Any comment fires automation"
                          : `Keywords: ${(stats.automation.keywords || []).join(', ') || 'none'}`}
                      </p>
                    </div>

                    <div className="h-px md:h-auto md:w-px bg-slate-100" />

                    {/* Public reply */}
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Public Reply</p>
                      <p className="text-[14px] font-bold text-slate-700">
                        {stats.automation.replyEnabled ? "Enabled" : "Disabled"}
                      </p>
                      {stats.automation.replyEnabled && stats.automation.replyMessages?.length > 0 && (
                        <p className="text-[12px] text-slate-400 mt-0.5 max-w-[200px] truncate">
                          "{stats.automation.replyMessages[0]}"
                        </p>
                      )}
                    </div>

                    <div className="h-px md:h-auto md:w-px bg-slate-100" />

                    {/* DM preview */}
                    <div className="flex-1">
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">DM Message</p>
                      <p className="text-[13px] text-slate-600 leading-snug line-clamp-2">
                        {stats.automation.dmContent || <span className="text-slate-300 italic">No message set</span>}
                      </p>
                      {stats.automation.linkUrl && (
                        <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-xl w-fit">
                          <Image size={11} className="text-primary flex-shrink-0" />
                          <span className="text-[11px] font-bold text-primary truncate max-w-[180px]">
                            {stats.automation.buttonText || "Link"}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setActiveTab("Automation")}
                      className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-white hover:border-primary/30 hover:text-primary transition-all flex-shrink-0 self-start"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Stats strip */}
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
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4">Total Interactions</p>
                <h3 className="text-5xl font-black text-slate-900 mb-1">{stats.totalInteractions ?? stats.contacts}</h3>
                <p className="text-slate-500 text-sm font-medium">All-time events tracked.</p>
              </div>
            </section>

            {/* Interaction Type Breakdown */}
            {stats.interactionsByType?.length > 0 && (
              <section>
                <h3 className="text-2xl font-black text-black mb-6">Interaction Breakdown</h3>
                <div className="flex flex-wrap gap-3">
                  {stats.interactionsByType.map((item) => {
                    const conf = INTERACTION_TYPE_CONFIG[item._id];
                    if (!conf) return null;
                    const Icon = conf.icon;
                    return (
                      <div key={item._id} className={cn("flex items-center gap-3 px-5 py-3 rounded-2xl border", conf.bg, conf.border)}>
                        <Icon size={16} className={conf.color} />
                        <span className="text-xl font-black text-slate-900">{item.count}</span>
                        <span className={cn("text-[11px] font-bold uppercase tracking-widest", conf.color)}>{conf.label}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Interactions Feed */}
            <section id="interactions-section">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-black">Recent Interactions</h3>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  {stats.recentInteractions?.length ?? 0} shown
                </span>
              </div>

              <div className="bg-white border border-slate-100 rounded-[28px] overflow-hidden shadow-sm">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_auto] gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/80">
                  <div className="flex items-center gap-16">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Type</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User · Content</span>
                  </div>
                  <div className="flex items-center gap-8 pr-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reply</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">When</span>
                  </div>
                </div>

                {!stats.recentInteractions?.length ? (
                  <div className="py-16 text-center">
                    <Send size={32} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-medium">No interactions yet.</p>
                    <p className="text-slate-300 text-xs mt-1">They'll appear here once your automation receives events.</p>
                  </div>
                ) : (
                  stats.recentInteractions.map((event) => (
                    <InteractionRow key={event._id} event={event} />
                  ))
                )}
              </div>
            </section>
          </div>
        );
      case "Automation":
        return <Automation />;
      case "Settings":
        return <Settings stats={stats} />;
      default:
        return null;
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
