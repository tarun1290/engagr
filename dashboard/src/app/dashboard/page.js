"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { AccountProvider, useAccount } from "@/lib/AccountContext";
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
  Trash2,
  Link2,
  Brain,
  ShoppingBag,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Automation from "@/components/Automation";
import Settings from "@/components/Settings";
import Contacts from "@/components/Contacts";
import Activity from "@/components/Activity";
import LinksPage from "@/components/LinksPage";
import ComingSoonPage from "@/components/ComingSoonPage";
// [SMART FEATURES] Knowledge Base and Conversations pages — uncomment when enabled
// import KnowledgeBasePage from "@/components/KnowledgeBasePage";
// import ConversationsPage from "@/components/ConversationsPage";
// [/SMART FEATURES]
// [PLANS DISABLED] BillingPage, UpgradePrompt, and gating imports removed for Early Access
// import BillingPage from "@/components/BillingPage";
// import UpgradePrompt from "@/components/UpgradePrompt";
// [/PLANS DISABLED]
import { getDashboardStats, deleteAutomation, toggleAutomation, getHomeStats } from './actions';
import useActivityStream from '@/hooks/useActivityStream';
import LiveIndicator from '@/components/LiveIndicator';
import { DashboardConfigProvider } from '@/lib/DashboardConfigContext';
import { getDashboardConfig } from '@/lib/dashboardConfig';
import { BETA_FEATURES } from '@/lib/betaFeatures';
import { getAiDetectionStats, getTopPerformingLinks, getRecentDetections } from './ai-actions';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ArrowRight, Gift, Users2 as UsersIcon, BarChart3, TrendingUp, ShieldCheck } from "lucide-react";
// [PLANS DISABLED] Subscription/gating imports not needed
// import { getSubscriptionStatus } from './billing-actions';
// import { getTrialWarning, getDmQuotaWarning, canAccessPage } from '@/lib/gating';
// import { getPlanConfig, planRequiredForPage } from '@/lib/plans';
// [/PLANS DISABLED]

/* ── Data-driven config maps ───────────────────────────────────────────────── */

const INTERACTION_TYPE_CONFIG = {
  comment:    { label: "Comment",    icon: MessageCircle, color: 'var(--info)',    bg: 'var(--info-light)',    border: 'var(--info)' },
  mention:    { label: "Mention",    icon: AtSign,        color: 'var(--primary)', bg: 'var(--primary-light)', border: 'var(--primary)' },
  dm:         { label: "DM",         icon: MessageSquare, color: 'var(--accent)',  bg: 'var(--accent-light)',  border: 'var(--accent)' },
  reel_share: { label: "Reel Share", icon: Play,          color: 'var(--warning)', bg: 'var(--warning-light)', border: 'var(--warning)' },
  reaction:   { label: "Reaction",   icon: Heart,         color: 'var(--error)',   bg: 'var(--error-light)',   border: 'var(--error)' },
  postback:   { label: "Button Tap", icon: MousePointer2, color: 'var(--accent)',  bg: 'var(--accent-light)',  border: 'var(--accent)' },
};

const REPLY_STATUS_CONFIG = {
  sent:          { label: "Replied",  icon: CheckCircle2, color: 'var(--success)',      bg: 'var(--success-light)', border: 'var(--success)' },
  failed:        { label: "Failed",   icon: XCircle,      color: 'var(--error)',        bg: 'var(--error-light)',   border: 'var(--error)' },
  fallback:      { label: "Fallback", icon: RefreshCw,    color: 'var(--warning)',      bg: 'var(--warning-light)', border: 'var(--warning)' },
  skipped:       { label: "Skipped",  icon: SkipForward,  color: 'var(--text-muted)',   bg: 'var(--surface-alt)',   border: 'var(--border)' },
  token_expired: { label: "Expired",  icon: XCircle,      color: 'var(--warning)',      bg: 'var(--warning-light)', border: 'var(--warning)' },
};

