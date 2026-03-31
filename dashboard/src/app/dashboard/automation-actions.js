"use server";

import { cookies } from "next/headers";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Event from "@/models/Event";
import InstagramAccount from "@/models/InstagramAccount";
import Automation from "@/models/Automation";
import { verifyToken } from "@/lib/jwt";

async function getOwnerId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (token) {
    const payload = await verifyToken(token);
    if (payload?.userId) return payload.userId;
  }
  return process.env.OWNER_USER_ID || "owner";
}

async function resolveAccount(userId, accountId) {
  if (accountId) return InstagramAccount.findOne({ _id: accountId, userId });
  return (
    (await InstagramAccount.findOne({ userId, isPrimary: true, isConnected: true })) ||
    (await InstagramAccount.findOne({ userId, isConnected: true }))
  );
}

// Resolve the User document's _id from the string userId used by auth.
// Automation.userId is an ObjectId ref, not the string.
async function resolveUserObjectId(userId) {
  const user = await User.findOne({ userId }).select("_id").lean();
  return user?._id || null;
}

// Safely coerce a value to an array of strings
function safeStringArray(val) {
  if (Array.isArray(val)) return val.filter(v => typeof v === "string");
  if (typeof val === "string" && val) return [val];
  return [];
}

// Maps Automation.type → Event.type for activity queries
const AUTOMATION_EVENT_MAP = {
  comment_to_dm: "comment",
  reel_share: "reel_share",
  mention_reply: "mention",
  comment_reply: "comment",
};

// ── List automations for an account ────────────────────────────────────
export async function getAutomationsAction(accountId) {
  const userId = await getOwnerId();
  await dbConnect();

  const account = await resolveAccount(userId, accountId);
  if (!account) return { success: false, error: "Account not found" };

  const automations = await Automation.find({ accountId: account._id })
    .sort({ createdAt: -1 })
    .lean();

  return {
    success: true,
    automations: JSON.parse(JSON.stringify(automations)),
  };
}

// ── Create a new automation ────────────────────────────────────────────
export async function createAutomationAction(accountId, data) {
  try {
  const userId = await getOwnerId();
  await dbConnect();

  const account = await resolveAccount(userId, accountId);
  if (!account) return { success: false, error: "Account not found" };

  const userObjectId = await resolveUserObjectId(userId);
  if (!userObjectId) return { success: false, error: "User not found" };

  if (!data.name || !data.type) {
    return { success: false, error: "Name and type are required" };
  }

  try {
    console.log("[createAutomationAction] building doc...");
    // Use safeStringArray to guard against non-array values from client serialization
    const replyMsgs = safeStringArray(data.commentReply?.messages);
    const fuOptions = safeStringArray(data.followUp?.options);
    const kw = safeStringArray(data.keywords);
    const mIds = safeStringArray(data.mediaIds);

    const automation = await Automation.create({
      userId: userObjectId,
      accountId: account._id,
      name: data.name,
      type: data.type,
      scope: data.scope || "account_wide",
      mediaIds: data.scope === "post_specific" ? mIds : [],
      keywords: kw,
      caseSensitive: data.caseSensitive ?? false,
      commentReply: {
        enabled: data.commentReply?.enabled ?? true,
        messages: replyMsgs.length > 0 ? replyMsgs : ["Check your DMs! \ud83d\udce9"],
      },
      dmMessage: data.dmMessage || "",
      linkUrl: data.linkUrl || "",
      buttonText: data.buttonText || "Get the link \u2192",
      deliveryMessage: data.deliveryMessage || "",
      deliveryButtonText: data.deliveryButtonText || "",
      followUp: {
        enabled: data.followUp?.enabled ?? false,
        question: data.followUp?.question || "",
        options: fuOptions.length > 0 ? fuOptions : ["", ""],
        response: data.followUp?.response || "",
      },
      followerGate: {
        enabled: data.followerGate?.enabled ?? false,
        nonFollowerMessage: data.followerGate?.nonFollowerMessage || "Follow us first to get access!",
      },
      enabled: data.enabled ?? true,
    });

    console.log("[createAutomationAction] created:", automation._id);
    return {
      success: true,
      automation: JSON.parse(JSON.stringify(automation)),
    };
  } catch (err) {
    console.error("[AutomationCRUD] createAutomation error:", err.message, err.stack);
    return { success: false, error: err.message };
  }
  } catch (outerErr) {
    console.error("[AutomationCRUD] OUTER error:", outerErr.message, outerErr.stack);
    return { success: false, error: "Server error: " + (outerErr.message || "unknown") };
  }
}

