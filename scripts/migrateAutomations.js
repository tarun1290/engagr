#!/usr/bin/env node

/**
 * One-time migration: convert InstagramAccount.automation config into
 * standalone Automation model documents.
 *
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." node scripts/migrateAutomations.js
 *
 * Idempotent — skips accounts that already have Automation documents.
 * Does NOT delete the legacy automation field from InstagramAccount.
 */

const mongoose = require("mongoose");

// ── Environment ────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI environment variable is required.");
  process.exit(1);
}

// ── Inline schemas (avoids ESM import issues with Next.js source) ──────────

const InstagramAccountSchema = new mongoose.Schema({}, { strict: false });
const InstagramAccount =
  mongoose.models.InstagramAccount ||
  mongoose.model("InstagramAccount", InstagramAccountSchema);

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const EventSchema = new mongoose.Schema({}, { strict: false });
const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

const AutomationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "InstagramAccount", required: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["comment_to_dm", "reel_share", "mention_reply", "comment_reply"],
    required: true,
  },
  scope: { type: String, enum: ["account_wide", "post_specific"], default: "account_wide" },
  mediaIds: [{ type: String }],
  keywords: [{ type: String }],
  caseSensitive: { type: Boolean, default: false },
  commentReply: {
    enabled: { type: Boolean, default: true },
    message: { type: String, default: "Check your DMs! \ud83d\udce9" },
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
AutomationSchema.index({ accountId: 1, enabled: 1 });
AutomationSchema.index({ accountId: 1, type: 1 });

const Automation =
  mongoose.models.Automation || mongoose.model("Automation", AutomationSchema);

// ── Event type mapping ─────────────────────────────────────────────────────
// Maps Automation.type → Event.type values used for stat counting
const EVENT_TYPE_MAP = {
  comment_to_dm: "comment",
  reel_share: "reel_share",
  mention_reply: "mention",
};

// ── Helpers ────────────────────────────────────────────────────────────────

async function countEvents(accountId, eventType, statusFilter) {
  const filter = { accountId, type: eventType };
  if (statusFilter) filter["reply.status"] = statusFilter;
  return Event.countDocuments(filter);
}

async function lastEventDate(accountId, eventType) {
  const ev = await Event.findOne({ accountId, type: eventType })
    .sort({ createdAt: -1 })
    .select("createdAt")
    .lean();
  return ev?.createdAt || null;
}

async function buildStats(accountId, eventType) {
  const [triggers, repliesSent, dmsSent, lastTriggeredAt] = await Promise.all([
    countEvents(accountId, eventType),
    countEvents(accountId, eventType, "sent"),
    // DMs sent: events where a privateDM was included and status is sent
    Event.countDocuments({
      accountId,
      type: eventType,
      "reply.privateDM": { $exists: true, $ne: null },
      "reply.status": "sent",
    }),
    lastEventDate(accountId, eventType),
  ]);
  return { triggers, repliesSent, dmsSent, lastTriggeredAt };
}

// Resolve User._id from the string userId stored on InstagramAccount
const userIdCache = new Map();
async function resolveUserObjectId(userIdStr) {
  if (userIdCache.has(userIdStr)) return userIdCache.get(userIdStr);
  const user = await User.findOne({ userId: userIdStr }).select("_id").lean();
  const oid = user?._id || null;
  userIdCache.set(userIdStr, oid);
  return oid;
}

// ── Main migration ─────────────────────────────────────────────────────────

async function migrate() {
  await mongoose.connect(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
  });
  console.log("[Migration] Connected to MongoDB");

  // Find all accounts that have any automation config
  const accounts = await InstagramAccount.find({
    automation: { $exists: true, $ne: null },
  }).lean();

  console.log(`[Migration] Found ${accounts.length} account(s) with automation config`);

  let totalCreated = 0;
  let accountsMigrated = 0;

  for (const acct of accounts) {
    const accountId = acct._id;
    const auto = acct.automation;
    if (!auto) continue;

    // Idempotent: skip if automations already exist for this account
    const existing = await Automation.countDocuments({ accountId });
    if (existing > 0) {
      console.log(`[Migration] Skipping account ${accountId} — ${existing} automation(s) already exist`);
      continue;
    }

    const userObjectId = await resolveUserObjectId(acct.userId);
    if (!userObjectId) {
      console.warn(`[Migration] Skipping account ${accountId} — no User document found for userId "${acct.userId}"`);
      continue;
    }

    const toCreate = [];

    // ── comment_to_dm ──────────────────────────────────────────────────
    // Exists if keywords are set OR replyEnabled is explicitly configured
    const hasCommentToDm =
      (auto.keywords && auto.keywords.length > 0) ||
      auto.dmContent ||
      auto.replyEnabled === true;

    if (hasCommentToDm) {
      const scope =
        auto.postTrigger === "specific" && auto.selectedPostId
          ? "post_specific"
          : "account_wide";

      const fg = auto.followerGate || {};
      const stats = await buildStats(accountId, EVENT_TYPE_MAP.comment_to_dm);

      toCreate.push({
        userId: userObjectId,
        accountId,
        name: "Comment to DM",
        type: "comment_to_dm",
        scope,
        mediaIds: scope === "post_specific" && auto.selectedPostId ? [auto.selectedPostId] : [],
        keywords: auto.keywords || [],
        commentReply: {
          enabled: auto.replyEnabled ?? true,
          message: (auto.replyMessages && auto.replyMessages[0]) || "Check your DMs! \ud83d\udce9",
        },
        dmMessage: auto.dmContent || "",
        followerGate: {
          enabled: fg.enabled || auto.requireFollow || false,
          nonFollowerMessage:
            fg.nonFollowerMessage?.title || "Follow us first to get access!",
        },
        enabled: auto.isActive ?? true,
        stats,
      });
    }

    // ── reel_share ─────────────────────────────────────────────────────
    if (auto.reelShareEnabled || auto.reelShareMessage) {
      const stats = await buildStats(accountId, EVENT_TYPE_MAP.reel_share);

      toCreate.push({
        userId: userObjectId,
        accountId,
        name: "Reel Share Reply",
        type: "reel_share",
        scope: "account_wide",
        mediaIds: [],
        keywords: [],
        commentReply: {
          enabled: false,
          message: "",
        },
        dmMessage: auto.reelShareMessage || "Hey! \ud83d\udc4b Thanks for sharing!",
        followerGate: {
          enabled: false,
          nonFollowerMessage: "Follow us first to get access!",
        },
        enabled: auto.reelShareEnabled ?? false,
        stats,
      });
    }

    // ── mention_reply ──────────────────────────────────────────────────
    if (auto.mentionsEnabled || auto.mentionReplyMessage) {
      const stats = await buildStats(accountId, EVENT_TYPE_MAP.mention_reply);

      toCreate.push({
        userId: userObjectId,
        accountId,
        name: "Mention Reply",
        type: "mention_reply",
        scope: "account_wide",
        mediaIds: [],
        keywords: [],
        commentReply: {
          enabled: auto.mentionsEnabled ?? false,
          message: auto.mentionReplyMessage || "Thanks for the mention! \ud83d\ude4c",
        },
        dmMessage: "",
        followerGate: {
          enabled: false,
          nonFollowerMessage: "Follow us first to get access!",
        },
        enabled: auto.mentionsEnabled ?? false,
        stats,
      });
    }

    if (toCreate.length === 0) continue;

    const created = await Automation.insertMany(toCreate);
    for (const doc of created) {
      console.log(`[Migration] Created automation '${doc.name}' for account ${accountId}`);
    }
    totalCreated += created.length;
    accountsMigrated++;
  }

  console.log(`\n[Migration] Done. Migrated ${totalCreated} automations for ${accountsMigrated} accounts`);

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("[Migration] Fatal error:", err);
  process.exit(1);
});
