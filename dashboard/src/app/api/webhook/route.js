import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import InstagramAccount from '@/models/InstagramAccount';
import Event from '@/models/Event';
import ProcessedMid from '@/models/ProcessedMid';
import { checkDmQuota } from '@/lib/gating';
import { matchReelToCategory } from '@/lib/reelMatcher';
import { runProductDetection } from '@/lib/ai/detectProduct';
// [SMART FEATURES] import { runSmartReplyPipeline } from '@/lib/smartReply/pipeline';

// Business Login for Instagram uses graph.instagram.com — NOT graph.facebook.com
// instagram_oembed is the only call that stays on graph.facebook.com
const IG_BASE = 'https://graph.instagram.com/v25.0';
const FB_BASE = 'https://graph.facebook.com/v25.0';
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// ─── Graph API Helpers ────────────────────────────────────────────────────────

async function getMedia(id, token) {
    if (!id) return null;
    try {
        const url = new URL(`${IG_BASE}/${id}`);
        url.searchParams.set('fields', 'id,media_type,permalink,media_url,thumbnail_url,shortcode,timestamp,username,caption');
        url.searchParams.set('access_token', token);
        const res = await fetch(url.toString());
        return res.ok ? res.json() : null;
    } catch { return null; }
}

async function getOEmbed(mediaUrl, token) {
    if (!mediaUrl) return null;
    try {
        // instagram_oembed lives on graph.facebook.com
        const url = new URL(`${FB_BASE}/instagram_oembed`);
        url.searchParams.set('url', mediaUrl);
        url.searchParams.set('fields', 'thumbnail_url,title,author_name');
        url.searchParams.set('access_token', token);
        const res = await fetch(url.toString());
        return res.ok ? res.json() : null;
    } catch { return null; }
}

async function getUser(id, token) {
    if (!id) return null;
    try {
        const url = new URL(`${IG_BASE}/${id}`);
        url.searchParams.set('fields', 'name,username');
        url.searchParams.set('access_token', token);
        const res = await fetch(url.toString());
        return res.ok ? res.json() : null;
    } catch { return null; }
}

// With Instagram User Tokens (Business Login), /me resolves to the Instagram
// account — so /me/messages sends from the correct Instagram account directly.
async function sendDM(recipientId, text, token) {
    if (!recipientId || !text) return;
    try {
        const url = new URL(`${IG_BASE}/me/messages`);
        url.searchParams.set('access_token', token);
        const res = await fetch(url.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient: { id: recipientId }, message: { text } })
        });
        const data = await res.json();
        if (data.error) console.error('[DM Error]', data.error.message);
        else console.log(`[DM Sent] -> ${recipientId}`);
        return data;
    } catch (e) { console.error('[DM Error]', e.message); }
}

async function sendQuickReply(recipientId, text, quickReplies, token) {
    const url = new URL(`${IG_BASE}/me/messages`);
    url.searchParams.set('access_token', token);
    const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text, quick_replies: quickReplies.slice(0, 13) }
        })
    });
    const data = await res.json();
    if (data.error) throw new Error(`Quick reply failed: ${data.error.message}`);
    return data;
}

async function sendGenericTemplate(recipientId, elements, token) {
    const url = new URL(`${IG_BASE}/me/messages`);
    url.searchParams.set('access_token', token);
    const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            recipient: { id: recipientId },
            message: { attachment: { type: 'template', payload: { template_type: 'generic', elements } } }
        })
    });
    if (!res.ok) throw new Error(`Generic template failed: ${res.status}`);
    return res.json();
}

// Public reply to a comment on your own post
// For Business Login for Instagram: POST /{comment-id}/replies with message param
// Fallback: POST /{media-id}/comments for top-level reply
async function replyToComment(commentId, text, token, mediaId) {
    // Try replying directly to the comment
    try {
        const url = new URL(`${IG_BASE}/${commentId}/replies`);
        url.searchParams.set('access_token', token);
        url.searchParams.set('message', text);
        const res = await fetch(url.toString(), { method: 'POST' });
        const data = await res.json();
        if (res.ok && !data.error) {
            console.log(`[replyToComment] ✅ Replied to comment ${commentId}`);
            return data;
        }
        console.warn('[replyToComment] replies endpoint failed:', data?.error?.message);
    } catch (e) {
        console.warn('[replyToComment] replies endpoint error:', e.message);
    }

    // Fallback: post a comment on the media itself
    if (mediaId) {
        try {
            const url2 = new URL(`${IG_BASE}/${mediaId}/comments`);
            url2.searchParams.set('access_token', token);
            url2.searchParams.set('message', text);
            const res2 = await fetch(url2.toString(), { method: 'POST' });
            const data2 = await res2.json();
            if (res2.ok && !data2.error) {
                console.log(`[replyToComment] ✅ Commented on media ${mediaId}`);
                return data2;
            }
            console.error('[replyToComment Fallback Error]', JSON.stringify(data2));
            throw new Error(`Reply failed: ${res2.status} — ${data2?.error?.message || 'unknown'}`);
        } catch (e2) {
            console.error('[replyToComment Fallback]', e2.message);
            throw e2;
        }
    }

    throw new Error(`Reply failed: no valid endpoint for comment ${commentId}`);
}

// Private DM to a commenter — MUST use /me/messages with recipient.comment_id
// This is the only valid way to initiate a private DM from a comment (Business Login)
// Quick replies are NOT supported here (first-contact thread); plain text only
async function sendPrivateReply(commentId, text, token) {
    try {
        const url = new URL(`${IG_BASE}/me/messages`);
        url.searchParams.set('access_token', token);
        const res = await fetch(url.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { comment_id: commentId },
                message: { text }
            })
        });
        const data = await res.json();
        if (data.error) console.error('[PrivateReply Error]', data.error.message);
        return data;
    } catch (e) {
        console.error('[PrivateReply Error]', e.message);
        return null;
    }
}

// Reply to a @mention of the business in a comment on another user's post
// Uses POST /{ig-user-id}/mentions with media_id + comment_id
async function replyToMention(igUserId, mediaId, commentId, text, token) {
    try {
        const url = new URL(`${IG_BASE}/${igUserId}/mentions`);
        url.searchParams.set('access_token', token);
        const res = await fetch(url.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ media_id: mediaId, comment_id: commentId, message: text })
        });
        const data = await res.json();
        if (data.error) console.error('[Mention Reply Error]', data.error.message);
        return data;
    } catch (e) {
        console.error('[Mention Reply Error]', e.message);
        return null;
    }
}