const ACTIVE_MODULES = [
  { id: 'comment-to-dm', icon: MessageSquare, title: "Comment-to-DM", description: "Automatically reply to post comments and send private DMs instantly.", tab: "Automation" },
  { id: 'mentions-tracker', icon: BellRing, title: "Mentions Tracker", description: "Capture every time someone mentions @yourbrand in stories or posts.", tab: "Automation" },
  { id: 'reel-share', icon: Share2, title: "Reel Share Linker", description: "Detect when reels are shared in DMs and provide direct watch links.", tab: "Automation" },
  { id: 'interactive', icon: MousePointer2, title: "Interactive Flows", description: "Use button templates and generic cards to engage users visually.", badge: true, tab: "Automation" },
];

const ATTACHMENT_LABELS = {
  reel: "Reel", post_share: "Post", image: "Image",
  video: "Video", audio: "Voice", media: "Media",
};

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ── Skeleton loaders ──────────────────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="w-9 h-9 rounded-xl skeleton" />
      <div className="flex-1 space-y-2">
        <div className="w-24 h-3 skeleton" />
        <div className="w-48 h-3 skeleton" />
      </div>
      <div className="w-16 h-6 rounded-full skeleton" />
      <div className="w-12 h-3 skeleton" />
    </div>
  );
}

function SkeletonStat() {
  return (
    <div className="p-10 rounded-[40px] flex flex-col justify-center" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="w-32 h-3 skeleton mb-4" />
      <div className="w-20 h-10 skeleton mb-2" />
      <div className="w-40 h-3 skeleton" />
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────────────── */

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
    || "\u2014";

  return (
    <div className="flex items-start gap-4 px-6 py-4 last:border-0 transition-colors"
      style={{ borderBottom: '1px solid var(--border)' }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-alt)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: typeConf.bg, border: `1px solid ${typeConf.border}20` }}
      >
        <TypeIcon size={15} style={{ color: typeConf.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: typeConf.color }}>
            {typeConf.label}
          </span>
          {event.from?.username ? (
            <span className="text-[12px] font-bold" style={{ color: 'var(--text-secondary)' }}>@{event.from.username}</span>
          ) : event.from?.name ? (
            <span className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{event.from.name}</span>
          ) : event.from?.id ? (
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{event.from.id}</span>
          ) : null}
          {attachmentLabel && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide"
              style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}
            >
              {attachmentLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {thumbnail && (
            mediaLink ? (
              <a href={mediaLink} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                <img src={thumbnail} alt="media" className="w-11 h-11 rounded-xl object-cover transition-colors"
                  style={{ border: '1px solid var(--border)' }}
                />
              </a>
            ) : (
              <img src={thumbnail} alt="media" className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                style={{ border: '1px solid var(--border)' }}
              />
            )
          )}
          <p className="text-[13px] truncate leading-tight" style={{ color: 'var(--text-muted)' }}>{displayText}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5"
        style={{ backgroundColor: statusConf.bg, border: `1px solid ${statusConf.border}20` }}
      >
        <StatusIcon size={11} style={{ color: statusConf.color }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: statusConf.color }}>
          {statusConf.label}
        </span>
      </div>

      <span className="text-[11px] flex-shrink-0 mt-1" style={{ color: 'var(--text-placeholder)' }}>{timeAgo(event.createdAt)}</span>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, badge, activeStatus = "Active", onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn("p-7 flex-1 group transition-all", onClick ? "cursor-pointer" : "cursor-default")}
      style={{ backgroundColor: 'var(--card)', borderRight: '1px solid var(--border)' }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.backgroundColor = 'var(--surface-alt)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)'; }}
    >
      <div className="flex flex-col h-full justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}
            >
              <Icon size={20} style={{ color: 'var(--text-secondary)' }} />
            </div>
            {badge && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter"
                style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning-dark)', border: '1px solid var(--warning)' }}
              >New</span>
            )}
          </div>
          <div>
            <h4 className="text-[16px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h4>
            <p className="text-[13px] leading-snug" style={{ color: 'var(--text-muted)' }}>{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--success)' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>{activeStatus}</span>
          </div>
          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-placeholder)' }} />
        </div>
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────────── */

