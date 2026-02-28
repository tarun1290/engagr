import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Event from '@/models/Event';

const BASE_URL = 'https://graph.facebook.com/v21.0';
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// ─── Graph API Helpers (native fetch, no axios needed) ───────────────────────

async function getMedia(id, token) {
    if (!id) return null;
    try {
        const url = new URL(`${BASE_URL}/${id}`);
        url.searchParams.set('fields', 'id,media_type,permalink,media_url,thumbnail_url,shortcode,timestamp,username');
        url.searchParams.set('access_token', token);
        const res = await fetch(url.toString());
        return res.ok ? res.json() : null;
    } catch { return null; }
}

async function getOEmbed(mediaUrl, token) {
    if (!mediaUrl) return null;
    try {
        const url = new URL(`${BASE_URL}/instagram_oembed`);
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
        const url = new URL(`${BASE_URL}/${id}`);
        url.searchParams.set('fields', 'name,username');
        url.searchParams.set('access_token', token);
        const res = await fetch(url.toString());
        return res.ok ? res.json() : null;
    } catch { return null; }
}

async function sendDM(recipientId, text, token) {
    if (!recipientId || !text) return;
    try {
        const url = new URL(`${BASE_URL}/me/messages`);
        url.searchParams.set('access_token', token);
        await fetch(url.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient: { id: recipientId }, message: { text } })
        });
        console.log(`[DM Sent] -> ${recipientId}`);
    } catch (e) { console.error('[DM Error]', e.message); }
}

async function sendButtonMessage(recipientId, text, buttons, token) {
    const url = new URL(`${BASE_URL}/me/messages`);
    url.searchParams.set('access_token', token);
    const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            recipient: { id: recipientId },
            message: {
                attachment: {
                    type: 'template',
                    payload: { template_type: 'button', text, buttons }
                }
            }
        })
    });
    if (!res.ok) throw new Error(`Button message failed: ${res.status}`);
    return res.json();
}

async function sendGenericTemplate(recipientId, elements, token) {
    const url = new URL(`${BASE_URL}/me/messages`);
    url.searchParams.set('access_token', token);
    const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            recipient: { id: recipientId },
            message: {
                attachment: {
                    type: 'template',
                    payload: { template_type: 'generic', elements }
                }
            }
        })
    });
    if (!res.ok) throw new Error(`Generic template failed: ${res.status}`);
    return res.json();
}

async function replyToComment(commentId, text, token) {
    const url = new URL(`${BASE_URL}/${commentId}/replies`);
    url.searchParams.set('message', text);
    url.searchParams.set('access_token', token);
    const res = await fetch(url.toString(), { method: 'POST' });
    if (!res.ok) throw new Error(`Reply failed: ${res.status}`);
    return res.json();
}

async function sendPrivateReply(commentId, text, token) {
    try {
        const url = new URL(`${BASE_URL}/${commentId}/private_replies`);
        url.searchParams.set('message', text);
        url.searchParams.set('access_token', token);
        const res = await fetch(url.toString(), { method: 'POST' });
        return res.ok ? res.json() : null;
    } catch { return null; }
}

async function saveEvent(data) {
    try {
        await dbConnect();
        return await Event.create(data);
    } catch (err) {
        console.error('[DB] Failed to save event:', err.message);
    }
}