// Send a button template that fires a postback when tapped.
// Used for the follow-gate confirmation button.
// recipient must be an IGSID (obtained from a prior sendPrivateReply response).
async function sendFollowGateMessage(igScopedId, text, buttonTitle, commenterIUI, token) {
    try {
        const url = new URL(`${IG_BASE}/me/messages`);
        url.searchParams.set('access_token', token);
        const res = await fetch(url.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: igScopedId },
                message: {
                    attachment: {
                        type: 'template',
                        payload: {
                            template_type: 'button',
                            text,
                            buttons: [{
                                type: 'postback',
                                title: buttonTitle,
                                // Encode the commenter's Instagram User ID so we can
                                // verify their follow status when the postback fires
                                payload: `CHECK_FOLLOW:${commenterIUI}`
                            }]
                        }
                    }
                }
            })
        });
        const data = await res.json();
        if (data.error) console.error('[FollowGate Button Error]', data.error.message);
        return data;
    } catch (e) {
        console.error('[FollowGate Button Error]', e.message);
        return null;
    }
}

// Deliver the final content — thank you message + link button template
// Used after "Yes" confirmation (no follow gate) or follow-gate verification
function normalizeUrl(url) {
    if (!url) return null;
    url = url.trim().replace(/\s/g, '');
    if (!url) return null;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    if (url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
    }
    return url;
}

async function deliverContent(recipientId, token, automation, igUsername) {
    const deliveryText = automation.deliveryMessage
        || `Thank you for your support! 🙌🙏\n\nHere you go. Click the button below to get your content :)`;
    const rawLinkUrl = automation.linkUrl;
    const linkUrl = normalizeUrl(rawLinkUrl);
    const buttonLabel = automation.deliveryButtonText || 'Get Content →';

    console.log(`[Delivery] URL: ${rawLinkUrl} → ${linkUrl} | Button: "${buttonLabel}"`);

    if (linkUrl) {
        // Send template with button link
        try {
            await sendGenericTemplate(recipientId, [{
                title: 'Your content is ready! 🎉',
                subtitle: deliveryText.slice(0, 80),
                default_action: { type: 'web_url', url: linkUrl },
                buttons: [{
                    type: 'web_url',
                    url: linkUrl,
                    title: buttonLabel.slice(0, 20)
                }]
            }], token);
            console.log(`[Delivery] ✅ Template sent to ${recipientId} with URL: ${linkUrl}`);
        } catch (e) {
            console.error('[Delivery Template Error]', e.message);
            // Fallback: send as plain text with link
            await sendDM(recipientId, `${deliveryText}\n\n🔗 ${linkUrl}`, token);
        }
    } else {
        // No link — send plain text delivery message
        console.log(`[Delivery] No URL configured — sending plain text`);
        await sendDM(recipientId, deliveryText, token);
    }
}

// Check if a specific user is in the business account's followers list.
// Paginates through up to maxPages x 200 = 2000 followers.
// For larger accounts this is a best-effort check — if the user isn't found
// within the first 2000 followers, they are treated as a non-follower.
async function checkIsFollower(commenterId, token, maxPages = 10) {
    let url = `${IG_BASE}/me/followers?fields=id&limit=200&access_token=${token}`;
    for (let page = 0; page < maxPages; page++) {
        try {
            const res = await fetch(url);
            if (!res.ok) break;
            const data = await res.json();
            if (data.error) { console.warn('[FollowCheck] API error:', data.error.message); break; }
            if (data.data?.some(f => f.id === commenterId)) return true;
            if (!data.paging?.next) break;
            url = data.paging.next;
        } catch (e) { console.error('[FollowCheck] Error:', e.message); break; }
    }
    return false;
}

async function saveEvent(data) {
    try {
        await dbConnect();
        return await Event.create(data);
    } catch (err) {
        console.error('[DB] Failed to save event:', err.message);
    }
}

// ── DM Quota enforcement ────────────────────────────────────────────────────
// Returns { allowed, source } or { allowed: false, reason }.
// If blocked, logs a quota_exceeded event (once per day per user).
async function enforceDmQuota(botUser, accountId, igBusinessId) {
    if (!botUser) return { allowed: true, source: 'monthly' };

    const quota = checkDmQuota(botUser);
    if (quota.allowed) return quota;

    // Blocked — check if we already logged a quota_exceeded event today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const existingToday = await Event.findOne({
        targetBusinessId: igBusinessId,
        type: 'dm',
        'reply.status': 'quota_exceeded',
        createdAt: { $gte: startOfDay },
    });

    if (!existingToday) {
        await saveEvent({
            type: 'dm',
            accountId,
            targetBusinessId: igBusinessId,
            from: { id: 'system' },
            content: { text: `DM quota exceeded: ${quota.reason}` },
            reply: { status: 'quota_exceeded' },
        });
        console.log(`[Quota] First quota_exceeded event today for user ${botUser.userId} — ${quota.reason}`);
    }

    console.log(`[Quota] Blocked DM for user ${botUser.userId} — ${quota.reason} (sent=${quota.dmsSent}/${quota.dmLimit})`);
    return quota;
}

// Atomically update DM usage after a successful send.
async function trackDmUsage(botUser, source) {
    if (!botUser?._id) return;
    try {
        if (source === 'topup') {
            await User.findByIdAndUpdate(botUser._id, {
                $inc: { 'usage.dmsSentTotal': 1, 'usage.topUpDmsRemaining': -1 },
            });
        } else {
            await User.findByIdAndUpdate(botUser._id, {
                $inc: { 'usage.dmsSentThisMonth': 1, 'usage.dmsSentTotal': 1 },
            });
        }
    } catch (err) {
        console.error('[Usage] Failed to track DM usage:', err.message);
    }
}

// Attempt to refresh an expired/expiring token at runtime.
// If refresh succeeds, updates the DB and returns the new token.
// If refresh fails, marks user as disconnected.
async function handleTokenExpiry(userId, currentToken, igAccountId) {
    try {
        await dbConnect();

        // Try to refresh before giving up
        if (currentToken) {
            try {
                const refreshUrl = new URL(`${IG_BASE}/refresh_access_token`);
                refreshUrl.searchParams.set('grant_type', 'ig_refresh_token');
                refreshUrl.searchParams.set('access_token', currentToken);
                const refreshRes = await fetch(refreshUrl.toString());
                const refreshData = await refreshRes.json();

                if (!refreshData.error && refreshData.access_token) {
                    const expiresIn = refreshData.expires_in || 5184000;
                    const newExpiry = new Date(Date.now() + expiresIn * 1000);

                    // Update InstagramAccount if available
                    if (igAccountId) {
                        await InstagramAccount.findByIdAndUpdate(igAccountId, {
                            accessToken: refreshData.access_token,
                            tokenExpiresAt: newExpiry,
                            tokenExpired: false,
                        });
                    }
                    // Keep legacy User in sync
                    await User.findOneAndUpdate(
                        { userId },
                        {
                            instagramAccessToken: refreshData.access_token,
                            tokenExpiresAt: newExpiry,
                            tokenExpired: false,
                        }
                    );
                    console.log(`[Token] Refreshed token for user ${userId} — new expiry in ${Math.round(expiresIn / 86400)} days`);
                    return refreshData.access_token;
                }
            } catch (e) {
                console.error('[Token Refresh] Inline refresh failed:', e.message);
            }
        }

        // Refresh failed — mark as disconnected
        if (igAccountId) {
            await InstagramAccount.findByIdAndUpdate(igAccountId, {
                isConnected: false, tokenExpired: true, 'automation.isActive': false,
            });
        }
        await User.findOneAndUpdate(
            { userId },
            { isConnected: false, tokenExpired: true }
        );
        console.warn(`[Token] Marked user ${userId} as disconnected — token expired and refresh failed`);
        return null;
    } catch (err) {
        console.error('[Token Expiry Handler]', err.message);
        return null;
    }
}

