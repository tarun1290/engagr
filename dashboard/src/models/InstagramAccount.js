import mongoose from "mongoose";

const InstagramAccountSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  instagramUserId: { type: String, required: true },
  instagramPageScopedId: { type: String, sparse: true },
  instagramUsername: { type: String },
  instagramProfilePic: { type: String },
  accessToken: { type: String },
  tokenExpiresAt: { type: Date },
  tokenExpired: { type: Boolean, default: false },
  isConnected: { type: Boolean, default: true },
  isPrimary: { type: Boolean, default: false },

  automation: {
    postTrigger: { type: String, default: "any" },
    selectedPostId: { type: String },
    commentTrigger: { type: String, default: "any" },
    keywords: { type: [String], default: [] },
    replyEnabled: { type: Boolean, default: true },
    replyMessages: { type: [String], default: ["Check your DM! 📩"] },
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
    mentionsEnabled: { type: Boolean, default: false },
    mentionReplyMessage: { type: String, default: "Thanks for the mention! 🙌" },
    reelShareEnabled: { type: Boolean, default: false },
    reelShareMessage: { type: String, default: "Hey! 👋 Thanks for sharing!" },
    reelShareLinkUrl: { type: String },
    reelShareButtonText: { type: String, default: "Check it out 🚀" },
  },

  createdAt: { type: Date, default: Date.now },
});

// Compound unique: one IG account per user
InstagramAccountSchema.index({ userId: 1, instagramUserId: 1 }, { unique: true });
// Webhook lookup by Instagram user ID (app-scoped)
InstagramAccountSchema.index({ instagramUserId: 1 });
// Webhook lookup by page-scoped ID
InstagramAccountSchema.index({ instagramPageScopedId: 1 }, { sparse: true });

export default mongoose.models.InstagramAccount ||
  mongoose.model("InstagramAccount", InstagramAccountSchema);
