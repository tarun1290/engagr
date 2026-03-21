import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  name: { type: String },
  passwordHash: { type: String },
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
  },

  // ── Subscription & billing ──────────────────────────────────────────────
  subscription: {
    plan: { type: String, enum: ["trial", "silver", "gold", "platinum"], default: "trial" },
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
  },

  // ── Usage tracking ──────────────────────────────────────────────────────
  usage: {
    dmsSentThisMonth: { type: Number, default: 0 },
    dmsSentTotal: { type: Number, default: 0 },
    topUpDmsRemaining: { type: Number, default: 0 },
    monthlyResetDate: { type: Date },
    lastResetAt: { type: Date },
  },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