// Check API response for token expiry and handle it
function checkTokenError(data, botUser, igAccountId) {
    if (data?.error?.code === 190) {
        handleTokenExpiry(botUser.userId, igAccountId ? null : botUser?.instagramAccessToken, igAccountId);
        return true;
    }
    return false;
}

async function handleAutoReply(commentId, senderId, type, fromInfo, rawPayload, token, automation, botUser, accountId) {
    console.log(`[AutoReply] Start — commentId=${commentId} senderId=${senderId} type=${type}`);
    if (!commentId) { console.log('[AutoReply] ❌ No commentId — skipping'); return; }

    // Dedup check
    try {
        await dbConnect();
        const existing = await Event.findOne({ 'content.commentId': commentId, 'reply.status': { $in: ['sent', 'skipped'] } });
        if (existing) {
            console.log(`[Skip] Already replied to: ${commentId}`);
            return;
        }
    } catch {}

    if (!automation?.isActive) {
        console.log(`[AutoReply] ❌ Automation not active — isActive=${automation?.isActive}`);
        return;
    }
    console.log(`[AutoReply] ✅ Automation active — postTrigger=${automation.postTrigger} commentTrigger=${automation.commentTrigger} requireFollow=${automation.requireFollow}`);

    // Comments webhook nests the media ID at value.media.id — NOT value.media_id
    const mediaId = rawPayload.media?.id || rawPayload.media_id || rawPayload.post_id;
    if (automation.postTrigger === 'specific' && automation.selectedPostId && mediaId !== automation.selectedPostId) {
        console.log(`[AutoReply] ❌ Media mismatch — got=${mediaId} expected=${automation.selectedPostId}`);
        return;
    }

    const commentText = (fromInfo?.text || '').toLowerCase();
    if (automation.commentTrigger === 'specific' && automation.keywords?.length > 0) {
        const hasKeyword = automation.keywords.some(k => commentText.includes(k.toLowerCase()));
        if (!hasKeyword) {
            console.log(`[AutoReply] ❌ Keyword mismatch — text="${commentText}" keywords=${JSON.stringify(automation.keywords)}`);
            return;
        }
    }

    // ── Quota check before sending any DM ──────────────────────────────────
    const quota = await enforceDmQuota(botUser, accountId, automation.instagramBusinessId);
    if (!quota.allowed) {
        await saveEvent({
            type,
            accountId,
            targetBusinessId: automation.instagramBusinessId,
            from: { id: fromInfo?.id, username: fromInfo?.username, name: fromInfo?.name },
            content: { commentId, text: fromInfo?.text, mediaId },
            reply: { status: 'quota_exceeded' },
        });
        return;
    }

    const igUsername = botUser?.instagramUsername || '';
    const publicReply = automation.replyMessages?.[0] || 'Check your DM! 📩';

    // ── Step 1: Public reply to the comment ──────────────────────────────────
    if (automation.replyEnabled) {
        // Rate limit: Instagram allows ~60 comment replies per hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentCommentReplies = await Event.countDocuments({
            accountId, type: 'comment', 'reply.publicReply': { $exists: true, $ne: null },
            createdAt: { $gte: oneHourAgo },
        }).catch(() => 0);

        if (recentCommentReplies >= 55) {
            console.warn(`[CommentReply] Rate limit approaching (${recentCommentReplies}/hr). Skipping public reply.`);
        } else {
            const replyText = publicReply
                .replace('{{username}}', fromInfo?.username ? `@${fromInfo.username}` : '')
                .replace('{{keyword}}', '');
            try {
                const replyResult = await replyToComment(commentId, replyText, token, mediaId);
                console.log(`[CommentReply] ✅ Public reply sent to comment ${commentId}: "${replyText}"`);
            } catch (e) {
                console.error('[CommentReply] ⚠️ Failed (DM will still send):', e.message);
            }
        }
    }

    // ── Step 2: Send initial DM with confirmation button (single message) ────
    const greetingText = automation.dmContent || 'Hey there! Thanks for your interest 😊';
    const confirmButtonText = automation.buttonText || 'Yes';

    // Use sendPrivateReply to initiate the conversation (required by Instagram for comment-based DMs)
    // This sends the greeting text + gets the recipient's IG-scoped ID
    const firstContact = await sendPrivateReply(commentId, greetingText, token);
    const igScopedId = firstContact?.recipient_id;

    if (!firstContact || firstContact.error) {
        const status = checkTokenError(firstContact, botUser, accountId) ? 'token_expired' : 'failed';
        console.error('[AutoReply] ❌ Failed to send initial DM');
        await saveEvent({
            type,
            accountId,
            targetBusinessId: automation.instagramBusinessId,
            from: { id: fromInfo?.id, username: fromInfo?.username, name: fromInfo?.name },
            content: { commentId, text: fromInfo?.text, mediaId },
            reply: { publicReply, privateDM: greetingText, status },
        });
        return;
    }

    // Send the confirmation button as a FOLLOW-UP message (different content from greeting)
    // The greeting text was already sent via sendPrivateReply above
    if (igScopedId) {
        try {
            const url = new URL(`${IG_BASE}/me/messages`);
            url.searchParams.set('access_token', token);
            await fetch(url.toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: { id: igScopedId },
                    message: {
                        attachment: {
                            type: 'template',
                            payload: {
                                template_type: 'button',
                                text: 'Tap below to get your content 👇',
                                buttons: [{
                                    type: 'postback',
                                    title: confirmButtonText,
                                    payload: `CONFIRM_INTEREST:${senderId}`
                                }]
                            }
                        }
                    }
                })
            });
        } catch (e) {
            console.error('[Confirm Button Error]', e.message);
        }
    }

    console.log(`[AutoReply] ✅ Sent greeting + confirmation button to @${fromInfo?.username || senderId}`);
    await trackDmUsage(botUser, quota.source);
    await saveEvent({
        type,
        accountId,
        targetBusinessId: automation.instagramBusinessId,
        from: { id: fromInfo?.id, username: fromInfo?.username, name: fromInfo?.name },
        content: { commentId, text: fromInfo?.text, mediaId },
        reply: { publicReply, privateDM: greetingText, status: 'sent' },
    });
}