// ── Update an automation ───────────────────────────────────────────────
export async function updateAutomationAction(automationId, data) {
  const userId = await getOwnerId();
  await dbConnect();

  const userObjectId = await resolveUserObjectId(userId);
  if (!userObjectId) return { success: false, error: "User not found" };

  const automation = await Automation.findOne({ _id: automationId, userId: userObjectId });
  if (!automation) return { success: false, error: "Automation not found" };

  // Only update provided fields
  const allowedFields = [
    "name", "type", "scope", "mediaIds", "keywords", "caseSensitive",
    "commentReply", "dmMessage", "linkUrl", "buttonText",
    "deliveryMessage", "deliveryButtonText", "followUp", "followerGate", "enabled",
  ];
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      automation[field] = data[field];
    }
  }
  // Clear mediaIds when switching away from post_specific
  if (data.scope && data.scope !== "post_specific") {
    automation.mediaIds = [];
  }

  try {
    await automation.save();
    return {
      success: true,
      automation: JSON.parse(JSON.stringify(automation)),
    };
  } catch (err) {
    console.error("[AutomationCRUD] updateAutomation error:", err.message);
    return { success: false, error: err.message };
  }
}

// ── Delete an automation ───────────────────────────────────────────────
export async function deleteAutomationAction(automationId) {
  const userId = await getOwnerId();
  await dbConnect();

  const userObjectId = await resolveUserObjectId(userId);
  if (!userObjectId) return { success: false, error: "User not found" };

  const automation = await Automation.findOne({ _id: automationId, userId: userObjectId });
  if (!automation) return { success: false, error: "Automation not found" };

  await Automation.deleteOne({ _id: automationId });
  return { success: true };
}

// ── Toggle an automation on/off ────────────────────────────────────────
export async function toggleAutomationAction(automationId, enabled) {
  const userId = await getOwnerId();
  await dbConnect();

  const userObjectId = await resolveUserObjectId(userId);
  if (!userObjectId) return { success: false, error: "User not found" };

  const automation = await Automation.findOneAndUpdate(
    { _id: automationId, userId: userObjectId },
    { enabled },
    { new: true },
  );
  if (!automation) return { success: false, error: "Automation not found" };

  return {
    success: true,
    automation: JSON.parse(JSON.stringify(automation)),
  };
}

// ── Get activity events for an automation ──────────────────────────────
export async function getAutomationActivityAction(automationId, page = 1, limit = 20) {
  const userId = await getOwnerId();
  await dbConnect();

  const userObjectId = await resolveUserObjectId(userId);
  if (!userObjectId) return { success: false, error: "User not found" };

  const automation = await Automation.findOne({ _id: automationId, userId: userObjectId }).lean();
  if (!automation) return { success: false, error: "Automation not found" };

  const eventType = AUTOMATION_EVENT_MAP[automation.type];
  if (!eventType) return { success: true, events: [], totalCount: 0, hasMore: false };

  const filter = {
    accountId: automation.accountId,
    type: eventType,
  };

  const skip = (page - 1) * limit;

  const [events, totalCount] = await Promise.all([
    Event.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Event.countDocuments(filter),
  ]);

  return {
    success: true,
    events: JSON.parse(JSON.stringify(events)),
    totalCount,
    hasMore: skip + events.length < totalCount,
  };
}
