/**
 * Dashboard Config — single source of truth for account-type-driven UI
 *
 * Each account type (creator, business, agency) gets its own sidebar layout,
 * home page configuration, automation language, and feature visibility.
 *
 * The sidebar is rendered entirely from this config — no hardcoded items.
 * Admin-enabled features override Coming Soon links at render time.
 */

export const DASHBOARD_CONFIG = {
  creator: {
    label: "Creator",
    emoji: "\uD83C\uDFA8",
    icon: "Sparkles",
    color: "#9333EA",
    badgeBg: "#F3E8FF",
    badgeText: "#7C3AED",
    sidebar: {
      sections: [
        {
          title: "OVERVIEW",
          items: [
            { id: "Home", label: "Dashboard", icon: "Home" },
          ],
        },
        {
          title: "ENGAGEMENT",
          items: [
            { id: "Automation", label: "Automation", icon: "Zap" },
            { id: "Contacts", label: "Growth", icon: "TrendingUp", pageTitle: "Audience Growth" },
            { id: "Activity", label: "Activity", icon: "Activity" },
          ],
        },
        {
          title: "COMING SOON",
          items: [
            { id: "beta:advanced-analytics", label: "Analytics", icon: "BarChart3", badge: "Beta", betaSlug: "advanced-analytics" },
            { id: "beta:smart-links", label: "Links", icon: "Link", badge: "Beta", betaSlug: "smart-links", featureKey: "smart-links", enabledId: "Links" },
          ],
        },
        {
          title: "",
          items: [
            { id: "Settings", label: "Settings", icon: "Settings" },
          ],
        },
      ],
    },
    home: {
      headline: "Your engagement at a glance",
      stats: ["followers_engaged", "dms_sent", "comments_detected", "follower_gate_conversions"],
      showGrowthChart: true,
      showRevenueChart: false,
      showClientOverview: false,
      teaserFeatures: ["ai-product-detection", "smart-links", "advanced-analytics"],
    },
    automation: {
      tabs: ["comment-to-dm", "reel-shares", "mention-replies", "follower-gate", "comment-reply"],
      emphasis: "follower-gate",
      language: {
        dmRecipient: "follower",
        triggerAction: "engages with your content",
        goalDescription: "grow your audience and boost engagement",
      },
    },
    features: {
      maxAccounts: 2,
      showShopify: false,
      showKnowledgeBase: false,
      showSmartReplies: false,
      showApiAccess: false,
      showFacebookLogin: false,
    },
  },

  business: {
    label: "Business",
    emoji: "\uD83C\uDFEA",
    icon: "ShoppingBag",
    color: "#4F46E5",
    badgeBg: "#EEF2FF",
    badgeText: "#4F46E5",
    sidebar: {
      sections: [
        {
          title: "OVERVIEW",
          items: [
            { id: "Home", label: "Dashboard", icon: "Home" },
          ],
        },
        {
          title: "AUTOMATION",
          items: [
            { id: "Automation", label: "Automation", icon: "Zap" },
            { id: "Contacts", label: "Customers", icon: "Users", pageTitle: "Customer Management" },
            { id: "Activity", label: "Activity", icon: "Activity" },
          ],
        },
        {
          title: "COMING SOON",
          items: [
            { id: "beta:shopify", label: "Shopify", icon: "ShoppingBag", badge: "Beta", betaSlug: "shopify", featureKey: "shopify" },
            { id: "beta:smart-replies", label: "Smart Replies", icon: "Bot", badge: "Beta", betaSlug: "smart-replies", featureKey: "smart-replies" },
            { id: "beta:knowledge-base", label: "Knowledge Base", icon: "BookOpen", badge: "Beta", betaSlug: "knowledge-base", featureKey: "knowledge-base" },
            { id: "beta:smart-links", label: "Links", icon: "Link", badge: "Beta", betaSlug: "smart-links", featureKey: "smart-links", enabledId: "Links" },
          ],
        },
        {
          title: "",
          items: [
            { id: "Settings", label: "Settings", icon: "Settings" },
          ],
        },
      ],
    },
    home: {
      headline: "Your business performance",
      stats: ["dms_sent", "customers_reached", "link_clicks", "conversion_rate"],
      showGrowthChart: false,
      showRevenueChart: true,
      showClientOverview: false,
      teaserFeatures: ["shopify", "smart-replies", "knowledge-base", "ai-product-detection"],
    },
    automation: {
      tabs: ["comment-to-dm", "reel-shares", "mention-replies", "follower-gate", "comment-reply"],
      emphasis: "comment-to-dm",
      language: {
        dmRecipient: "customer",
        triggerAction: "asks about your products",
        goalDescription: "drive sales and support customers",
      },
    },
    features: {
      maxAccounts: 3,
      showShopify: true,
      showKnowledgeBase: true,
      showSmartReplies: true,
      showApiAccess: false,
      showFacebookLogin: false,
    },
  },

  agency: {
    label: "Agency / SMM",
    emoji: "\uD83C\uDFE2",
    icon: "Building2",
    color: "#D97706",
    badgeBg: "#FFFBEB",
    badgeText: "#B45309",
    sidebar: {
      sections: [
        {
          title: "OVERVIEW",
          items: [
            { id: "Home", label: "Dashboard", icon: "Home" },
          ],
        },
        {
          title: "MANAGEMENT",
          items: [
            { id: "Settings", label: "Accounts", icon: "Users", pageTitle: "Client Accounts", description: "Manage connected Instagram accounts" },
            { id: "Automation", label: "Automation", icon: "Zap" },
            { id: "Contacts", label: "Contacts", icon: "Contact" },
            { id: "Activity", label: "Activity", icon: "Activity" },
          ],
        },
        {
          title: "TOOLS",
          items: [
            { id: "beta:conversations", label: "Conversations", icon: "MessageCircle", badge: "Beta", betaSlug: "conversations", featureKey: "conversations", enabledId: "Conversations" },
            { id: "beta:knowledge-base", label: "Knowledge Base", icon: "BookOpen", badge: "Beta", betaSlug: "knowledge-base", featureKey: "knowledge-base", enabledId: "Knowledge" },
            { id: "beta:smart-links", label: "Links", icon: "Link", badge: "Beta", betaSlug: "smart-links", featureKey: "smart-links", enabledId: "Links" },
            { id: "beta:advanced-analytics", label: "Analytics", icon: "BarChart3", badge: "Beta", betaSlug: "advanced-analytics" },
          ],
        },
        {
          title: "",
          items: [
            { id: "Settings", label: "Settings", icon: "Settings" },
          ],
        },
      ],
    },
    home: {
      headline: "Client overview",
      stats: ["accounts_managed", "total_dms_sent", "active_automations", "total_events_today"],
      showGrowthChart: false,
      showRevenueChart: false,
      showClientOverview: true,
      teaserFeatures: ["smart-replies", "knowledge-base", "advanced-analytics", "api-access"],
    },
    automation: {
      tabs: ["comment-to-dm", "reel-shares", "mention-replies", "follower-gate", "comment-reply"],
      emphasis: "comment-to-dm",
      language: {
        dmRecipient: "user",
        triggerAction: "interacts with the account",
        goalDescription: "manage automations across client accounts",
      },
    },
    features: {
      maxAccounts: 5,
      showShopify: true,
      showKnowledgeBase: true,
      showSmartReplies: true,
      showApiAccess: true,
      showFacebookLogin: true,
    },
  },
};

/**
 * Get the dashboard config for a given account type.
 * Falls back to creator if type is null/unknown.
 */
export function getDashboardConfig(accountType) {
  return DASHBOARD_CONFIG[accountType] || DASHBOARD_CONFIG.creator;
}