async function handleAutoReply(commentId, senderId, type, fromInfo, rawPayload, token, automation) {
    if (!commentId) return;

    // Dedup check
    try {
        await dbConnect();
        const existing = await Event.findOne({ 'content.commentId': commentId, 'reply.status': 'sent' });
        if (existing) {
            console.log(`[Skip] Already replied to: ${commentId}`);
            return;
        }
    } catch {}

    if (!automation?.isActive) return;

    const mediaId = rawPayload.media_id || rawPayload.post_id;
    if (automation.postTrigger === 'specific' && automation.selectedPostId && mediaId !== automation.selectedPostId) return;

    const commentText = (fromInfo?.text || '').toLowerCase();
    if (automation.commentTrigger === 'specific' && automation.keywords?.length > 0) {
        const hasKeyword = automation.keywords.some(k => commentText.includes(k.toLowerCase()));
        if (!hasKeyword) return;
    }

    let replyStatus = 'skipped';
    const publicReply = automation.replyMessages?.length > 0
        ? automation.replyMessages[Math.floor(Math.random() * automation.replyMessages.length)]
        : 'Check your DM! 📩';
    const privateDM = automation.dmContent || 'Hi there! 👋 Thanks for reaching out.';

    try {
        if (automation.replyEnabled) {
            try { await replyToComment(commentId, publicReply, token); } catch (e) { console.error('[Public Fail]', e.message); }
        }

        if (automation.buttonText && automation.linkUrl) {
            const buttons = [{ type: 'web_url', url: automation.linkUrl, title: automation.buttonText }];
            try {
                await sendButtonMessage(senderId, privateDM, buttons, token);
                replyStatus = 'sent';
            } catch {
                await sendDM(senderId, `${privateDM}\n\n${automation.linkUrl}`, token);
                replyStatus = 'fallback';
            }
        } else {
            const dm = await sendPrivateReply(commentId, privateDM, token);
            if (!dm) {
                await sendDM(senderId, privateDM, token);
                replyStatus = 'fallback';
            } else {
                replyStatus = 'sent';
            }
        }
    } catch (err) {
        console.error('[AutoReply Error]', err.message);
        replyStatus = 'failed';
    }

    await saveEvent({
        type,
        from: { id: fromInfo?.id, username: fromInfo?.username },
        content: { commentId, text: fromInfo?.text, mediaId },
        reply: { publicReply, privateDM, status: replyStatus },
        raw: rawPayload
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
    let body;
    try {
        body = await request.json();
    } catch {
        return new NextResponse('Bad Request', { status: 400 });
    }

    if (body.object !== 'instagram') {
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
            $or: [{ instagramBusinessId: targetId }, { pageId: targetId }]
        }).catch(() => null);

        if (!botUser?.instagramAccessToken) {
            console.log(`[Webhook] No active account for ID: ${targetId}`);
            continue;
        }

        const token = botUser.instagramAccessToken;

        // 1. Comments & Mentions (Feed)
        const changes = entry.changes || [];
        for (const change of changes) {
            const { field, value } = change;
            const fromId = value.from?.id || value.sender_id;
            if (fromId === targetId || fromId === botUser.instagramBusinessId) continue;

            if (field === 'feed' || field === 'comments') {
                if (value.item === 'comment' || field === 'comments') {
                    const cid = value.comment_id || value.id;
                    console.log(`[Comment] @${value.from?.username}: ${value.message || value.text}`);
                    await handleAutoReply(cid, fromId, 'comment', {
                        id: fromId, username: value.from?.username, text: value.message || value.text
                    }, value, token, { ...botUser.automation, instagramBusinessId: botUser.instagramBusinessId });
                }
            }

            if (field === 'mention' || field === 'mentions') {
                const cid = value.comment_id || value.id;
                await handleAutoReply(cid, fromId, 'mention', {
                    id: fromId, username: value.from?.username, text: value.text
                }, value, token, { ...botUser.automation, instagramBusinessId: botUser.instagramBusinessId });
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

                // ── Deduplication: skip if we've already processed this message ──
                if (mid) {
                    try {
                        const already = await Event.findOne({ 'raw.message.mid': mid });
                        if (already) {
                            console.log(`[Skip] Duplicate message id=${mid}`);
                            continue;
                        }
                    } catch {}
                }

                console.log(`[Incoming Message] sender=${senderId} mid=${mid}`);
                const profile = await getUser(senderId, token);
                const msgText = event.message.text;
                if (msgText) console.log(`[Message] @${profile?.username || 'user'}: ${msgText}`);

                const attachments = event.message.attachments || [];
                for (const att of attachments) {
                    const mediaId = att.payload?.reel_video_id || att.payload?.media?.id || att.payload?.id;
                    let url = att.payload?.url || att.url;
                    let thumbnailUrl = null;

                    // Try Graph API for media metadata
                    if (mediaId) {
                        const meta = await getMedia(mediaId, token);
                        if (meta?.permalink) url = meta.permalink;
                        if (meta?.thumbnail_url || meta?.media_url) thumbnailUrl = meta.thumbnail_url || meta.media_url;
                    }

                    // Try oEmbed for public media
                    if (!thumbnailUrl && url) {
                        const oembed = await getOEmbed(url, token);
                        if (oembed?.thumbnail_url) thumbnailUrl = oembed.thumbnail_url;
                    }

                    if (url || mediaId) {
                        console.log('[Shared] Post/Reel detected — redirecting to dashboard');
                        const dashboardUrl = 'https://doteyelabs.com/dashboard';
                        const firstName = profile?.name?.split(' ')[0] || 'there';
                        const greeting = `Hi ${firstName}! 👋`;
                        const text = `${greeting} Thanks for sharing! 🎉 Visit our dashboard to see more content and updates.`;
                        const buttons = [{ type: 'web_url', url: dashboardUrl, title: 'Open Dashboard 🚀' }];
                        let sent = false;

                        if (thumbnailUrl) {
                            try {
                                await sendGenericTemplate(senderId, [{
                                    title: `${greeting} Thanks for sharing! 🎉`,
                                    image_url: thumbnailUrl,
                                    subtitle: 'Visit our dashboard to see all posts and updates.',
                                    buttons
                                }], token);
                                console.log(`[Generic Sent] -> ${senderId}`);
                                sent = true;
                            } catch (e) { console.error('[Template Fail]', e.message); }
                        }

                        if (!sent) {
                            try {
                                await sendButtonMessage(senderId, text, buttons, token);
                                console.log(`[Button Sent] -> ${senderId}`);
                                sent = true;
                            } catch {
                                await sendDM(senderId, `${text}\n\n${dashboardUrl}`, token);
                            }
                        }

                        await saveEvent({
                            type: 'reel_share',
                            from: { id: senderId, username: profile?.username, name: profile?.name },
                            content: { mediaId, thumbnailUrl },
                            reply: { privateDM: text, status: sent ? 'sent' : 'fallback', url: dashboardUrl },
                            raw: event  // raw.message.mid is used for dedup on next call
                        });
                    }
                }
            }

            // Handle Postbacks (Button clicks)
            if (event.postback) {
                const payload = event.postback.payload;
                const title = event.postback.title;
                console.log(`[Postback] From ${senderId}: ${title} (${payload})`);

                let replyText = 'Thanks for your choice! 🌟';
                if (payload === 'GET_DOCS_PAYLOAD') {
                    replyText = 'Sure! 📚 You can find our docs at: https://github.com/amanraj2408/Query-Bot/blob/main/README.md';
                } else if (payload === 'CONTACT_SUPPORT_PAYLOAD') {
                    replyText = "Our support team has been notified. 💬 We'll get back to you shortly!";
                }

                await sendDM(senderId, replyText, token);
                await saveEvent({
                    type: 'postback',
                    from: { id: senderId },
                    content: { text: title, url: payload },
                    reply: { privateDM: replyText, status: 'sent' },
                    raw: event
                });
            }
        }
    }

    return new NextResponse('OK', { status: 200 });
}
