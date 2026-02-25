const express = require('express');
const axios = require('axios');
const { replyToComment, sendPrivateReply } = require('../services/instagram');
const { isConnected } = require('../../config/db');
const Event = require('../models/Event');
const { log } = require('../utils/logger');

const router = express.Router();

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const BASE_URL = 'https://graph.facebook.com/v25.0';
const BOT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const userCache = new Map();
const repliedComments = new Set();
const PUBLIC_REPLY = 'check your dm';
const PRIVATE_REPLY = 'Hii how can i help you';

// Save event to DB if connected
async function saveEvent(data) {
    if (!isConnected()) return;
    try {
        await Event.create(data);
    } catch (err) {
        console.error('[DB] Failed to save event:', err.message);
    }
}

async function getMedia(id) {
    if (!id) return null;
    try {
        const res = await axios.get(`${BASE_URL}/${id}`, {
            params: {
                fields: 'id,media_type,permalink,shortcode,timestamp,username',
                access_token: ACCESS_TOKEN
            }
        });
        return res.data;
    } catch (err) {
        log(`[Media Error] ${id}: ${err.response?.data?.error?.message || err.message}`);
        return null;
    }
}

async function getUser(id) {
    if (!id) return null;
    try {
        const res = await axios.get(`${BASE_URL}/${id}`, {
            params: { fields: 'name,username', access_token: ACCESS_TOKEN }
        });
        return res.data;
    } catch (err) {
        console.log(`[Profile Error] ${id}: ${err.response?.data?.error?.message || err.message}`);
        return null;
    }
}

async function sendDM(id, text) {
    if (!id || !text) return;
    try {
        await axios.post(`${BASE_URL}/me/messages`, {
            recipient: { id },
            message: { text }
        }, {
            params: { access_token: ACCESS_TOKEN }
        });
        log(`[DM Sent] -> ${id}: ${text.substring(0, 20)}...`);
    } catch (err) {
        console.error(`[DM Error] To ${id}:`, err.response?.data?.error?.message || err.message);
    }
}

async function handleAutoReply(commentId, senderId, type, fromInfo, rawPayload) {
    if (!commentId || repliedComments.has(commentId)) return;

    let replyStatus = 'skipped';

    try {
        log(`[AutoReply] Processing ${type} for ${commentId}`);

        // Public reply on comment
        try {
            await replyToComment(commentId, PUBLIC_REPLY);
            log(`[Public] Posted: ${PUBLIC_REPLY}`);
        } catch (e) {
            log(`[Public Fail] ${e.message}`);
        }

        // Private DM
        log(`[DM] Sending private message...`);
        const dm = await sendPrivateReply(commentId, PRIVATE_REPLY);

        if (!dm) {
            log(`[DM Fallback] Using direct messaging for ${senderId}`);
            await sendDM(senderId, PRIVATE_REPLY);
            replyStatus = 'fallback';
        } else {
            log(`[DM success] Sent via API`);
            replyStatus = 'sent';
        }

        repliedComments.add(commentId);
    } catch (err) {
        log(`[Error] ${type} handling failed: ${err.message}`);
        replyStatus = 'failed';
    }

    await saveEvent({
        type,
        from: { id: fromInfo?.id, username: fromInfo?.username },
        content: { commentId, text: fromInfo?.text },
        reply: { publicReply: PUBLIC_REPLY, privateDM: PRIVATE_REPLY, status: replyStatus },
        raw: rawPayload
    });
}

// Webhook verification
router.get('/', (req, res) => {
    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
        return res.send(req.query['hub.challenge']);
    }
    res.sendStatus(403);
});

// Incoming events
router.post('/', async (req, res) => {
    const body = req.body;

    if (body.object !== 'instagram') return res.sendStatus(404);

    const entries = body.entry || [];

    for (const entry of entries) {
        // Comments & Mentions
        const changes = entry.changes || [];
        for (const change of changes) {
            const { field, value } = change;
            const fromId = value.from?.id || value.sender_id;
            if (fromId === BOT_ID) continue;

            if (field === 'feed' || field === 'comments') {
                if (value.item === 'comment' || field === 'comments') {
                    const cid = value.comment_id || value.id;
                    log(`[Comment] @${value.from?.username}: ${value.message || value.text}`);
                    await handleAutoReply(cid, fromId, 'comment', {
                        id: fromId,
                        username: value.from?.username,
                        text: value.message || value.text
                    }, change);
                }
            }

            if (field === 'mention' || field === 'mentions') {
                const cid = value.comment_id || value.id;
                log(`[Mention] Media: ${value.media_id || value.post_id}`);
                await handleAutoReply(cid, fromId, 'mention', {
                    id: fromId,
                    username: value.from?.username,
                    text: value.text
                }, change);
            }
        }

        // Direct Messages & Reel Shares
        const messaging = entry.messaging || entry.standby || [];
        for (const event of messaging) {
            const senderId = event.sender?.id || event.from?.id;
            if (!event.message || senderId === BOT_ID) continue;

            let profile = userCache.get(senderId);
            if (!profile) {
                profile = await getUser(senderId);
                if (profile) userCache.set(senderId, profile);
            }

            const msgText = event.message.text;
            if (msgText) log(`[Message] @${profile?.username || 'user'}: ${msgText}`);

            const attachments = event.message.attachments || [];
            for (const att of attachments) {
                const mediaId = att.payload?.reel_video_id || att.payload?.media?.id || att.payload?.id;
                let url = att.payload?.url || att.url;

                if (mediaId) {
                    const meta = await getMedia(mediaId);
                    if (meta?.permalink) url = meta.permalink;
                }

                if (url) {
                    log(`[Shared] URL: ${url}`);
                    const reply = `Hi ${profile?.name?.split(' ')[0] || 'there'}! Here is your link:\n\n${url}`;
                    await sendDM(senderId, reply);

                    await saveEvent({
                        type: 'reel_share',
                        from: { id: senderId, username: profile?.username, name: profile?.name },
                        content: { mediaId, url },
                        reply: { privateDM: reply, status: 'sent' },
                        raw: event
                    });
                }
            }
        }
    }

    res.status(200).send('OK');
});

module.exports = router;
