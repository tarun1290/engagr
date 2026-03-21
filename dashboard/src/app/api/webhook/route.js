import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Event from '@/models/Event';
import ProcessedMid from '@/models/ProcessedMid';

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
        url.searchParams.set('fields', 'id,media_type,permalink,media_url,thumbnail_url,shortcode,timestamp,username');
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
async function deliverContent(recipientId, token, automation, igUsername) {
    const deliveryText = automation.deliveryMessage
        || `Thank you for your support! 🙌🙏\n\nHere you go. Click the button below to get your content :)`;
    const linkUrl = automation.linkUrl;
    const buttonLabel = automation.deliveryButtonText || automation.buttonText || 'View Content';

    if (linkUrl) {
        // Send template with button link
        try {
            await sendGenericTemplate(recipientId, [{
                title: buttonLabel,
                subtitle: deliveryText,
                buttons: [{
                    type: 'web_url',
                    url: linkUrl,
                    title: buttonLabel
                }]
            }], token);
        } catch (e) {
            console.error('[Delivery Template Error]', e.message);
            // Fallback: send as plain text
            await sendDM(recipientId, `${deliveryText}\n\n🔗 ${linkUrl}`, token);
        }
    } else {
        // No link — send plain text delivery message
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

// Attempt to refresh an expired/expiring token at runtime.
// If refresh succeeds, updates the DB and returns the new token.
// If refresh fails, marks user as disconnected.
async function handleTokenExpiry(userId, currentToken) {
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
                    await User.findOneAndUpdate(
                        { userId },
                        {
                            instagramAccessToken: refreshData.access_token,
                            tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
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
function checkTokenError(data, botUser) {
    if (data?.error?.code === 190) {
        handleTokenExpiry(botUser.userId, botUser.instagramAccessToken);
        return true;
    }
    return false;
}

async function handleAutoReply(commentId, senderId, type, fromInfo, rawPayload, token, automation, botUser) {
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

    const igUsername = botUser.instagramUsername || '';
    const publicReply = automation.replyMessages?.[0] || 'Check your DM! 📩';

    // ── Step 1: Public reply to the comment ──────────────────────────────────
    if (automation.replyEnabled) {
        try { await replyToComment(commentId, publicReply, token, mediaId); } catch (e) { console.error('[Public Fail]', e.message); }
    }

    // ── Step 2: Send initial DM — greeting with "Yes" confirmation button ────
    // This opens the DM thread via comment_id (required for first contact)
    const greetingText = automation.dmContent || 'Hey there! Thanks for your interest 😊';
    const confirmButtonText = automation.buttonText || 'Yes';

    const firstContact = await sendPrivateReply(commentId, greetingText, token);
    const igScopedId = firstContact?.recipient_id;

    if (!firstContact || firstContact.error) {
        const status = checkTokenError(firstContact, botUser) ? 'token_expired' : 'failed';
        console.error('[AutoReply] ❌ Failed to send initial DM');
        await saveEvent({
            type,
            targetBusinessId: automation.instagramBusinessId,
            from: { id: fromInfo?.id, username: fromInfo?.username, name: fromInfo?.name },
            content: { commentId, text: fromInfo?.text, mediaId },
            reply: { publicReply, privateDM: greetingText, status },
        });
        return;
    }

    // Send the "Yes" confirmation button via postback
    // Payload encodes: senderId (for follow check) and commentId (for reference)
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
                                text: greetingText,
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
    await saveEvent({
        type,
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
        const targetId = entry.id;

        try { await dbConnect(); } catch (e) {
            console.error('[DB Error]', e.message);
            continue;
        }

        const botUser = await User.findOne({
            $or: [
                { instagramWebhookId: targetId },
                { instagramBusinessId: targetId }
            ]
        }).catch(() => null);

        if (!botUser?.instagramAccessToken) {
            console.log(`[Webhook] No active account for ID: ${targetId}`);
            continue;
        }

        const token = botUser.instagramAccessToken;
        const igBusinessId = botUser.instagramBusinessId;
        console.log(`[Webhook] ✅ Found user for ID ${targetId} — automation.isActive=${botUser.automation?.isActive}`);

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
                    // Skip sub-replies (replies to comments) — only handle top-level comments
                    // parent_id is set when this is a reply to an existing comment
                    if (value.parent_id) continue;

                    const cid = value.comment_id || value.id;
                    console.log(`[Comment] @${value.from?.username}: ${value.text || value.message}`);
                    await handleAutoReply(cid, fromId, 'comment', {
                        id: fromId, username: value.from?.username, text: value.text || value.message
                    }, value, token, { ...(botUser.automation?.toObject?.() || botUser.automation || {}), instagramBusinessId: igBusinessId }, botUser);
                }
            }

            // Mentions: user tagged the business in a comment on another post
            // Must use POST /{ig-user-id}/mentions (NOT comment replies endpoint)
            if (field === 'mention' || field === 'mentions') {
                const mentionMediaId = value.media_id;
                const mentionCommentId = value.comment_id;
                console.log(`[Mention] in media ${mentionMediaId}, comment ${mentionCommentId}`);

                if (botUser.automation?.isActive && mentionMediaId && mentionCommentId) {
                    const mentionReply = botUser.automation.replyMessages?.length > 0
                        ? botUser.automation.replyMessages[Math.floor(Math.random() * botUser.automation.replyMessages.length)]
                        : 'Thanks for the mention! 🙌';

                    const mentionResult = await replyToMention(igBusinessId, mentionMediaId, mentionCommentId, mentionReply, token);
                    const mentionStatus = mentionResult && !mentionResult.error ? 'sent' : 'failed';
                    if (mentionResult && checkTokenError(mentionResult, botUser)) {
                        // token expired — stop processing
                    }

                    await saveEvent({
                        type: 'mention',
                        targetBusinessId: igBusinessId,
                        from: { id: fromId, username: value.from?.username },
                        content: { commentId: mentionCommentId, mediaId: mentionMediaId, text: value.text },
                        reply: { publicReply: mentionReply, status: mentionStatus },
                    });
                }
            }
        }

        // 2. Direct Messages & Postbacks
        // Only process entry.messaging — NOT standby (standby = handled by another app)
        const messaging = entry.messaging || [];
        for (const event of messaging) {
            const senderId = event.sender?.id || event.from?.id;
            if (senderId === targetId || senderId === botUser.instagramBusinessId) continue;

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

                    // If the share URL looks like an Instagram permalink, use it as permalink
                    if (isShareType && mediaUrl && /instagram\.com/.test(mediaUrl)) {
                        permalink = mediaUrl;
                    }

                    // Fetch rich metadata for shared posts/reels
                    if (rawMediaId) {
                        const meta = await getMedia(rawMediaId, token);
                        if (meta?.permalink) permalink = meta.permalink;
                        if (meta?.thumbnail_url) thumbnailUrl = meta.thumbnail_url;
                        if (meta?.media_url) {
                            if (!mediaUrl) mediaUrl = meta.media_url;
                            if (!thumbnailUrl) thumbnailUrl = meta.media_url;
                        }
                    }

                    // oEmbed fallback for thumbnail
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

                    if (isSharedContent) {
                        // Shared reel/post — send auto-reply
                        console.log('[Shared] Post/Reel detected — sending reply');
                        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://engagr-dm.vercel.app';
                        const firstName = profile?.name?.split(' ')[0] || 'there';
                        const replyText = `Hi ${firstName}! 👋 Thanks for sharing! 🎉\n\n🔗 ${appUrl}`;
                        let templateSent = false;

                        // Generic template (image card) — works on Instagram when thumbnail available
                        if (thumbnailUrl) {
                            try {
                                await sendGenericTemplate(senderId, [{
                                    title: `Hi ${firstName}! 👋 Thanks for sharing!`,
                                    image_url: thumbnailUrl,
                                    subtitle: 'Check out more content and updates.',
                                    buttons: [{ type: 'web_url', url: appUrl, title: 'Visit Us 🚀' }]
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
                                    { content_type: 'text', title: 'Visit Us 🚀', payload: 'VISIT_SITE' },
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

                        await saveEvent({
                            type: 'reel_share',
                            targetBusinessId: botUser.instagramBusinessId,
                            from: fromInfo,
                            content: { mediaId: rawMediaId, mediaUrl: permalink ? null : mediaUrl, thumbnailUrl, permalink, attachmentType, text: msgText },
                            reply: { privateDM: replyText, status: replySentForThisMessage ? 'sent' : 'failed' },
                        });

                    } else if (att.type === 'image' || att.type === 'video' || att.type === 'audio') {
                        // Direct image/video/audio — save without auto-reply
                        await saveEvent({
                            type: 'dm',
                            targetBusinessId: botUser.instagramBusinessId,
                            from: fromInfo,
                            content: { mediaUrl, thumbnailUrl: thumbnailUrl || mediaUrl, attachmentType, text: msgText },
                            reply: { status: 'skipped' },
                        });
                    }
                }

                // Save plain text DMs (no attachments)
                if (msgText && !attachments.length) {
                    await saveEvent({
                        type: 'dm',
                        targetBusinessId: botUser.instagramBusinessId,
                        from: { id: senderId, username: profile?.username, name: profile?.name },
                        content: { text: msgText },
                        reply: { status: 'skipped' },
                    });
                }
            }

            // Handle Postbacks (Button clicks)
            if (event.postback) {
                const payload = event.postback.payload;
                const title = event.postback.title;
                console.log(`[Postback] From ${senderId}: ${title} (${payload})`);

                const pbProfile = await getUser(senderId, token);
                const automation = botUser.automation;
                const igUsername = botUser.instagramUsername || '';

                // ── "Yes" confirmation postback — user wants the content ─────
                if (payload?.startsWith('CONFIRM_INTEREST:')) {
                    const commenterIUI = payload.slice('CONFIRM_INTEREST:'.length);

                    // Check if follow gate is enabled
                    if (automation?.requireFollow) {
                        const isFollower = await checkIsFollower(commenterIUI, token);

                        if (isFollower) {
                            // Already following → deliver content directly
                            await deliverContent(senderId, token, automation, igUsername);
                            console.log(`[Confirm ✅] @${pbProfile?.username || senderId} is a follower — delivered content`);
                            await saveEvent({
                                type: 'postback',
                                targetBusinessId: igBusinessId,
                                from: { id: senderId, username: pbProfile?.username, name: pbProfile?.name },
                                content: { text: title },
                                reply: { privateDM: automation.deliveryMessage || automation.dmContent, status: 'sent' },
                            });
                        } else {
                            // Not following → send follow prompt with 2 buttons
                            const followPromptText = automation.followPromptDM
                                || `Hey! It seems you're not following me yet\nWould love it if you could check out my profile and hit follow 😊`;
                            const followButtonTitle = automation.followButtonText || "I'm following ✅";

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
                                targetBusinessId: igBusinessId,
                                from: { id: senderId, username: pbProfile?.username, name: pbProfile?.name },
                                content: { text: title },
                                reply: { privateDM: followPromptText, status: 'skipped' },
                            });
                        }
                    } else {
                        // No follow gate → deliver content immediately
                        await deliverContent(senderId, token, automation, igUsername);
                        console.log(`[Confirm ✅] @${pbProfile?.username || senderId} — delivered content (no follow gate)`);
                        await saveEvent({
                            type: 'postback',
                            targetBusinessId: igBusinessId,
                            from: { id: senderId, username: pbProfile?.username, name: pbProfile?.name },
                            content: { text: title },
                            reply: { privateDM: automation.deliveryMessage || automation.dmContent, status: 'sent' },
                        });
                    }
                    continue;
                }

                // ── Follow-gate confirmation postback ─────────────────────────
                if (payload?.startsWith('CHECK_FOLLOW:')) {
                    const commenterIUI = payload.slice('CHECK_FOLLOW:'.length);
                    const isFollower = await checkIsFollower(commenterIUI, token);

                    if (isFollower && automation?.isActive) {
                        // ✅ Confirmed follower — deliver the content
                        await deliverContent(senderId, token, automation, igUsername);

                        console.log(`[FollowGate ✅] @${pbProfile?.username || senderId} confirmed follow — content delivered`);
                        await saveEvent({
                            type: 'postback',
                            targetBusinessId: igBusinessId,
                            from: { id: senderId, username: pbProfile?.username, name: pbProfile?.name },
                            content: { text: title },
                            reply: { privateDM: automation.deliveryMessage || automation.dmContent, status: 'sent' },
                        });
                    } else {
                        // ❌ Not following yet — explain and resend the buttons
                        const notYetText = `Hmm, I can't see your follow yet 🤔\n\nPlease make sure you've followed @${igUsername} and try again!`;
                        const followButtonTitle = automation?.followButtonText || "I'm following ✅";

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
                checkTokenError(dmResult, botUser);

                await saveEvent({
                    type: 'postback',
                    targetBusinessId: botUser.instagramBusinessId,
                    from: { id: senderId, username: pbProfile?.username, name: pbProfile?.name },
                    content: { text: title, url: payload },
                    reply: { privateDM: replyText, status: 'sent' },
                });
            }
        }
    }

    return new NextResponse('OK', { status: 200 });
}
