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
} from "lucide-react";
import { cn } from "@/lib/utils";
import Automation from "@/components/Automation";
import Settings from "@/components/Settings";
import Contacts from "@/components/Contacts";
import Activity from "@/components/Activity";
// [PLANS DISABLED] BillingPage, UpgradePrompt, and gating imports removed for Early Access
// import BillingPage from "@/components/BillingPage";
// import UpgradePrompt from "@/components/UpgradePrompt";
// [/PLANS DISABLED]
import { getDashboardStats, deleteAutomation, toggleAutomation } from './actions';
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
        const data = await getDashboardStats(selectedAccountId);
        // [PLANS DISABLED] const sub = await getSubscriptionStatus();
        // if (sub.success) setSubData(sub);
        setStats(data);
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
        return <Contacts />;
      case "Activity":
        return <Activity />;
      // [PLANS DISABLED] Billing, Analytics, API Keys tabs removed from sidebar
      // case "Billing":
      //   return <BillingPage onNavigate={setActiveTab} />;
      // case "Analytics":
      //   return renderGatedPage("analytics", <UpgradePrompt ... />);
      // case "API Keys":
      //   return renderGatedPage("api_keys", <UpgradePrompt ... />);
      // [/PLANS DISABLED]
      case "Home":
        return (
          <div className="space-y-16">
            {/* [PLANS DISABLED] Trial/quota warnings removed for Early Access */}

            {/* Token expiry warning */}
            {stats.tokenExpired && (
              <div className="flex items-start gap-4 px-6 py-4 rounded-2xl"
                style={{ backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning)' }}
              >
                <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                <div className="flex-1">
                  <p className="text-[14px] font-bold" style={{ color: 'var(--warning-dark)' }}>Instagram token has expired</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--warning-dark)' }}>Your automation has stopped working. Reconnect your Instagram account to restore it.</p>
                </div>
                <button
                  onClick={() => window.location.href = '/onboarding'}
                  className="px-4 py-2 text-[12px] font-bold rounded-xl transition-colors flex-shrink-0"
                  style={{ backgroundColor: 'var(--warning)', color: 'var(--btn-primary-text)' }}
                >
                  Reconnect
                </button>
              </div>
            )}

            {/* Hero header */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="space-y-3">
                <h2 className="text-6xl font-black tracking-tight leading-none flex items-center gap-6"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Hello, {stats.instagram?.username || "there"}!
                  {stats.instagram?.isConnected && stats.instagram.profilePic && (
                    <div className="w-14 h-14 rounded-full p-1 animate-in zoom-in-50 duration-500 premium-gradient">
                      <img src={stats.instagram.profilePic} alt="" className="w-full h-full rounded-full object-cover" style={{ border: '2px solid var(--card)' }} />
                    </div>
                  )}
                </h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full"
                    style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--success)' }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Active System</span>
                  </div>
                  <p className="text-[15px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    {stats.contacts} registered contacts across your linked{" "}
                    {stats.instagram?.isConnected ? (
                      <span className="font-bold lowercase tracking-tight" style={{ color: 'var(--primary)' }}>@{stats.instagram.username}</span>
                    ) : (
                      "Instagram Account"
                    )}.
                  </p>
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
                  <button
                    onClick={() => document.getElementById("interactions-section")?.scrollIntoView({ behavior: "smooth" })}
                    className="text-[14px] font-bold hover:underline"
                    style={{ color: 'var(--primary)' }}
                  >
                    View Insights
                  </button>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("Automation")}
                className="px-8 py-4 rounded-2xl font-bold text-[14px] transition-all shadow-xl flex items-center gap-2"
                style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)'}
              >
                <Plus size={20} /> Create Automation
              </button>
            </section>

            {/* Active Modules — data-driven */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Active Modules</h3>
                <button
                  onClick={() => setActiveTab("Automation")}
                  className="text-[14px] font-bold flex items-center gap-1 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  Explore Templates <ArrowUpRight size={16} />
                </button>
              </div>
              <div className="rounded-[32px] flex flex-col lg:flex-row overflow-hidden shadow-sm"
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
              >
                {ACTIVE_MODULES.map((mod) => (
                  <FeatureCard
                    key={mod.id}
                    icon={mod.icon}
                    title={mod.title}
                    description={mod.description}
                    badge={mod.badge}
                    onClick={mod.tab ? () => setActiveTab(mod.tab) : undefined}
                  />
                ))}
              </div>
            </section>

            {/* Automation Status Card */}
            {stats.automation && (
              <section>
                <h3 className="text-2xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>Automation Status</h3>
                <div className="rounded-[28px] p-8 shadow-sm"
                  style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-8">
                    {/* Toggle */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleToggleAutomation}
                        disabled={togglingAutomation}
                        className={cn("relative w-14 h-8 rounded-full transition-all duration-300 flex-shrink-0", togglingAutomation && "opacity-60")}
                        style={{ backgroundColor: stats.automation.isActive ? 'var(--success)' : 'var(--text-placeholder)' }}
                      >
                        <span className={cn("absolute top-1 w-6 h-6 rounded-full shadow-md transition-all duration-300", stats.automation.isActive ? "left-7" : "left-1")}
                          style={{ backgroundColor: 'var(--card)' }}
                        />
                      </button>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>Status</p>
                        <p className="text-[16px] font-black"
                          style={{ color: stats.automation.isActive ? 'var(--success)' : 'var(--text-muted)' }}
                        >
                          {togglingAutomation ? "Updating..." : stats.automation.isActive ? "Live & Active" : "Paused"}
                        </p>
                      </div>
                    </div>

                    <div className="h-px md:h-auto md:w-px" style={{ backgroundColor: 'var(--border)' }} />

                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-placeholder)' }}>Trigger</p>
                      <p className="text-[14px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                        {stats.automation.postTrigger === "any" ? "Any post or reel" : "Specific post"}
                      </p>
                      <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {stats.automation.commentTrigger === "any"
                          ? "Any comment fires automation"
                          : `Keywords: ${(stats.automation.keywords || []).join(', ') || 'none'}`}
                      </p>
                    </div>

                    <div className="h-px md:h-auto md:w-px" style={{ backgroundColor: 'var(--border)' }} />

                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-placeholder)' }}>Public Reply</p>
                      <p className="text-[14px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                        {stats.automation.replyEnabled ? "Enabled" : "Disabled"}
                      </p>
                      {stats.automation.replyEnabled && stats.automation.replyMessages?.length > 0 && (
                        <p className="text-[12px] mt-0.5 max-w-[200px] truncate" style={{ color: 'var(--text-muted)' }}>
                          &ldquo;{stats.automation.replyMessages[0]}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="h-px md:h-auto md:w-px" style={{ backgroundColor: 'var(--border)' }} />

                    <div className="flex-1">
                      <p className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-placeholder)' }}>DM Message</p>
                      <p className="text-[13px] leading-snug line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                        {stats.automation.dmContent || <span style={{ color: 'var(--text-placeholder)' }} className="italic">No message set</span>}
                      </p>
                      {stats.automation.linkUrl && (
                        <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl w-fit"
                          style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-medium)' }}
                        >
                          <Image size={11} className="flex-shrink-0" style={{ color: 'var(--primary)' }} />
                          <span className="text-[11px] font-bold truncate max-w-[180px]" style={{ color: 'var(--primary)' }}>
                            {stats.automation.buttonText || "Link"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0 self-start">
                      <button
                        onClick={() => setActiveTab("Automation")}
                        className="px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all"
                        style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-medium)'; e.currentTarget.style.color = 'var(--primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteAutomation(true)}
                        className="px-3 py-2.5 rounded-xl transition-all"
                        style={{ backgroundColor: 'var(--error-light)', border: '1px solid var(--error)', color: 'var(--error)' }}
                        title="Delete automation"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Delete Automation Dialog */}
            {showDeleteAutomation && (
              <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                style={{ backgroundColor: 'var(--overlay)' }}
              >
                <div className="rounded-[24px] p-8 max-w-sm w-full space-y-6 shadow-2xl"
                  style={{ backgroundColor: 'var(--card)' }}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                    style={{ backgroundColor: 'var(--error-light)' }}
                  >
                    <Trash2 size={22} style={{ color: 'var(--error)' }} />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Delete Automation?</h3>
                    <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      This will remove your automation settings including triggers, keywords, reply messages, and DM content. You can create a new one anytime.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteAutomation(false)}
                      className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
                      style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--card)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAutomation}
                      disabled={deletingAutomation}
                      className="flex-1 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
                      style={{ backgroundColor: 'var(--btn-destructive-bg)', color: 'var(--btn-destructive-text)' }}
                    >
                      {deletingAutomation ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats strip */}
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {loading ? (
                <>
                  <div className="lg:col-span-2"><SkeletonStat /></div>
                  <SkeletonStat />
                  <SkeletonStat />
                </>
              ) : (
                <>
                  <div className="p-10 rounded-[40px] flex flex-col justify-between group overflow-hidden relative min-h-[240px]"
                    style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-medium)' }}
                  >
                    <div className="relative z-10">
                      <p className="text-[12px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--primary)' }}>Transmission Health</p>
                      <h2 className="text-6xl font-black tracking-tighter mb-2" style={{ color: 'var(--primary)' }}>{stats.sentToday}</h2>
                      <p className="text-sm font-medium" style={{ color: 'var(--primary)', opacity: 0.7 }}>Replies sent today.</p>
                    </div>
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--primary-medium)' }}>
                        <div className="w-full h-full" style={{ backgroundColor: 'var(--primary)' }} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Optimal</span>
                    </div>
                    <Zap size={180} className="absolute -bottom-10 -right-10 -rotate-12 group-hover:scale-110 transition-transform duration-1000" style={{ color: 'var(--primary)', opacity: 0.1 }} />
                  </div>

                  {/* [PLANS DISABLED] DM Usage card — show "Unlimited" for Early Access */}
                  <div className="p-10 rounded-[40px] flex flex-col justify-center"
                    style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-placeholder)' }}>
                      DM Usage
                    </p>
                    <h3 className="text-3xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
                      Unlimited
                    </h3>
                    <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
                      Early Access — no limits
                    </p>
                  </div>

                  <div className="p-10 rounded-[40px] flex flex-col justify-center"
                    style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-placeholder)' }}>Active Trend</p>
                    <h3 className="text-5xl font-black mb-1"
                      style={{ color: stats.transmissionTrend >= 0 ? 'var(--success)' : 'var(--error)' }}
                    >
                      {stats.transmissionTrend > 0 ? '+' : ''}{stats.transmissionTrend}%
                    </h3>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Growth vs yesterday.</p>
                  </div>

                  <div className="p-10 rounded-[40px] flex flex-col justify-center"
                    style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-placeholder)' }}>Total Interactions</p>
                    <h3 className="text-5xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>{stats.totalInteractions ?? stats.contacts}</h3>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>All-time events tracked.</p>
                  </div>
                </>
              )}
            </section>

            {/* Interaction Type Breakdown */}
            {stats.interactionsByType?.length > 0 && (
              <section>
                <h3 className="text-2xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>Interaction Breakdown</h3>
                <div className="flex flex-wrap gap-3">
                  {stats.interactionsByType.map((item) => {
                    const conf = INTERACTION_TYPE_CONFIG[item._id];
                    if (!conf) return null;
                    const Icon = conf.icon;
                    return (
                      <div key={item._id} className="flex items-center gap-3 px-5 py-3 rounded-2xl"
                        style={{ backgroundColor: conf.bg, border: `1px solid ${conf.border}20` }}
                      >
                        <Icon size={16} style={{ color: conf.color }} />
                        <span className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{item.count}</span>
                        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: conf.color }}>{conf.label}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Interactions Feed */}
            <section id="interactions-section">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Recent Interactions</h3>
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>
                  {stats.recentInteractions?.length ?? 0} shown
                </span>
              </div>

              <div className="rounded-[28px] overflow-hidden shadow-sm"
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="grid grid-cols-[1fr_auto] gap-4 px-6 py-3"
                  style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-alt)' }}
                >
                  <div className="flex items-center gap-16">
                    <span className="text-[10px] font-black uppercase tracking-widest w-24" style={{ color: 'var(--text-placeholder)' }}>Type</span>
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>User &middot; Content</span>
                  </div>
                  <div className="flex items-center gap-8 pr-2">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>Reply</span>
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>When</span>
                  </div>
                </div>

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
    <div className="min-h-screen theme-transition" style={{ backgroundColor: 'var(--bg)' }}>
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

export default function Home() {
  return (
    <AccountProvider>
      <DashboardContent />
    </AccountProvider>
  );
}
