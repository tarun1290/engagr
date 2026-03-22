import mongoose from "mongoose";

const TrackedLinkSchema = new mongoose.Schema({
  shortCode: { type: String, required: true },
  userId: { type: String, required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "InstagramAccount" },
  originalUrl: { type: String, required: true },
  destination: { type: String },

  metadata: {
    productName: { type: String },
    productCategory: {
      type: String,
      enum: ["food", "clothing", "shoes", "accessories", "electronics", "beauty", "home", "fitness", "other", null],
    },
    productBrand: { type: String },
    productImageUrl: { type: String },
    confidence: { type: Number },
    aiProvider: { type: String },
    searchQuery: { type: String },
    reelMediaId: { type: String },
    reelOwnerUsername: { type: String },
    reelPermalink: { type: String },
    senderUsername: { type: String },
  },

  affiliateConfig: {
    isAffiliate: { type: Boolean, default: false },
    affiliateNetwork: { type: String },
    affiliateTag: { type: String },
    overriddenByUser: { type: Boolean, default: false },
    userCustomUrl: { type: String },
  },

  stats: {
    totalClicks: { type: Number, default: 0 },
    uniqueClicks: { type: Number, default: 0 },
    clicksByDate: [{
      date: { type: String },
      clicks: { type: Number, default: 0 },
    }],
    lastClickedAt: { type: Date },
    clicksByCountry: [{
      country: { type: String },
      clicks: { type: Number, default: 0 },
    }],
    clicksByDevice: [{
      device: { type: String, enum: ["mobile", "desktop", "tablet"] },
      clicks: { type: Number, default: 0 },
    }],
  },

  status: { type: String, enum: ["active", "paused", "expired"], default: "active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

TrackedLinkSchema.index({ shortCode: 1 }, { unique: true });
TrackedLinkSchema.index({ userId: 1, createdAt: -1 });
TrackedLinkSchema.index({ accountId: 1 });
TrackedLinkSchema.index({ "metadata.productCategory": 1 });

TrackedLinkSchema.pre("save", function () {
  this.updatedAt = new Date();
});

export default mongoose.models.TrackedLink ||
  mongoose.model("TrackedLink", TrackedLinkSchema);
