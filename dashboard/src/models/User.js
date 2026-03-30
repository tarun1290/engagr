import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  name: { type: String },
  passwordHash: { type: String },
  googleId: { type: String, default: null },
  authProvider: { type: String, enum: ["email", "google", "instagram"], default: "email" },
  accountType: { type: String, enum: ["creator", "business", "agency"], default: "creator" },
  agencyProfile: {
    companyName: { type: String },
    website: { type: String },
    clientCount: { type: Number, default: 0 },
  },
  businessProfile: {
    businessName: { type: String },
    industry: { type: String },
    website: { type: String },
  },
  profilePicture: { type: String, default: null },
  instagramAccessToken: { type: String },
  instagramBusinessId: { type: String },
  instagramWebhookId: { type: String },
  instagramUsername: { type: String },
  instagramProfilePic: { type: String },
  isConnected: { type: Boolean, default: false },
  tokenExpired: { type: Boolean, default: false },
  tokenExpiresAt: { type: Date },
  automation: {
    postTrigger: { type: String, default: 'any' },
    selectedPostId: { type: String },
    commentTrigger: { type: String, default: 'any' },
    keywords: { type: [String], default: [] },
    replyEnabled: { type: Boolean, default: true },
    replyMessages: { type: [String], default: ['Check your DM! 📩'] },
    dmContent: { type: String },
    buttonText: { type: String },
    linkUrl: { type: String },
    deliveryMessage: { type: String },
    deliveryButtonText: { type: String },
    isActive: { type: Boolean, default: false },
    requireFollow: { type: Boolean, default: false },
    followPromptPublicReply: { type: String },
    followPromptDM: { type: String },
    followButtonText: { type: String, default: "I'm following now! ✓" },

    // Mentions tracker
    mentionsEnabled: { type: Boolean, default: false },
    mentionReplyMessage: { type: String, default: "Thanks for the mention! 🙌" },

    // Reel share linker
    reelShareEnabled: { type: Boolean, default: false },
    reelShareMessage: { type: String, default: "Hey! 👋 Thanks for sharing!" },
    reelShareLinkUrl: { type: String },
    reelShareButtonText: { type: String, default: "Check it out 🚀" },

    // Smart Reel Replies — category-based auto-reply rules
    reelCategories: {
      type: [{
        name: { type: String, required: true },
        enabled: { type: Boolean, default: true },
        priority: { type: Number, default: 0 },
        detection: {
          keywords: { type: [String], default: [] },
          hashtags: { type: [String], default: [] },
          accountUsernames: { type: [String], default: [] },
          specificReelIds: { type: [String], default: [] },
        },
        matchMode: { type: String, enum: ["any", "all"], default: "any" },
        reply: {
          message: { type: String, default: "" },
          linkUrl: { type: String, default: "" },
          buttonText: { type: String, default: "Check it out 🚀" },
        },
        stats: {
          totalMatches: { type: Number, default: 0 },
          totalRepliesSent: { type: Number, default: 0 },
          lastMatchedAt: { type: Date },
        },
        createdAt: { type: Date, default: Date.now },
      }],
      default: [],
      validate: [arr => arr.length <= 5, "Maximum 5 reel categories allowed"],
    },
    reelShareDefaultReply: {
      enabled: { type: Boolean, default: true },
      message: { type: String, default: "" },
      linkUrl: { type: String, default: "" },
      buttonText: { type: String, default: "Check it out 🚀" },
    },
  },

  // ── Admin-gated feature flags (hidden from users) ─────────────────────────
  flags: {
    aiProductDetectionUnlocked: { type: Boolean, default: false },
    shopifyEnabled: { type: Boolean, default: false },
    knowledgeBaseEnabled: { type: Boolean, default: false },
    smartRepliesEnabled: { type: Boolean, default: false },
  },

  // ── Subscription & billing ──────────────────────────────────────────────
  subscription: {
    plan: { type: String, default: "early_access" },
    status: { type: String, enum: ["active", "past_due", "cancelled", "expired", "trialing"], default: "trialing" },
    dodoCustomerId: { type: String },
    dodoSubscriptionId: { type: String },
    dodoProductId: { type: String },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    trialEndsAt: { type: Date },
    cancelledAt: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    downgradeToPlan: { type: String },
    downgradeEffectiveDate: { type: Date },
    cancellationReason: { type: String, enum: ["too_expensive", "not_using", "switching_competitor", "missing_feature", "other", null] },
    // [PAYMENTS DISABLED] Advanced subscription lifecycle fields
    onHoldAt: { type: Date },
    onHoldReason: { type: String },
    planChangedAt: { type: Date },
    previousPlan: { type: String },
    dmLimit: { type: Number },
    maxAccounts: { type: Number },
    creditBalance: { type: Number, default: 0 },
    // [/PAYMENTS DISABLED]
  },

  // ── Usage tracking ──────────────────────────────────────────────────────
  usage: {
    dmsSentThisMonth: { type: Number, default: 0 },
    dmsSentTotal: { type: Number, default: 0 },
    topUpDmsRemaining: { type: Number, default: 0 },
    monthlyResetDate: { type: Date },
    lastResetAt: { type: Date },
    aiDetectionsThisMonth: { type: Number, default: 0 },
    aiDetectionsTotal: { type: Number, default: 0 },
    aiCostThisMonth: { type: Number, default: 0 },
  },

  createdAt: { type: Date, default: Date.now },
});

UserSchema.index({ googleId: 1 }, { sparse: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
