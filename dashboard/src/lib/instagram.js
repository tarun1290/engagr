/**
 * Shared Instagram Graph API utilities for comment moderation and media.
 *
 * All functions accept an `account` object with at minimum:
 *   - account.accessToken  (Instagram long-lived token)
 *   - account.igUserId     (Instagram user ID, needed by getAccountMedia)
 *
 * Return shape: { success: true, ...data } or { success: false, error: string }
 */

const IG_BASE = "https://graph.instagram.com/v25.0";

// ── hideComment ────────────────────────────────────────────────────────────
// Hide or unhide a single comment.
// Instagram Graph API: POST /{comment-id}?hide=true/false
export async function hideComment(account, commentId, hide = true) {
  try {
    const url = new URL(`${IG_BASE}/${commentId}`);
    url.searchParams.set("access_token", account.accessToken);
    url.searchParams.set("hide", String(hide));
    const res = await fetch(url.toString(), { method: "POST" });
    const data = await res.json();
    if (res.ok && !data.error) {
      console.log(`[CommentModeration] ${hide ? "Hid" : "Unhid"} comment ${commentId}`);
      return { success: true };
    }
    console.error("[CommentModeration] hideComment failed:", data?.error?.message);
    return { success: false, error: data?.error?.message || "Unknown error" };
  } catch (e) {
    console.error("[CommentModeration] hideComment error:", e.message);
    return { success: false, error: e.message };
  }
}

// ── editComment ───────────────────────────────────────────────────────────
// Edit the text of a comment owned by the business account.
// Instagram Graph API requires message as a query/form parameter, not JSON body.
export async function editComment(account, commentId, message) {
  try {
    const url = new URL(`${IG_BASE}/${commentId}`);
    url.searchParams.set("access_token", account.accessToken);
    url.searchParams.set("message", message);
    const res = await fetch(url.toString(), { method: "POST" });
    const data = await res.json();
    if (res.ok && !data.error) {
      console.log(`[CommentModeration] Edited comment ${commentId}`);
      return { success: true };
    }
    console.error("[CommentModeration] editComment failed:", data?.error?.message);
    return { success: false, error: data?.error?.message || "Cannot edit this comment" };
  } catch (e) {
    console.error("[CommentModeration] editComment error:", e.message);
    return { success: false, error: e.message };
  }
}

// ── deleteComment ──────────────────────────────────────────────────────────
// Permanently delete a comment.
export async function deleteComment(account, commentId) {
  try {
    const url = `${IG_BASE}/${commentId}?access_token=${account.accessToken}`;
    const res = await fetch(url, { method: "DELETE" });
    const data = await res.json();
    if (res.ok && !data.error) {
      console.log(`[CommentModeration] Deleted comment ${commentId}`);
      return { success: true };
    }
    console.error("[CommentModeration] deleteComment failed:", data?.error?.message);
    return { success: false, error: data?.error?.message || "Unknown error" };
  } catch (e) {
    console.error("[CommentModeration] deleteComment error:", e.message);
    return { success: false, error: e.message };
  }
}

// ── toggleMediaComments ────────────────────────────────────────────────────
// Enable or disable commenting on a media object.
// Instagram Graph API: POST /{media-id}?comment_enabled=true/false
export async function toggleMediaComments(account, mediaId, enabled = true) {
  try {
    const url = new URL(`${IG_BASE}/${mediaId}`);
    url.searchParams.set("access_token", account.accessToken);
    url.searchParams.set("comment_enabled", String(enabled));
    const res = await fetch(url.toString(), { method: "POST" });
    const data = await res.json();
    if (res.ok && !data.error) {
      console.log(`[CommentModeration] Comments ${enabled ? "enabled" : "disabled"} on media ${mediaId}`);
      return { success: true };
    }
    console.error("[CommentModeration] toggleMediaComments failed:", data?.error?.message);
    return { success: false, error: data?.error?.message || "Unknown error" };
  } catch (e) {
    console.error("[CommentModeration] toggleMediaComments error:", e.message);
    return { success: false, error: e.message };
  }
}

// ── getMediaComments ───────────────────────────────────────────────────────
// Fetch all comments on a media object, following pagination cursors.
export async function getMediaComments(account, mediaId) {
  try {
    const comments = [];
    let url = `${IG_BASE}/${mediaId}/comments?fields=id,text,timestamp,from,like_count,hidden&access_token=${account.accessToken}`;
    while (url) {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || data.error) {
        console.error("[CommentModeration] getMediaComments failed:", data?.error?.message);
        return { success: false, error: data?.error?.message || "Unknown error" };
      }
      if (data.data) {
        comments.push(...data.data);
      }
      url = data.paging?.next || null;
    }
    console.log(`[CommentModeration] Fetched ${comments.length} comments for media ${mediaId}`);
    return { success: true, comments };
  } catch (e) {
    console.error("[CommentModeration] getMediaComments error:", e.message);
    return { success: false, error: e.message };
  }
}

// ── getAccountMedia ────────────────────────────────────────────────────────
// Fetch the account's recent media posts.
export async function getAccountMedia(account, limit = 20) {
  try {
    const url = `${IG_BASE}/${account.igUserId}/media?fields=id,caption,media_type,thumbnail_url,media_url,timestamp,comments_count&limit=${limit}&access_token=${account.accessToken}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data.error) {
      console.error("[CommentModeration] getAccountMedia failed:", data?.error?.message);
      return { success: false, error: data?.error?.message || "Unknown error" };
    }
    console.log(`[CommentModeration] Fetched ${data.data?.length || 0} media items`);
    return { success: true, media: data.data || [] };
  } catch (e) {
    console.error("[CommentModeration] getAccountMedia error:", e.message);
    return { success: false, error: e.message };
  }
}
