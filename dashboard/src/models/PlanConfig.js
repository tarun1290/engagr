import mongoose from "mongoose";

const featureDefaults = (overrides = {}) => ({
  commentToDm: { type: Boolean, default: true },
  followerGate: { type: Boolean, default: true },
  reelShareReply: { type: Boolean, default: true },
  mentionReply: { type: Boolean, default: true },
  reelCategoryRules: { type: Boolean, default: true },
  aiProductDetection: { type: Boolean, default: overrides.aiProductDetection ?? false },
  smartLinks: { type: Boolean, default: overrides.smartLinks ?? false },
  shopifyIntegration: { type: Boolean, default: overrides.shopifyIntegration ?? false },
  aiSmartReplies: { type: Boolean, default: overrides.aiSmartReplies ?? false },
  knowledgeBase: { type: Boolean, default: overrides.knowledgeBase ?? false },
  advancedAnalytics: { type: Boolean, default: overrides.advancedAnalytics ?? false },
  apiAccess: { type: Boolean, default: overrides.apiAccess ?? false },
  facebookLogin: { type: Boolean, default: overrides.facebookLogin ?? false },
});

const planSchema = (defaults) => ({
  name: { type: String, default: defaults.name },
  slug: { type: String, default: defaults.slug },
  price: { type: Number, default: defaults.price },
  currency: { type: String, default: "INR" },
  billingPeriod: { type: String, default: "monthly" },
  dmLimit: { type: Number, default: defaults.dmLimit },
  maxAccounts: { type: Number, default: defaults.maxAccounts },
  maxReelRules: { type: Number, default: defaults.maxReelRules },
  maxKnowledgeDocs: { type: Number, default: defaults.maxKnowledgeDocs },
  features: featureDefaults(defaults.features || {}),
  supportLevel: { type: String, default: defaults.supportLevel },
  dodoProductId: { type: String, default: "" },
  isPopular: { type: Boolean, default: defaults.isPopular ?? false },
  isVisible: { type: Boolean, default: true },
  sortOrder: { type: Number, default: defaults.sortOrder },
});

const PlanConfigSchema = new mongoose.Schema({
  key: { type: String, default: "default", unique: true },
  plans: {
    silver: planSchema({ name: "Silver", slug: "silver", price: 499, dmLimit: 10000, maxAccounts: 1, maxReelRules: 3, maxKnowledgeDocs: 0, supportLevel: "email", sortOrder: 1 }),
    gold: planSchema({ name: "Gold", slug: "gold", price: 999, dmLimit: 50000, maxAccounts: 3, maxReelRules: 5, maxKnowledgeDocs: 5, supportLevel: "priority", isPopular: true, sortOrder: 2, features: { aiProductDetection: true, smartLinks: true, knowledgeBase: true } }),
    platinum: planSchema({ name: "Platinum", slug: "platinum", price: 1499, dmLimit: -1, maxAccounts: 5, maxReelRules: 10, maxKnowledgeDocs: 10, supportLevel: "dedicated", sortOrder: 3, features: { aiProductDetection: true, smartLinks: true, shopifyIntegration: true, aiSmartReplies: true, knowledgeBase: true, advancedAnalytics: true, apiAccess: true, facebookLogin: true } }),
  },
  earlyAccess: {
    enabled: { type: Boolean, default: true },
    dmLimit: { type: Number, default: -1 },
    maxAccounts: { type: Number, default: 5 },
    maxReelRules: { type: Number, default: 5 },
  },
  display: {
    showComingSoonBadges: { type: Boolean, default: true },
    currency: { type: String, default: "INR" },
    currencySymbol: { type: String, default: "₹" },
    showAnnualToggle: { type: Boolean, default: false },
    annualDiscountPercent: { type: Number, default: 20 },
    ctaText: { type: String, default: "Get started" },
    earlyAccessBanner: { type: String, default: "Currently in early access — all features free. No credit card needed." },
  },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: String, default: "system" },
});

PlanConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne({ key: "default" }).lean();
  if (!config) {
    config = await this.create({ key: "default" });
    config = config.toObject();
  }
  return config;
};

PlanConfigSchema.statics.updateConfig = async function (updates, adminEmail) {
  return this.findOneAndUpdate(
    { key: "default" },
    { ...updates, updatedAt: new Date(), updatedBy: adminEmail || "admin" },
    { new: true, upsert: true }
  ).lean();
};

export default mongoose.models.PlanConfig || mongoose.model("PlanConfig", PlanConfigSchema);
