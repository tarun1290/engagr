import mongoose from "mongoose";

const WebhookLogSchema = new mongoose.Schema({
  source: { type: String, enum: ["instagram", "shopify", "dodo"], default: "instagram" },
  eventType: { type: String },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "InstagramAccount" },
  userId: { type: String },
  status: { type: String, enum: ["success", "failed", "skipped"], default: "success" },
  processingTimeMs: { type: Number },
  payload: { type: mongoose.Schema.Types.Mixed },
  errorMessage: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 2592000 }, // TTL: 30 days
});

WebhookLogSchema.index({ createdAt: -1 });
WebhookLogSchema.index({ status: 1 });

export default mongoose.models.WebhookLog ||
  mongoose.model("WebhookLog", WebhookLogSchema);
