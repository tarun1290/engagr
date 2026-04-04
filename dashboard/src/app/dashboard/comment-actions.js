"use server";

import { cookies } from "next/headers";
import dbConnect from "@/lib/dbConnect";
import Event from "@/models/Event";
import InstagramAccount from "@/models/InstagramAccount";
import { verifyToken } from "@/lib/jwt";
import {
  hideComment,
  editComment,
  deleteComment,
  toggleMediaComments,
  getMediaComments,
  getAccountMedia,
} from "@/lib/instagram";

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

// ── Hide or unhide a comment ───────────────────────────────────────────
export async function hideCommentAction(accountId, commentId, hide = true) {
  const userId = await getOwnerId();
  await dbConnect();

  const account = await resolveAccount(userId, accountId);
  if (!account) return { success: false, error: "Account not found" };

  const result = await hideComment(account, commentId, hide);
  if (!result.success) return result;

  await Event.create({
    type: hide ? "comment_hide" : "comment_unhide",
    accountId: account._id,
    targetBusinessId: account.instagramUserId,
    content: { commentId },
    createdAt: new Date(),
  });

  return { success: true };
}

// ── Edit a comment (own comments only) ────────────────────────────────
export async function editCommentAction(accountId, commentId, message) {
  const userId = await getOwnerId();
  await dbConnect();

  const account = await resolveAccount(userId, accountId);
  if (!account) return { success: false, error: "Account not found" };

  return editComment(account, commentId, message);
}

// ── Delete a comment ───────────────────────────────────────────────────
export async function deleteCommentAction(accountId, commentId) {
  const userId = await getOwnerId();
  await dbConnect();

  const account = await resolveAccount(userId, accountId);
  if (!account) return { success: false, error: "Account not found" };

  const result = await deleteComment(account, commentId);
  if (!result.success) return result;

  await Event.create({
    type: "comment_delete",
    accountId: account._id,
    targetBusinessId: account.instagramUserId,
    content: { commentId },
    createdAt: new Date(),
  });

  return { success: true };
}

// ── Enable or disable comments on a media object ───────────────────────
export async function toggleMediaCommentsAction(accountId, mediaId, enabled = true) {
  const userId = await getOwnerId();
  await dbConnect();

  const account = await resolveAccount(userId, accountId);
  if (!account) return { success: false, error: "Account not found" };

  const result = await toggleMediaComments(account, mediaId, enabled);
  if (!result.success) return result;

  await Event.create({
    type: enabled ? "comments_enabled" : "comments_disabled",
    accountId: account._id,
    targetBusinessId: account.instagramUserId,
    content: { mediaId },
    createdAt: new Date(),
  });

  return { success: true };
}

// ── Fetch all comments on a media object (with pagination) ─────────────
export async function getMediaCommentsAction(accountId, mediaId) {
  const userId = await getOwnerId();
  await dbConnect();

  const account = await resolveAccount(userId, accountId);
  if (!account) return { success: false, error: "Account not found" };

  return getMediaComments(account, mediaId);
}

// ─────────────────────────────────────────────────────────────────────
// Event-scoped comment moderation actions
// These accept an eventId and look up the Instagram comment ID + account
// automatically. Used by the Activity page row-level action buttons.
// ─────────────────────────────────────────────────────────────────────

async function resolveEventAndAccount(eventId) {
  const userId = await getOwnerId();
  await dbConnect();

  const event = await Event.findById(eventId);
  if (!event) return { error: "Event not found" };

  const commentId = event.content?.commentId;
  if (!commentId) return { error: "This event has no Instagram comment ID" };

  let account = null;
  if (event.accountId) {
    account = await InstagramAccount.findOne({ _id: event.accountId, userId });
  }
  if (!account && event.targetBusinessId) {
    account = await InstagramAccount.findOne({ instagramUserId: event.targetBusinessId, userId });
  }
  if (!account) return { error: "Linked Instagram account not found" };
  if (!account.accessToken) return { error: "Instagram access token is missing. Please reconnect your account." };
  if (account.tokenExpired) return { error: "Instagram token expired. Please reconnect your account." };

  return { event, account, commentId, userId };
}