function DashboardContent() {
  const { selectedAccountId } = useAccount();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [showDeleteAutomation, setShowDeleteAutomation] = useState(false);
  const [deletingAutomation, setDeletingAutomation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [togglingAutomation, setTogglingAutomation] = useState(false);
  // [PLANS DISABLED] Subscription state not needed during Early Access
  // const [subData, setSubData] = useState(null);
  // const [trialBannerDismissed, setTrialBannerDismissed] = useState(false);
  // [/PLANS DISABLED]
  const { events: liveEvents, isConnected } = useActivityStream();

  const [stats, setStats] = useState({
    contacts: 0,
    sentToday: 0,
    transmissionTrend: 0,
    totalInteractions: 0,
    interactionsByType: [],
    reelCategoryBreakdown: [],
    recentInteractions: [],
  });
  const [aiStats, setAiStats] = useState(null);
  const [topLinks, setTopLinks] = useState([]);
  const [recentDetections, setRecentDetections] = useState([]);
  const [homeStats, setHomeStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [data, homeData] = await Promise.all([
          getDashboardStats(selectedAccountId),
          getHomeStats(selectedAccountId),
        ]);
        setStats(data);
        setHomeStats(homeData);
        // Load AI stats only if feature is enabled (completely hidden otherwise)
        if (data.aiFeatureEnabled) {
          const [aiRes, linksRes, detectRes] = await Promise.all([
            getAiDetectionStats(selectedAccountId),
            getTopPerformingLinks(selectedAccountId, 5),
            getRecentDetections(selectedAccountId, 5),
          ]);
          if (aiRes.success) setAiStats(aiRes);
          if (linksRes.success) setTopLinks(linksRes.links);
          if (detectRes.success) setRecentDetections(detectRes.detections);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [selectedAccountId]);

  const handleToggleAutomation = async () => {
    if (togglingAutomation) return;
    setTogglingAutomation(true);
    try {
      const newState = !stats.automation.isActive;
      const res = await toggleAutomation(newState);
      if (res.success) {
        setStats(prev => ({ ...prev, automation: { ...prev.automation, isActive: res.isActive } }));
      }
    } catch (err) {
      console.error("Failed to toggle automation:", err);
    } finally {
      setTogglingAutomation(false);
    }
  };

  const handleDeleteAutomation = async () => {
    setDeletingAutomation(true);
    try {
      const res = await deleteAutomation();
      if (res.success) {
        setStats(prev => ({ ...prev, automation: null }));
        setShowDeleteAutomation(false);
      }
    } catch (err) {
      console.error("Failed to delete automation:", err);
    } finally {
      setDeletingAutomation(false);
    }
  };

  // [PLANS DISABLED] Gated page check disabled — all pages accessible
  // const renderGatedPage = (pageName, Component) => { ... };
  // const trialWarning = subData ? getTrialWarning({ subscription: subData }) : null;
  // const quotaWarning = subData ? getDmQuotaWarning({ ... }) : null;
  // [/PLANS DISABLED]

  const renderContent = () => {
    switch (activeTab) {
      case "Contacts":
        return <Contacts aiEnabled={stats.aiFeatureEnabled} />;
      case "Activity":
        return <Activity aiEnabled={stats.aiFeatureEnabled} />;
      // [PLANS DISABLED] Billing, Analytics, API Keys tabs removed from sidebar
      // case "Billing":
      //   return <BillingPage onNavigate={setActiveTab} />;
      // case "Analytics":
      //   return renderGatedPage("analytics", <UpgradePrompt ... />);
      // case "API Keys":
      //   return renderGatedPage("api_keys", <UpgradePrompt ... />);
      // [/PLANS DISABLED]
      case "Home": {
        const dashConfig = getDashboardConfig(stats.accountType);
        const hc = dashConfig.home;

        // Stat card definitions keyed by config stat names
        const STAT_CARD_META = {
          followers_engaged: { label: "Followers Engaged", color: "var(--primary)", bg: "var(--primary-light)", border: "var(--primary-medium)", suffix: "this month" },
          dms_sent: { label: "DMs Sent", color: "var(--success)", bg: "var(--success-light)", border: "var(--success)", suffix: "this month" },
          comments_detected: { label: "Comments Detected", color: "var(--info)", bg: "var(--info-light)", border: "var(--info)", suffix: "this month" },
          follower_gate_conversions: { label: "Gate Conversions", color: "var(--warning)", bg: "var(--warning-light)", border: "var(--warning)", suffix: "this month" },
          customers_reached: { label: "Customers Reached", color: "var(--primary)", bg: "var(--primary-light)", border: "var(--primary-medium)", suffix: "unique recipients" },
          link_clicks: { label: "Link Clicks", color: "var(--accent)", bg: "var(--accent-light)", border: "var(--accent)", suffix: "button taps" },
          conversion_rate: { label: "Conversion Rate", color: "var(--success)", bg: "var(--success-light)", border: "var(--success)", suffix: "clicks / DMs", isPercent: true },
          total_interactions: { label: "Total Interactions", color: "var(--accent)", bg: "var(--accent-light)", border: "var(--accent)", suffix: "all time" },
          accounts_managed: { label: "Managed Accounts", color: "var(--primary)", bg: "var(--primary-light)", border: "var(--primary-medium)", suffix: "connected" },
          total_dms_sent: { label: "Total DMs Sent", color: "var(--success)", bg: "var(--success-light)", border: "var(--success)", suffix: "across all accounts" },
          active_automations: { label: "Active Automations", color: "var(--info)", bg: "var(--info-light)", border: "var(--info)", suffix: "enabled rules" },
          total_events_today: { label: "Events Today", color: "var(--warning)", bg: "var(--warning-light)", border: "var(--warning)", suffix: "last 24h" },
        };

        // Quick actions per account type
        const QUICK_ACTIONS = {
          creator: [
            { label: "Set up a giveaway", icon: Gift, action: () => setActiveTab("Automation") },
            { label: "Enable follower gate", icon: ShieldCheck, action: () => setActiveTab("Automation") },
            { label: "Connect another account", icon: Plus, action: () => setActiveTab("Settings") },
          ],
          business: [
            { label: "Create product automation", icon: MessageSquare, action: () => setActiveTab("Automation") },
            { label: "Set up reel replies", icon: Play, action: () => setActiveTab("Automation") },
            { label: "Connect Shopify", icon: ShoppingBag, action: () => setActiveTab(`coming-soon:shopify`) },
          ],
          agency: [
            { label: "Connect a client account", icon: Settings, action: () => setActiveTab("Settings") },
            { label: "Set up automation", icon: Zap, action: () => setActiveTab("Automation") },
            { label: "View all activity", icon: BarChart3, action: () => setActiveTab("Activity") },
          ],
        };

        const activityLabels = {
          creator: "Recent engagement",
          business: "Recent customer interactions",
          agency: "Recent activity across accounts",
        };

        const quickActions = QUICK_ACTIONS[stats.accountType || "creator"] || QUICK_ACTIONS.creator;

        return (
          <div className="space-y-12">
            {/* Token expiry warning */}
            {stats.tokenExpired && (
              <div className="flex items-start gap-4 px-6 py-4 rounded-2xl"
                style={{ backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning)' }}>
                <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                <div className="flex-1">
                  <p className="text-[14px] font-bold" style={{ color: 'var(--warning-dark)' }}>Instagram token has expired</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--warning-dark)' }}>Reconnect your Instagram account to restore automation.</p>
                </div>
                <button onClick={() => window.location.href = '/onboarding'}
                  className="px-4 py-2 text-[12px] font-bold rounded-xl flex-shrink-0"
                  style={{ backgroundColor: 'var(--warning)', color: 'var(--btn-primary-text)' }}>
                  Reconnect
                </button>
              </div>
            )}

            {/* Live ticker */}
            {liveEvents.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ backgroundColor: 'var(--success-light)' }}>
                <LiveIndicator isConnected={isConnected} />
                <span className="text-sm" style={{ color: 'var(--success-dark)' }}>
                  Latest: <span className="font-medium">@{liveEvents[0]?.senderUsername}</span> — {liveEvents[0]?.action}
                </span>
              </div>
            )}

            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <h2 className="text-5xl font-black tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>
                    {hc.headline}
                  </h2>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider"
                    style={{ backgroundColor: dashConfig.badgeBg, color: dashConfig.badgeText }}>
                    {dashConfig.emoji} {dashConfig.label}
                  </span>
                </div>
                <p className="text-[15px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Welcome back, {homeStats?.userName || stats.instagram?.username || "there"}
                </p>
              </div>
              <button onClick={() => setActiveTab("Automation")}
                className="px-8 py-4 rounded-2xl font-bold text-[14px] transition-all shadow-xl flex items-center gap-2"
                style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)'}>
                <Plus size={20} /> Create Automation
              </button>
            </section>

            {/* Config-driven stat cards */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {loading || !homeStats ? (
                <>{[1,2,3,4].map(i => <SkeletonStat key={i} />)}</>
              ) : (
                hc.stats.map((statKey) => {
                  const meta = STAT_CARD_META[statKey];
                  if (!meta) return null;
                  const value = homeStats.statValues?.[statKey] ?? 0;
                  return (
                    <div key={statKey} className="p-6 rounded-[24px] flex flex-col justify-between min-h-[160px]"
                      style={{ backgroundColor: meta.bg, border: `1px solid ${meta.border}` }}>
                      <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: meta.color }}>{meta.label}</p>
                      <h3 className="text-4xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                        {meta.isPercent ? `${value}%` : value.toLocaleString()}
                      </h3>
                      <p className="text-[11px] font-medium mt-1" style={{ color: meta.color, opacity: 0.7 }}>{meta.suffix}</p>
                    </div>
                  );
                })
              )}
            </section>

            {/* Quick actions */}
            <section>
              <h3 className="text-lg font-black mb-4" style={{ color: 'var(--text-primary)' }}>Quick actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {quickActions.map((qa) => {
                  const QaIcon = qa.icon;
                  return (
                    <button key={qa.label} onClick={qa.action}
                      className="flex items-center gap-3 p-4 rounded-2xl transition-all text-left group"
                      style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-medium)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                        <QaIcon size={16} style={{ color: 'var(--primary)' }} />
                      </div>
                      <span className="text-[13px] font-bold flex-1" style={{ color: 'var(--text-primary)' }}>{qa.label}</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-placeholder)' }} />
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Charts / Agency client overview */}
            {!loading && homeStats && (
              <section>
                {hc.showGrowthChart && homeStats.chartData?.length > 0 && (
                  <div className="rounded-[24px] p-6" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                    <h3 className="text-lg font-black mb-4" style={{ color: 'var(--text-primary)' }}>Engagement this month</h3>
                    <div style={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer>
                        <ComposedChart data={homeStats.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                          <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                          <Line type="monotone" dataKey="dms" stroke="#4F46E5" strokeWidth={2} dot={false} name="DMs Sent" />
                          <Line type="monotone" dataKey="comments" stroke="#9333EA" strokeWidth={2} dot={false} name="Comments" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {hc.showRevenueChart && homeStats.chartData?.length > 0 && (
                  <div className="rounded-[24px] p-6" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                    <h3 className="text-lg font-black mb-4" style={{ color: 'var(--text-primary)' }}>Customer interactions</h3>
                    <div style={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer>
                        <ComposedChart data={homeStats.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                          <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                          <Bar dataKey="dms" fill="#4F46E5" radius={[4, 4, 0, 0]} name="DMs Sent" />
                          <Line type="monotone" dataKey="clicks" stroke="#059669" strokeWidth={2} dot={false} name="Link Clicks" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {hc.showClientOverview && (
                  <div>
                    <h3 className="text-lg font-black mb-4" style={{ color: 'var(--text-primary)' }}>Client accounts</h3>
                    {homeStats.perAccountStats?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {homeStats.perAccountStats.map((acct) => (
                          <button key={acct._id} onClick={() => { /* could switch account */ }}
                            className="p-5 rounded-2xl text-left transition-all group"
                            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-medium)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
                            <div className="flex items-center gap-3 mb-3">
                              {acct.profilePic ? (
                                <img src={acct.profilePic} alt="" className="w-9 h-9 rounded-full object-cover" style={{ border: '2px solid var(--border)' }} />
                              ) : (
                                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                                  <span className="text-sm font-black">{(acct.username || "?")[0].toUpperCase()}</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black truncate" style={{ color: 'var(--text-primary)' }}>@{acct.username || "unknown"}</p>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: acct.isActive ? 'var(--success)' : 'var(--text-placeholder)' }} />
                                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: acct.isActive ? 'var(--success)' : 'var(--text-placeholder)' }}>
                                    {acct.isActive ? "Active" : "Inactive"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>DMs/mo</p>
                                <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{acct.dmsSentThisMonth}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>Last event</p>
                                <p className="text-[12px] font-bold" style={{ color: 'var(--text-muted)' }}>
                                  {acct.lastEventAt ? timeAgo(acct.lastEventAt) : "—"}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center rounded-2xl" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                        <UsersIcon size={32} className="mx-auto mb-3" style={{ color: 'var(--text-placeholder)' }} />
                        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No client accounts connected yet.</p>
                        <button onClick={() => setActiveTab("Settings")} className="text-[12px] font-bold mt-2" style={{ color: 'var(--primary)' }}>
                          Connect an account
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Automation Status Card */}
            {stats.automation && (
              <section>
                <h3 className="text-lg font-black mb-4" style={{ color: 'var(--text-primary)' }}>Automation Status</h3>
                <div className="rounded-[24px] p-6 shadow-sm" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex items-center gap-4">
                      <button onClick={handleToggleAutomation} disabled={togglingAutomation}
                        className={cn("relative w-14 h-8 rounded-full transition-all duration-300 flex-shrink-0", togglingAutomation && "opacity-60")}
                        style={{ backgroundColor: stats.automation.isActive ? 'var(--success)' : 'var(--text-placeholder)' }}>
                        <span className={cn("absolute top-1 w-6 h-6 rounded-full shadow-md transition-all duration-300", stats.automation.isActive ? "left-7" : "left-1")}
                          style={{ backgroundColor: 'var(--card)' }} />
                      </button>
                      <p className="text-[14px] font-black" style={{ color: stats.automation.isActive ? 'var(--success)' : 'var(--text-muted)' }}>
                        {togglingAutomation ? "Updating..." : stats.automation.isActive ? "Live & Active" : "Paused"}
                      </p>
                    </div>
                    <div className="h-px md:h-8 md:w-px flex-shrink-0" style={{ backgroundColor: 'var(--border)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate" style={{ color: 'var(--text-muted)' }}>
                        {stats.automation.commentTrigger === "any" ? "Any comment" : `Keywords: ${(stats.automation.keywords || []).join(', ')}`}
                        {stats.automation.dmContent ? ` → "${stats.automation.dmContent.substring(0, 40)}..."` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setActiveTab("Automation")}
                        className="px-4 py-2 rounded-xl text-[12px] font-bold transition-all"
                        style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                        Edit
                      </button>
                      <button onClick={() => setShowDeleteAutomation(true)}
                        className="px-3 py-2 rounded-xl transition-all"
                        style={{ backgroundColor: 'var(--error-light)', border: '1px solid var(--error)', color: 'var(--error)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Delete Automation Dialog */}
            {showDeleteAutomation && (
              <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-6" style={{ backgroundColor: 'var(--overlay)' }}>
                <div className="rounded-[24px] p-8 max-w-sm w-full space-y-6 shadow-2xl" style={{ backgroundColor: 'var(--card)' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--error-light)' }}>
                    <Trash2 size={22} style={{ color: 'var(--error)' }} />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Delete Automation?</h3>
                    <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      This will remove your automation settings. You can create a new one anytime.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowDeleteAutomation(false)}
                      className="flex-1 py-3 rounded-xl font-bold text-sm" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      Cancel
                    </button>
                    <button onClick={handleDeleteAutomation} disabled={deletingAutomation}
                      className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-60"
                      style={{ backgroundColor: 'var(--btn-destructive-bg)', color: 'var(--btn-destructive-text)' }}>
                      {deletingAutomation ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Interaction Breakdown */}
            {stats.interactionsByType?.length > 0 && (
              <section>
                <h3 className="text-lg font-black mb-4" style={{ color: 'var(--text-primary)' }}>Interaction Breakdown</h3>
                <div className="flex flex-wrap gap-3">
                  {stats.interactionsByType.map((item) => {
                    const conf = INTERACTION_TYPE_CONFIG[item._id];
                    if (!conf) return null;
                    const Icon = conf.icon;
                    return (
                      <div key={item._id} className="flex items-center gap-3 px-5 py-3 rounded-2xl"
                        style={{ backgroundColor: conf.bg, border: `1px solid ${conf.border}20` }}>
                        <Icon size={16} style={{ color: conf.color }} />
                        <span className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{item.count}</span>
                        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: conf.color }}>{conf.label}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* AI Product Detection — only if admin-enabled */}
            {stats.aiFeatureEnabled && aiStats && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>AI Product Detection</h3>
                  <button onClick={() => setActiveTab("Links")} className="flex items-center gap-1 text-[12px] font-bold" style={{ color: 'var(--primary)' }}>
                    View all links <ChevronRight size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--info-light)', border: '1px solid var(--info)' }}>
                    <Brain size={16} style={{ color: 'var(--info)' }} />
                    <p className="text-2xl font-black mt-2" style={{ color: 'var(--text-primary)' }}>{aiStats.detectionsThisMonth}</p>
                    <p className="text-[11px] font-bold" style={{ color: 'var(--info)' }}>Detections this month</p>
                  </div>
                  <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--success-light)', border: '1px solid var(--success)' }}>
                    <Link2 size={16} style={{ color: 'var(--success)' }} />
                    <p className="text-2xl font-black mt-2" style={{ color: 'var(--text-primary)' }}>{aiStats.linksCreated}</p>
                    <p className="text-[11px] font-bold" style={{ color: 'var(--success)' }}>Links generated</p>
                  </div>
                  <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-medium)' }}>
                    <MousePointer2 size={16} style={{ color: 'var(--primary)' }} />
                    <p className="text-2xl font-black mt-2" style={{ color: 'var(--text-primary)' }}>{aiStats.clicksToday}</p>
                    <p className="text-[11px] font-bold" style={{ color: 'var(--primary)' }}>Link clicks today</p>
                  </div>
                  <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent)' }}>
                    <Eye size={16} style={{ color: 'var(--accent)' }} />
                    <p className="text-2xl font-black mt-2" style={{ color: 'var(--text-primary)' }}>{aiStats.successfulDetections}</p>
                    <p className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>Products identified</p>
                  </div>
                </div>
              </section>
            )}

            {/* Recent Activity — label varies by type */}
            <section id="interactions-section">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                  {activityLabels[stats.accountType || "creator"] || "Recent Interactions"}
                </h3>
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>
                  {stats.recentInteractions?.length ?? 0} shown
                </span>
              </div>
              <div className="rounded-[24px] overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                {loading ? (
                  <>{[1,2,3].map(i => <SkeletonRow key={i} />)}</>
                ) : !stats.recentInteractions?.length ? (
                  <div className="py-16 text-center">
                    <Send size={32} className="mx-auto mb-3" style={{ color: 'var(--text-placeholder)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No interactions yet.</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-placeholder)' }}>They&apos;ll appear here once your automation receives events.</p>
                  </div>
                ) : (
                  stats.recentInteractions.map((event) => (
                    <InteractionRow key={event._id} event={event} />
                  ))
                )}
              </div>
            </section>

            {/* Coming Soon teasers — config-driven */}
            {(() => {
              const teaserSlugs = hc.teaserFeatures || [];
              const teaserItems = teaserSlugs.map((slug) => BETA_FEATURES[slug]).filter(Boolean).map((bf, i) => ({ ...bf, slug: teaserSlugs[i] }));
              if (teaserItems.length === 0) return null;
              return (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap size={18} style={{ color: 'var(--primary)' }} />
                    <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Coming soon</h3>
                  </div>
                  <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", teaserItems.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
                    {teaserItems.map((item) => (
                      <button key={item.slug} onClick={() => setActiveTab(`coming-soon:${item.slug}`)}
                        className="text-left p-5 rounded-2xl transition-all hover:scale-[1.02] group"
                        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-medium)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Zap size={14} style={{ color: 'var(--primary)' }} />
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(124, 58, 237, 0.12)', color: '#7C3AED' }}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[13px] font-black mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{item.headline?.substring(0, 50) || ''}</p>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })()}
          </div>
        );
      }
      case "Links":
        return stats.aiFeatureEnabled ? <LinksPage /> : null;
      // [SMART FEATURES] Knowledge Base and Conversations tabs — uncomment when enabled
      // case "Knowledge":
      //   return stats.smartFeaturesEnabled?.knowledgeBase ? <KnowledgeBasePage /> : null;
      // case "Conversations":
      //   return stats.smartFeaturesEnabled?.smartReplies ? <ConversationsPage /> : null;
      // [/SMART FEATURES]
      case "Automation":
        return <Automation aiEnabled={stats.aiFeatureEnabled} />;
      case "Clients":
        return (
          <div className="max-w-2xl mx-auto py-16">
            <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--primary-light)' }}>
                <UsersIcon size={24} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Client Management</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Client management coming soon — you&apos;ll be able to manage multiple Instagram accounts for your clients from here.
              </p>
              <span className="inline-block mt-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>Coming Soon</span>
            </div>
          </div>
        );
      case "Settings":
        return <Settings stats={stats} />;
      default:
        // Handle coming-soon:featureSlug tabs from beta sidebar items
        if (activeTab.startsWith("coming-soon:")) {
          const slug = activeTab.replace("coming-soon:", "");
          return <ComingSoonPage feature={slug} />;
        }
        return null;
    }
  };

  return (
    <DashboardConfigProvider accountType={stats.accountType}>
      <div className="min-h-screen theme-transition" style={{ backgroundColor: 'var(--bg)' }}>
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          stats={stats}
        />

        <main className={cn(
          "flex flex-col min-h-screen transition-all duration-200",
          isCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        )}>
          <Navbar />
          <div className="px-6 py-6 max-w-[1200px] w-full mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </DashboardConfigProvider>
  );
}

export default function Home() {
  return (
    <AccountProvider>
      <DashboardContent />
    </AccountProvider>
  );
}