// ─── GET — Webhook Verification ──────────────────────────────────────────────

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log(`[Webhook] Verification attempt — mode=${mode} token=${token?.substring(0, 5)}...`);

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[Webhook] ✅ Verified successfully');
        return new NextResponse(challenge, { status: 200 });
    }

    console.log('[Webhook] ❌ Verification failed — token mismatch');
    return new NextResponse('Forbidden', { status: 403 });
}

// ─── POST — Incoming Webhook Events ──────────────────────────────────────────

export async function POST(request) {
    // Read raw body text for signature validation before parsing JSON
    let rawBody;
    try {
        rawBody = await request.text();
    } catch {
        return new NextResponse('Bad Request', { status: 400 });
    }

    // X-Hub-Signature-256 validation (required by Meta)
    // Uses META_APP_SECRET from "API Setup with Instagram Login" product
    const appSecret = process.env.META_APP_SECRET;
    const sigHeader = request.headers.get('x-hub-signature-256');
    if (appSecret && sigHeader) {
        const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex');
        if (sigHeader !== expected) {
            console.warn('[Webhook] ❌ Signature mismatch — rejecting request');
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    let body;
    try {
        body = JSON.parse(rawBody);
    } catch {
        return new NextResponse('Bad Request', { status: 400 });
    }

    console.log(`[Webhook POST] object=${body.object} entries=${body.entry?.length || 0}`);

    if (body.object !== 'instagram') {
        console.log(`[Webhook] ❌ Unexpected object type: ${body.object}`);
        return new NextResponse('Not Found', { status: 404 });
    }

    const entries = body.entry || [];

    for (const entry of entries) {
        const targetId = String(entry.id);

        try { await dbConnect(); } catch (e) {
            console.error('[DB Error]', e.message);
            continue;
        }

        // ── Account lookup with auto-link for webhook IGBA ID mismatch ──────
        // OAuth stores the app-scoped Instagram User ID (from /me).
        // Webhooks send the Instagram Business Account (IGBA) ID in entry.id.
        // These are different IDs for the same account. Auto-link on first webhook.

        // Step A: Direct match on either stored ID field
        let igAccount = await InstagramAccount.findOne({
            $or: [
                { instagramPageScopedId: targetId },
                { instagramUserId: targetId },
            ],
            isConnected: true,
        }).catch(() => null);

        // Also check disconnected accounts (may have been disconnected by mistake)
        if (!igAccount) {
            igAccount = await InstagramAccount.findOne({
                $or: [
                    { instagramPageScopedId: targetId },
                    { instagramUserId: targetId },
                ],
            }).catch(() => null);
            if (igAccount) {
                console.log(`[Webhook] Found @${igAccount.instagramUsername} but isConnected=${igAccount.isConnected}`);
            }
        }

        // Step B: Auto-link — if no direct match, try to link by username via API
        if (!igAccount) {
            console.log(`[Webhook] No direct match for ID ${targetId}. Attempting auto-link...`);
            const anyAccount = await InstagramAccount.findOne({
                isConnected: true, accessToken: { $exists: true, $ne: null },
            }).catch(() => null);

            if (anyAccount) {
                try {
                    const profileRes = await fetch(
                        `https://graph.instagram.com/v25.0/${targetId}?fields=username&access_token=${anyAccount.accessToken}`
                    );
                    const profileData = await profileRes.json();

                    if (profileData.username) {
                        console.log(`[Webhook] Webhook ID ${targetId} belongs to @${profileData.username}`);
                        igAccount = await InstagramAccount.findOne({
                            instagramUsername: profileData.username,
                            isConnected: true,
                        }).catch(() => null);

                        if (igAccount) {
                            igAccount.instagramPageScopedId = targetId;
                            await igAccount.save();
                            console.log(`[Webhook] AUTO-LINKED: Stored IGBA ID ${targetId} for @${igAccount.instagramUsername} (was uid=${igAccount.instagramUserId})`);
                        }
                    } else {
                        console.log(`[Webhook] Could not fetch username for ID ${targetId}:`, profileData.error?.message || 'unknown');
                    }
                } catch (e) {
                    console.error(`[Webhook] Auto-link API failed:`, e.message);
                }
            }
        }

        // Step C: Single-account auto-link fallback
        if (!igAccount) {
            const connectedAccounts = await InstagramAccount.find({ isConnected: true }).lean();

            if (connectedAccounts.length === 1) {
                console.log(`[Webhook] Only 1 connected account exists (@${connectedAccounts[0].instagramUsername}). Auto-linking.`);
                igAccount = await InstagramAccount.findById(connectedAccounts[0]._id);
                igAccount.instagramPageScopedId = targetId;
                await igAccount.save();
                console.log(`[Webhook] AUTO-LINKED (single account): ${targetId} → @${igAccount.instagramUsername}`);
            } else if (connectedAccounts.length > 1) {
                // Multiple accounts — try to find one that hasn't been linked yet
                const unlinked = connectedAccounts.filter(a =>
                    !a.instagramPageScopedId || a.instagramPageScopedId === a.instagramUserId
                );
                if (unlinked.length === 1) {
                    igAccount = await InstagramAccount.findById(unlinked[0]._id);
                    igAccount.instagramPageScopedId = targetId;
                    await igAccount.save();
                    console.log(`[Webhook] AUTO-LINKED (only unlinked account): ${targetId} → @${igAccount.instagramUsername}`);
                }
            }
        }

        // Step D: Legacy User model fallback
        let botUser = null;
        if (igAccount) {
            botUser = await User.findOne({ userId: igAccount.userId }).catch(() => null);
        } else {
            botUser = await User.findOne({
                $or: [
                    { instagramWebhookId: targetId },
                    { instagramBusinessId: targetId },
                ],
            }).catch(() => null);
        }

        // Final check — give up if no account found
        const token = igAccount?.accessToken || botUser?.instagramAccessToken;
        if (!token) {
            console.error(`[Webhook] FAILED to find account for ID: ${targetId}`);
            try {
                const allAccounts = await InstagramAccount.find({}, {
                    instagramUserId: 1, instagramPageScopedId: 1, instagramUsername: 1, isConnected: 1,
                }).lean();
                console.error(`[Webhook] DB has ${allAccounts.length} accounts:`,
                    allAccounts.map(a => `@${a.instagramUsername || '?'} uid=${a.instagramUserId} psid=${a.instagramPageScopedId} conn=${a.isConnected}`).join(' | '));
            } catch { /* non-fatal */ }
            continue;
        }

        const igBusinessId = igAccount?.instagramUserId || botUser?.instagramBusinessId;
        const accountId = igAccount?._id || null;
        const automation = igAccount?.automation || botUser?.automation;
        console.log(`[Webhook] ✅ Found account @${igAccount?.instagramUsername || botUser?.instagramUsername || '?'} for ID ${targetId} (matched ${igAccount?.instagramUserId === targetId ? 'instagramUserId' : 'instagramPageScopedId'})`);

        // 1. Comments & Mentions (Feed / Live Comments)
        const changes = entry.changes || [];
        console.log(`[Webhook] Processing ${changes.length} changes, ${(entry.messaging || []).length} messaging events`);
        for (const change of changes) {
            const { field, value } = change;
            console.log(`[Webhook] Change — field=${field} item=${value.item || 'N/A'} from=${value.from?.id || value.sender_id}`);
            const fromId = value.from?.id || value.sender_id;
            if (fromId === targetId || fromId === igBusinessId) {
                console.log(`[Webhook] Skipping own event from ${fromId}`);
                continue;
            }

            if (field === 'feed' || field === 'comments' || field === 'live_comments') {
                if (value.item === 'comment' || field === 'comments' || field === 'live_comments') {
                    if (value.parent_id) continue;

                    const cid = value.comment_id || value.id;
                    console.log(`[Comment] @${value.from?.username}: ${value.text || value.message}`);
                    const autoObj = automation?.toObject?.() || automation || {};
                    await handleAutoReply(cid, fromId, 'comment', {
                        id: fromId, username: value.from?.username, text: value.text || value.message
                    }, value, token, { ...autoObj, instagramBusinessId: igBusinessId }, botUser, accountId);
                }
            }

            if (field === 'mention' || field === 'mentions') {
                const mentionMediaId = value.media_id;
                const mentionCommentId = value.comment_id;
                console.log(`[Mention] in media ${mentionMediaId}, comment ${mentionCommentId}`);

                const mentionsEnabled = automation?.mentionsEnabled ?? true;
                if (automation?.isActive && mentionsEnabled && mentionMediaId && mentionCommentId) {
                    const mentionReply = automation.mentionReplyMessage
                        || 'Thanks for the mention! 🙌';

                    const mentionResult = await replyToMention(igBusinessId, mentionMediaId, mentionCommentId, mentionReply, token);
                    const mentionStatus = mentionResult && !mentionResult.error ? 'sent' : 'failed';
                    if (mentionResult && checkTokenError(mentionResult, botUser, accountId)) {
                        // token expired — stop processing
                    }

                    await saveEvent({
                        type: 'mention',
                        accountId,
                        targetBusinessId: igBusinessId,
                        from: { id: fromId, username: value.from?.username },
                        content: { commentId: mentionCommentId, mediaId: mentionMediaId, text: value.text },
                        reply: { publicReply: mentionReply, status: mentionStatus },
                    });
                } else if (automation?.isActive && !mentionsEnabled && mentionMediaId) {
                    await saveEvent({
                        type: 'mention',
                        accountId,
                        targetBusinessId: igBusinessId,
                        from: { id: fromId, username: value.from?.username },
                        content: { commentId: mentionCommentId, mediaId: mentionMediaId, text: value.text },
                        reply: { status: 'skipped' },
                    });
                }
            }
        }

        // 2. Direct Messages & Postbacks
        // Only process entry.messaging — NOT standby (standby = handled by another app)
        const messaging = entry.messaging || [];
        for (const event of messaging) {
            const senderId = event.sender?.id || event.from?.id;
            if (senderId === targetId || senderId === igBusinessId) continue;

            // Handle DMs (including shared reels/posts)
            if (event.message) {
                const mid = event.message.mid; // Unique message ID from Meta

                // ── ATOMIC DEDUPLICATION: Block race conditions for good ──
                if (mid) {
                    try {
                        await dbConnect();
                        // findOneAndUpdate with upsert: true is atomic.
                        // If it returns a result where lastErrorObject.updatedExisting is true,
                        // it means another instance already successfully claimed this mid.
                        const dedup = await ProcessedMid.findOneAndUpdate(
                            { mid },
                            { $setOnInsert: { mid, createdAt: new Date() } },
                            { upsert: true, rawResult: true }
                        );

                        if (dedup.lastErrorObject?.updatedExisting) {
                            console.log(`[Skip] Duplicate mid detected at DB level: ${mid}`);
                            continue;
                        }
                        console.log(`[Process] Claimed unique mid: ${mid}`);
                    } catch (err) {
                        console.error('[Dedup Error]', err.message);
                        // If DB is down or error, we skip to be safe against infinite loops/retries
                        continue;
                    }
                }

                console.log(`[Incoming Message] sender=${senderId} mid=${mid}`);
                const profile = await getUser(senderId, token);
                const msgText = event.message.text;
                if (msgText) console.log(`[Message] @${profile?.username || 'user'}: ${msgText}`);

                const attachments = event.message.attachments || [];
                let replySentForThisMessage = false;

                for (const att of attachments) {
                    if (replySentForThisMessage) break;

                    // Detect shared content — Instagram sends shares in multiple formats:
                    // 1. att.payload.reel_video_id — shared reel
                    // 2. att.payload.media.id — shared post
                    // 3. att.type === "share" with att.payload.url — shared post/reel link
                    // 4. att.type === "ig_reel" — shared reel (newer format)
                    const isShareType = att.type === 'share' || att.type === 'ig_reel';
                    const hasMediaId = !!(att.payload?.reel_video_id || att.payload?.media?.id);
                    const isSharedContent = hasMediaId || isShareType;

                    const rawMediaId = att.payload?.reel_video_id || att.payload?.media?.id || att.payload?.id;
                    let mediaUrl = att.payload?.url || att.url || null;
                    let thumbnailUrl = null;
                    let permalink = null;
                    const attachmentType = att.payload?.reel_video_id ? 'reel'
                        : att.type === 'ig_reel' ? 'reel'
                        : att.payload?.media?.id ? 'post_share'
                        : att.type === 'share' ? 'post_share'
                        : (att.type || 'media');

                    if (isShareType && mediaUrl && /instagram\.com/.test(mediaUrl)) {
                        permalink = mediaUrl;
                    }

                    let reelCaption = null;
                    let reelOwnerUsername = null;
                    let reelShortcode = null;

                    if (rawMediaId) {
                        const meta = await getMedia(rawMediaId, token);
                        if (meta?.permalink) permalink = meta.permalink;
                        if (meta?.thumbnail_url) thumbnailUrl = meta.thumbnail_url;
                        if (meta?.media_url) {
                            if (!mediaUrl) mediaUrl = meta.media_url;
                            if (!thumbnailUrl) thumbnailUrl = meta.media_url;
                        }
                        if (meta?.caption) reelCaption = meta.caption;
                        if (meta?.username) reelOwnerUsername = meta.username;
                        if (meta?.shortcode) reelShortcode = meta.shortcode;
                    }

                    if (!thumbnailUrl && (permalink || mediaUrl)) {
                        const oembed = await getOEmbed(permalink || mediaUrl, token);
                        if (oembed?.thumbnail_url) thumbnailUrl = oembed.thumbnail_url;
                    }

                    const fromInfo = {
                        id: senderId,
                        username: profile?.username,
                        name: profile?.name,
                    };

                    console.log(`[Attachment] type=${att.type} isShared=${isSharedContent} rawMediaId=${rawMediaId} url=${mediaUrl?.substring(0, 60)}`);

                    // Build content object for event saving
                    const reelContentData = {
                        mediaId: rawMediaId, mediaUrl: permalink ? null : mediaUrl,
                        thumbnailUrl, permalink, attachmentType, text: msgText,
                        caption: reelCaption, reelOwnerUsername,
                    };

                    if (isSharedContent) {
                        const reelShareEnabled = automation?.reelShareEnabled ?? true;

                        if (automation?.isActive && reelShareEnabled) {
                            // ── Quota check before sending reel share DM ──────────
                            const reelQuota = await enforceDmQuota(botUser, accountId, igBusinessId);
                            if (!reelQuota.allowed) {
                                await saveEvent({
                                    type: 'reel_share', accountId, targetBusinessId: igBusinessId,
                                    from: fromInfo, content: reelContentData,
                                    reply: { status: 'quota_exceeded' },
                                    metadata: { matchType: null },
                                });
                                continue;
                            }

                            // ── Smart Reel Replies: category matching ──────────
                            const reelData = {
                                caption: reelCaption,
                                ownerUsername: reelOwnerUsername,
                                mediaId: rawMediaId,
                                shortcode: reelShortcode,
                                permalink,
                            };
                            const categoryRules = automation?.reelCategories || [];
                            const categoryMatch = matchReelToCategory(reelData, categoryRules);

                            let replyMessage, replyLinkUrl, replyButtonText;
                            let eventMetadata = {};

                            if (categoryMatch) {
                                // Priority 1: Category rule matched
                                const { rule, matchedCriteria } = categoryMatch;
                                replyMessage = rule.reply?.message || automation?.reelShareMessage || "Hey! 👋 Thanks for sharing!";
                                replyLinkUrl = rule.reply?.linkUrl || automation?.reelShareLinkUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://engagr-dm.vercel.app';
                                replyButtonText = rule.reply?.buttonText || automation?.reelShareButtonText || "Check it out 🚀";
                                eventMetadata = {
                                    categoryRuleId: rule._id?.toString(),
                                    categoryRuleName: rule.name,
                                    matchedCriteria,
                                    matchType: 'category',
                                };
                                console.log(`[SmartReel] Category "${rule.name}" matched (${matchedCriteria.join(', ')})`);
                            } else if (
                                // Priority 2: AI Product Detection (admin-gated hidden feature)
                                automation?.aiProductDetection?.enabled
                                && botUser?.flags?.aiProductDetectionUnlocked
                                && igAccount?.aiFeature?.enabled
                            ) {
                                console.log('[AI Detection] Running AI product detection pipeline...');
                                const aiResult = await runProductDetection({
                                    mediaId: rawMediaId,
                                    accessToken: token,
                                    userId: botUser.userId,
                                    accountId: accountId.toString(),
                                    senderUsername: profile?.username || senderId,
                                    aiConfig: automation.aiProductDetection,
                                    existingFrameUrl: thumbnailUrl,
                                    existingCaption: reelCaption,
                                    existingPermalink: permalink,
                                    existingOwnerUsername: reelOwnerUsername,
                                });

                                if (aiResult.success && aiResult.trackedUrl) {
                                    replyMessage = aiResult.replyMessage;
                                    replyLinkUrl = aiResult.trackedUrl;
                                    replyButtonText = aiResult.buttonLabel || "Shop Now";
                                    eventMetadata = {
                                        matchType: 'ai_detection',
                                        productName: aiResult.product?.name,
                                        productCategory: aiResult.product?.category,
                                        productBrand: aiResult.product?.brand,
                                        confidence: aiResult.product?.confidence,
                                        trackedLinkId: aiResult.trackedLinkId,
                                        detectionId: aiResult.detectionId,
                                    };
                                    console.log(`[AI Detection] Product found: "${aiResult.product?.name}" → ${aiResult.trackedUrl}`);
                                } else if (automation.aiProductDetection.fallbackToDefault !== false) {
                                    // AI detection found nothing or failed — fall through to default/legacy
                                    console.log(`[AI Detection] No product found (${aiResult.error}) — falling back`);
                                    if (automation?.reelShareDefaultReply?.enabled !== false && automation?.reelShareDefaultReply?.message) {
                                        const def = automation.reelShareDefaultReply;
                                        replyMessage = def.message;
                                        replyLinkUrl = def.linkUrl || automation?.reelShareLinkUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://engagr-dm.vercel.app';
                                        replyButtonText = def.buttonText || automation?.reelShareButtonText || "Check it out 🚀";
                                        eventMetadata = { matchType: 'default' };
                                    } else {
                                        replyMessage = automation?.reelShareMessage || "Hey! 👋 Thanks for sharing!";
                                        replyLinkUrl = automation?.reelShareLinkUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://engagr-dm.vercel.app';
                                        replyButtonText = automation?.reelShareButtonText || "Check it out 🚀";
                                        eventMetadata = { matchType: 'legacy' };
                                    }
                                } else {
                                    // fallbackToDefault disabled and AI found nothing — skip reply
                                    await saveEvent({
                                        type: 'reel_share', accountId, targetBusinessId: igBusinessId,
                                        from: fromInfo, content: reelContentData,
                                        reply: { status: 'skipped' },
                                        metadata: { matchType: 'ai_detection', detectionId: aiResult.detectionId, error: aiResult.error },
                                    });
                                    continue;
                                }
                            } else if (automation?.reelShareDefaultReply?.enabled !== false && automation?.reelShareDefaultReply?.message) {
                                // Priority 3: Default reply configured
                                const def = automation.reelShareDefaultReply;
                                replyMessage = def.message;
                                replyLinkUrl = def.linkUrl || automation?.reelShareLinkUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://engagr-dm.vercel.app';
                                replyButtonText = def.buttonText || automation?.reelShareButtonText || "Check it out 🚀";
                                eventMetadata = { matchType: 'default' };
                                console.log('[SmartReel] No category matched — using default reply');
                            } else {
                                // Priority 4: Legacy fallback
                                replyMessage = automation?.reelShareMessage || "Hey! 👋 Thanks for sharing!";
                                replyLinkUrl = automation?.reelShareLinkUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://engagr-dm.vercel.app';
                                replyButtonText = automation?.reelShareButtonText || "Check it out 🚀";
                                eventMetadata = { matchType: 'legacy' };
                            }

                            const firstName = profile?.name?.split(' ')[0] || 'there';
                            const customMessage = replyMessage.replace('{name}', firstName);
                            replyLinkUrl = normalizeUrl(replyLinkUrl) || replyLinkUrl;
                            const replyText = `${customMessage}\n\n🔗 ${replyLinkUrl}`;
                            let templateSent = false;

                            // Generic template (image card) — works on Instagram when thumbnail available
                            if (thumbnailUrl) {
                                try {
                                    await sendGenericTemplate(senderId, [{
                                        title: customMessage,
                                        image_url: thumbnailUrl,
                                        subtitle: 'Check out more content and updates.',
                                        buttons: [{ type: 'web_url', url: replyLinkUrl, title: replyButtonText }]
                                    }], token);
                                    console.log(`[Generic Sent] -> ${senderId}`);
                                    templateSent = true;
                                    replySentForThisMessage = true;
                                } catch (e) { console.error('[Template Fail]', e.message); }
                            }

                            // Quick reply fallback (no image needed)
                            if (!templateSent) {
                                try {
                                    await sendQuickReply(senderId, replyText, [
                                        { content_type: 'text', title: replyButtonText, payload: 'VISIT_SITE' },
                                        { content_type: 'text', title: 'Thanks! 👍', payload: 'THANKS' }
                                    ], token);
                                    console.log(`[QuickReply Sent] -> ${senderId}`);
                                    templateSent = true;
                                    replySentForThisMessage = true;
                                } catch {
                                    try {
                                        await sendDM(senderId, replyText, token);
                                        replySentForThisMessage = true;
                                    } catch (e) { console.error('[DM Fallback Fail]', e.message); }
                                }
                            }

                            if (replySentForThisMessage) {
                                await trackDmUsage(botUser, reelQuota.source);
                                // Update per-rule stats if category matched
                                if (categoryMatch?.rule?._id) {
                                    try {
                                        await InstagramAccount.updateOne(
                                            { _id: accountId, "automation.reelCategories._id": categoryMatch.rule._id },
                                            {
                                                $inc: {
                                                    "automation.reelCategories.$.stats.totalMatches": 1,
                                                    "automation.reelCategories.$.stats.totalRepliesSent": 1,
                                                },
                                                $set: { "automation.reelCategories.$.stats.lastMatchedAt": new Date() },
                                            }
                                        );
                                    } catch (e) { console.error('[SmartReel] Stats update failed:', e.message); }
                                }
                            }
                            await saveEvent({
                                type: 'reel_share', accountId, targetBusinessId: igBusinessId,
                                from: fromInfo, content: reelContentData,
                                reply: { privateDM: replyText, status: replySentForThisMessage ? 'sent' : 'failed' },
                                metadata: eventMetadata,
                            });
                        } else {
                            // Reel share disabled — log but skip reply
                            await saveEvent({
                                type: 'reel_share', accountId, targetBusinessId: igBusinessId,
                                from: fromInfo, content: reelContentData,
                                reply: { status: 'skipped' },
                            });
                        }

                    } else if (att.type === 'image' || att.type === 'video' || att.type === 'audio') {
                        // Direct image/video/audio — save without auto-reply
                        await saveEvent({
                            type: 'dm',
                            accountId,
                            targetBusinessId: igBusinessId,
                            from: fromInfo,
                            content: { mediaUrl, thumbnailUrl: thumbnailUrl || mediaUrl, attachmentType, text: msgText },
                            reply: { status: 'skipped' },
                        });
                    }
                }

                // Save plain text DMs (no attachments)
                if (msgText && !attachments.length) {
                    // [SMART FEATURES] Smart Reply Pipeline — uncomment when smart features are enabled
                    // let smartReplyHandled = false;
                    // if (botUser?.flags?.smartRepliesEnabled && igAccount?.smartFeatures?.smartRepliesActive
                    //     && (igAccount?.automation?.smartReplyConfig?.enabled || igAccount?.automation?.smartReplyConfig?.autoReplyToAllDMs)) {
                    //     try {
                    //         const smartResult = await runSmartReplyPipeline({
                    //             senderId, senderUsername: profile?.username || senderId, messageText: msgText, token,
                    //             botUser, igAccount, accountId, igBusinessId, sendDM, sendGenericTemplate, saveEvent, trackDmUsage, enforceDmQuota,
                    //         });
                    //         smartReplyHandled = smartResult.handled;
                    //     } catch (e) { console.error('[SmartReply] Pipeline error:', e.message); }
                    // }
                    // if (!smartReplyHandled) {
                    // [/SMART FEATURES]
                    await saveEvent({
                        type: 'dm',
                        accountId,
                        targetBusinessId: igBusinessId,
                        from: { id: senderId, username: profile?.username, name: profile?.name },
                        content: { text: msgText },
                        reply: { status: 'skipped' },
                    });
                    // [SMART FEATURES] }
                }
            }

            // Handle Postbacks (Button clicks)
            if (event.postback) {
                const payload = event.postback.payload;
                const title = event.postback.title;
                console.log(`[Postback] From ${senderId}: ${title} (${payload})`);

                const pbProfile = await getUser(senderId, token);
                const pbAutomation = automation;
                const igUsername = igAccount?.instagramUsername || botUser?.instagramUsername || '';

                // ── "Yes" confirmation postback — user wants the content ─────
                if (payload?.startsWith('CONFIRM_INTEREST:')) {
                    const commenterIUI = payload.slice('CONFIRM_INTEREST:'.length);

                    if (pbAutomation?.requireFollow) {
                        const isFollower = await checkIsFollower(commenterIUI, token);

                        if (isFollower) {
                            // ── Quota check before delivering content ─────────
                            const pbQuota = await enforceDmQuota(botUser, accountId, igBusinessId);
                            if (!pbQuota.allowed) {
                                await saveEvent({
                                    type: 'postback',
                                    accountId,
                                    targetBusinessId: igBusinessId,
                                    from: { id: senderId, username: pbProfile?.username, name: pbProfile?.name },
                                    content: { text: title },
                                    reply: { status: 'quota_exceeded' },
                                });
                                continue;
                            }
                            await deliverContent(senderId, token, pbAutomation, igUsername);
                            await trackDmUsage(botUser, pbQuota.source);
                            console.log(`[Confirm ✅] @${pbProfile?.username || senderId} is a follower — delivered content`);
                            await saveEvent({
                                type: 'postback',
                                accountId,
                                targetBusinessId: igBusinessId,
                                from: { id: senderId, username: pbProfile?.username, name: pbProfile?.name },
                                content: { text: title },
                                reply: { privateDM: pbAutomation.deliveryMessage || pbAutomation.dmContent, status: 'sent' },
                            });
                        } else {
                            const followPromptText = pbAutomation.followPromptDM
                                || `Hey! It seems you're not following me yet\nWould love it if you could check out my profile and hit follow 😊`;
                            const followButtonTitle = pbAutomation.followButtonText || "I'm following ✅";

                            try {
                                const url = new URL(`${IG_BASE}/me/messages`);
                                url.searchParams.set('access_token', token);
                                await fetch(url.toString(), {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        recipient: { id: senderId },
                                        message: {
                                            attachment: {
                                                type: 'template',
                                                payload: {
                                                    template_type: 'button',
                                                    text: followPromptText,
                                                    buttons: [
                                                        {
                                                            type: 'web_url',
                                                            url: `https://instagram.com/${igUsername}`,
                                                            title: 'Visit Profile'
                                                        },
                                                        {
                                                            type: 'postback',
                                                            title: followButtonTitle,
                                                            payload: `CHECK_FOLLOW:${commenterIUI}`
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    })
                                });
                            } catch (e) {
                                console.error('[FollowGate Prompt Error]', e.message);
                            }

                            console.log(`[FollowGate] @${pbProfile?.username || senderId} not following — sent follow prompt`);
                            await saveEvent({
                                type: 'postback',
                                accountId,
                                targetBusinessId: igBusinessId,
                                from: { id: senderId, username: pbProfile?.username, name: pbProfile?.name },
                                content: { text: title },
                                reply: { privateDM: followPromptText, status: 'skipped' },
                            });
                        }
                    } else {
                        // ── Quota check before delivering content ─────────
                        const pbQuota2 = await enforceDmQuota(botUser, accountId, igBusinessId);
                        if (!pbQuota2.allowed) {
                            await saveEvent({
                                type: 'postback',
                                accountId,
                                targetBusinessId: igBusinessId,
                                from: { id: senderId, username: pbProfile?.username, name: pbProfile?.name },
                                content: { text: title },
                                reply: { status: 'quota_exceeded' },
                            });
                            continue;
                        }
                        await deliverContent(senderId, token, pbAutomation, igUsername);
                        await trackDmUsage(botUser, pbQuota2.source);
                        console.log(`[Confirm ✅] @${pbProfile?.username || senderId} — delivered content (no follow gate)`);
                        await saveEvent({
                            type: 'postback',
                            accountId,
                            targetBusinessId: igBusinessId,
                            from: { id: senderId, username: pbProfile?.username, name: pbProfile?.name },
                            content: { text: title },
                            reply: { privateDM: pbAutomation?.deliveryMessage || pbAutomation?.dmContent, status: 'sent' },
                        });
                    }
                    continue;
                }

                // ── Follow-gate confirmation postback ─────────────────────────
                if (payload?.startsWith('CHECK_FOLLOW:')) {
                    const commenterIUI = payload.slice('CHECK_FOLLOW:'.length);
                    const isFollower = await checkIsFollower(commenterIUI, token);

                    if (isFollower && pbAutomation?.isActive) {
                        // ── Quota check before delivering content ─────────
                        const fgQuota = await enforceDmQuota(botUser, accountId, igBusinessId);
                        if (!fgQuota.allowed) {
                            await saveEvent({
                                type: 'postback',
                                accountId,
                                targetBusinessId: igBusinessId,
                                from: { id: senderId, username: pbProfile?.username, name: pbProfile?.name },
                                content: { text: title },
                                reply: { status: 'quota_exceeded' },
                            });
                            continue;
                        }
                        await deliverContent(senderId, token, pbAutomation, igUsername);
                        await trackDmUsage(botUser, fgQuota.source);

                        console.log(`[FollowGate ✅] @${pbProfile?.username || senderId} confirmed follow — content delivered`);
                        await saveEvent({
                            type: 'postback',
                            accountId,
                            targetBusinessId: igBusinessId,
                            from: { id: senderId, username: pbProfile?.username, name: pbProfile?.name },
                            content: { text: title },
                            reply: { privateDM: pbAutomation?.deliveryMessage || pbAutomation?.dmContent, status: 'sent' },
                        });
                    } else {
                        const notYetText = `Hmm, I can't see your follow yet 🤔\n\nPlease make sure you've followed @${igUsername} and try again!`;
                        const followButtonTitle = pbAutomation?.followButtonText || "I'm following ✅";

                        try {
                            const url = new URL(`${IG_BASE}/me/messages`);
                            url.searchParams.set('access_token', token);
                            await fetch(url.toString(), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    recipient: { id: senderId },
                                    message: {
                                        attachment: {
                                            type: 'template',
                                            payload: {
                                                template_type: 'button',
                                                text: notYetText,
                                                buttons: [
                                                    {
                                                        type: 'web_url',
                                                        url: `https://instagram.com/${igUsername}`,
                                                        title: 'Visit Profile'
                                                    },
                                                    {
                                                        type: 'postback',
                                                        title: followButtonTitle,
                                                        payload: `CHECK_FOLLOW:${commenterIUI}`
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                })
                            });
                        } catch (e) {
                            console.error('[FollowGate Retry Error]', e.message);
                        }

                        console.log(`[FollowGate ❌] @${pbProfile?.username || senderId} not yet following — re-sent buttons`);
                        await saveEvent({
                            type: 'postback',
                            accountId,
                            targetBusinessId: igBusinessId,
                            from: { id: senderId, username: pbProfile?.username, name: pbProfile?.name },
                            content: { text: title },
                            reply: { privateDM: notYetText, status: 'skipped' },
                        });
                    }
                    continue;
                }

                // ── Generic postback fallback ─────────────────────────────────
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://engagr-dm.vercel.app';
                let replyText = 'Thanks for your choice! 🌟';
                if (payload === 'VISIT_SITE') {
                    replyText = `Here's the link you requested: ${appUrl} 🚀`;
                } else if (payload === 'CONTACT_SUPPORT_PAYLOAD') {
                    replyText = "Our support team has been notified. 💬 We'll get back to you shortly!";
                }

                const dmResult = await sendDM(senderId, replyText, token);
                checkTokenError(dmResult, botUser, accountId);

                await saveEvent({
                    type: 'postback',
                    accountId,
                    targetBusinessId: igBusinessId,
                    from: { id: senderId, username: pbProfile?.username, name: pbProfile?.name },
                    content: { text: title, url: payload },
                    reply: { privateDM: replyText, status: 'sent' },
                });
            }
        }
    }

    return new NextResponse('OK', { status: 200 });
}