// Translate raw Instagram API error messages into friendlier copy.
// Instagram surfaces subcodes/messages for common cases — normalise them here
// so the UI can show one clear sentence instead of leaking API jargon.
function normalizeInstagramError(raw, context) {
  const msg = (raw || "").toString().toLowerCase();
  if (!msg) return `Instagram rejected the ${context}.`;

  // Token / auth failures
  if (msg.includes("access token") || msg.includes("oauth") || msg.includes("session has expired") || msg.includes("token has expired")) {
    return "Instagram token expired. Please reconnect your account.";
  }
  if (msg.includes("permission") || msg.includes("scope")) {
    return "Your Instagram account is missing the required permissions. Please reconnect it.";
  }

  // Comment-specific errors
  if (msg.includes("not found") || msg.includes("does not exist") || msg.includes("unsupported get request")) {
    return "Comment not found on Instagram. It may have already been deleted.";
  }
  if (context === "edit" && (msg.includes("cannot edit") || msg.includes("not owned") || msg.includes("editable"))) {
    return "Instagram only allows editing comments that your own account posted.";
  }
  if (msg.includes("rate") || msg.includes("limit")) {
    return "Instagram rate limit reached. Please try again in a few minutes.";
  }

  // Fall back to the raw message if nothing matched — still prefixed so it's obvious
  return raw;
}

async function handleTokenErrorFlag(account, error) {
  const msg = (error || "").toString().toLowerCase();
  if (msg.includes("access token") || msg.includes("token has expired") || msg.includes("session has expired") || msg.includes("oauth")) {
    try {
      await InstagramAccount.updateOne({ _id: account._id }, { $set: { tokenExpired: true } });
    } catch {}
  }
}

// ── Edit a comment on Instagram by eventId ─────────────────────────────
// Only works for comments YOUR account posted (e.g. public auto-replies).
export async function editCommentOnInstagram(eventId, newText) {
  const text = (newText || "").trim();
  if (!text) return { success: false, error: "New text cannot be empty" };

  const resolved = await resolveEventAndAccount(eventId);
  if (resolved.error) return { success: false, error: resolved.error };
  const { event, account, commentId } = resolved;

  const result = await editComment(account, commentId, text);
  if (!result.success) {
    await handleTokenErrorFlag(account, result.error);
    return { success: false, error: normalizeInstagramError(result.error, "edit") };
  }

  // Update our local mirror so the Activity table reflects the change
  const editedAt = new Date();
  event.content.text = text;
  event.editedAt = editedAt;
  await event.save();

  return { success: true, updatedText: text, editedAt: editedAt.toISOString() };
}

// ── Hide or unhide a comment on Instagram by eventId ───────────────────
export async function hideCommentOnInstagram(eventId, hide = true) {
  const resolved = await resolveEventAndAccount(eventId);
  if (resolved.error) return { success: false, error: resolved.error };
  const { event, account, commentId } = resolved;

  const result = await hideComment(account, commentId, hide);
  if (!result.success) {
    await handleTokenErrorFlag(account, result.error);
    return { success: false, error: normalizeInstagramError(result.error, hide ? "hide" : "unhide") };
  }

  const hiddenAt = new Date();
  event.hidden = !!hide;
  event.hiddenAt = hide ? hiddenAt : null;
  await event.save();

  // Audit trail
  await Event.create({
    type: hide ? "comment_hide" : "comment_unhide",
    accountId: account._id,
    targetBusinessId: account.instagramUserId,
    content: { commentId },
    createdAt: hiddenAt,
  });

  return { success: true, hidden: !!hide, hiddenAt: hide ? hiddenAt.toISOString() : null };
}

// ── Delete a comment on Instagram by eventId (soft delete locally) ─────
export async function deleteCommentOnInstagram(eventId) {
  const resolved = await resolveEventAndAccount(eventId);
  if (resolved.error) return { success: false, error: resolved.error };
  const { event, account, commentId } = resolved;

  const result = await deleteComment(account, commentId);
  if (!result.success) {
    await handleTokenErrorFlag(account, result.error);
    return { success: false, error: normalizeInstagramError(result.error, "delete") };
  }

  // Soft delete locally — keep the event row for audit but mark it deleted
  const deletedAt = new Date();
  event.deletedAt = deletedAt;
  await event.save();

  // Audit trail
  await Event.create({
    type: "comment_delete",
    accountId: account._id,
    targetBusinessId: account.instagramUserId,
    content: { commentId },
    createdAt: deletedAt,
  });

  return { success: true, deletedAt: deletedAt.toISOString() };
}

// ── Fetch the account's recent media posts ─────────────────────────────
export async function getAccountMediaAction(accountId, limit = 20) {
  const userId = await getOwnerId();
  await dbConnect();

  const account = await resolveAccount(userId, accountId);
  if (!account) return { success: false, error: "Account not found" };

  return getAccountMedia({ ...account.toObject(), igUserId: account.instagramUserId }, limit);
}
