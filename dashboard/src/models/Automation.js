import mongoose from "mongoose";

const AutomationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "InstagramAccount", required: true, index: true },

  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["comment_to_dm", "reel_share", "mention_reply", "comment_reply"],
    required: true,
  },
  scope: {
    type: String,
    enum: ["account_wide", "post_specific"],
    default: "account_wide",
  },
  mediaIds: [{ type: String }],

  keywords: [{ type: String }],
  caseSensitive: { type: Boolean, default: false },

  commentReply: {
    enabled: { type: Boolean, default: true },
    message: { type: String, default: "Check your DMs! 📩" },
  },
  dmMessage: { type: String, default: "" },

  followerGate: {
    enabled: { type: Boolean, default: false },
    nonFollowerMessage: { type: String, default: "Follow us first to get access!" },
  },

  enabled: { type: Boolean, default: true },

  stats: {
    triggers: { type: Number, default: 0 },
    repliesSent: { type: Number, default: 0 },
    dmsSent: { type: Number, default: 0 },
    lastTriggeredAt: { type: Date, default: null },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Compound indexes for efficient lookups
AutomationSchema.index({ accountId: 1, enabled: 1 });
AutomationSchema.index({ accountId: 1, type: 1 });

// Keep updatedAt current on every save
AutomationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Automation ||
  mongoose.model("Automation", AutomationSchema);
