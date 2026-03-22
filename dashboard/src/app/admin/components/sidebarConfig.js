import {
  LayoutDashboard, Users, CreditCard, MessageSquare, ShieldCheck,
  Share2, AtSign, Layers, Sparkles, Link2, ShoppingBag, Brain,
  BookOpen, MessageCircle, BarChart3, Code, DollarSign, Flag,
  Radio, Clock, Settings, Sliders,
} from "lucide-react";

/**
 * Admin sidebar navigation config.
 * status: 'live' (green dot) | 'disabled' (amber dot) | 'planned' (gray dot)
 */
export const SIDEBAR_SECTIONS = [
  {
    label: "OVERVIEW",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    ],
  },
  {
    label: "USERS",
    items: [
      { id: "accounts", label: "All accounts", icon: Users, href: "/admin/accounts" },
      { id: "billing", label: "Plans & billing", icon: CreditCard, href: "/admin/billing" },
    ],
  },
  {
    label: "CORE FEATURES",
    items: [
      { id: "comment-to-dm", label: "Comment-to-DM", icon: MessageSquare, href: "/admin/features/comment-to-dm", status: "live" },
      { id: "follower-gate", label: "Follower gate", icon: ShieldCheck, href: "/admin/features/follower-gate", status: "live" },
      { id: "reel-share", label: "Reel share replies", icon: Share2, href: "/admin/features/reel-share", status: "live" },
      { id: "mentions", label: "Mention detection", icon: AtSign, href: "/admin/features/mentions", status: "live" },
      { id: "reel-rules", label: "Smart reel rules", icon: Layers, href: "/admin/features/reel-rules", status: "live" },
    ],
  },
  {
    label: "AI FEATURES",
    items: [
      { id: "ai-detection", label: "AI product detection", icon: Sparkles, href: "/admin/features/ai-detection", status: "disabled" },
      { id: "smart-links", label: "Smart link tracking", icon: Link2, href: "/admin/features/smart-links", status: "disabled" },
      { id: "shopify", label: "Shopify integration", icon: ShoppingBag, href: "/admin/features/shopify", status: "disabled" },
      { id: "smart-replies", label: "AI smart replies", icon: Brain, href: "/admin/features/smart-replies", status: "disabled" },
      { id: "knowledge-base", label: "Knowledge base", icon: BookOpen, href: "/admin/features/knowledge-base", status: "disabled" },
      { id: "conversations", label: "Conversations", icon: MessageCircle, href: "/admin/features/conversations", status: "disabled" },
    ],
  },
  {
    label: "PLATFORM",
    items: [
      { id: "plans", label: "Plans & pricing", icon: Sliders, href: "/admin/plans", status: "live" },
      { id: "analytics", label: "Analytics", icon: BarChart3, href: "/admin/features/analytics", status: "planned" },
      { id: "api-access", label: "API access", icon: Code, href: "/admin/features/api-access", status: "planned" },
      { id: "payments", label: "Payments", icon: DollarSign, href: "/admin/features/payments", status: "disabled" },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { id: "flags", label: "Feature flags", icon: Flag, href: "/admin/system/flags" },
      { id: "webhooks", label: "Webhook logs", icon: Radio, href: "/admin/system/webhooks" },
      { id: "crons", label: "Cron jobs", icon: Clock, href: "/admin/system/crons" },
      { id: "settings", label: "Settings", icon: Settings, href: "/admin/settings" },
    ],
  },
];

export const STATUS_DOT_COLORS = {
  live: "#059669",
  disabled: "#D97706",
  planned: "#94A3B8",
};
