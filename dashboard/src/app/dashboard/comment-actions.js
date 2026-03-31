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

// ── Fetch the account's recent media posts ─────────────────────────────
export async function getAccountMediaAction(accountId, limit = 20) {
  const userId = await getOwnerId();
  await dbConnect();

  const account = await resolveAccount(userId, accountId);
  if (!account) return { success: false, error: "Account not found" };

  return getAccountMedia({ ...account.toObject(), igUserId: account.instagramUserId }, limit);
}
