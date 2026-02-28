const express = require('express');
const axios = require('axios');
const { replyToComment, sendPrivateReply, sendButtonMessage, sendGenericTemplate } = require('../services/instagram');
const { isConnected } = require('../../config/db');
const Event = require('../models/Event');
const User = require('../models/User');
const { log } = require('../utils/logger');

const router = express.Router();

const BASE_URL = 'https://graph.facebook.com/v21.0';
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Save event to DB if connected
async function saveEvent(data, targetBusinessId) {
    if (!isConnected()) return;
    try {
        return await Event.create({ ...data, targetBusinessId });
    } catch (err) {
        console.error('[DB] Failed to save event:', err.message);
    }
}

async function getMedia(id, token) {
    if (!id) return null;
    try {
        const res = await axios.get(`${BASE_URL}/${id}`, {
            params: {
                fields: 'id,media_type,permalink,media_url,thumbnail_url,shortcode,timestamp,username',
                access_token: token
            }
        });
        return res.data;
    } catch (err) {
        log(`[Media Error] Graph API failed for ${id}: ${err.response?.data?.error?.message || err.message}`);
        return null;
    }
}

// Try Instagram oEmbed for public reels — works without special permissions
async function getOEmbed(url, token) {
    if (!url) return null;
    try {
        const res = await axios.get(`${BASE_URL}/instagram_oembed`, {
            params: {
                url,
                fields: 'thumbnail_url,title,author_name',
                access_token: token
            }
        });
        log(`[oEmbed] Got metadata for: ${url}`);
        return res.data; // { thumbnail_url, title, author_name }
    } catch (err) {
        log(`[oEmbed Error] ${err.response?.data?.error?.message || err.message}`);
        return null;
    }
}

async function getUser(id, token) {
    if (!id) return null;
    try {
        const res = await axios.get(`${BASE_URL}/${id}`, {
            params: { fields: 'name,username', access_token: token }
        });
        return res.data;
    } catch (err) {
        console.log(`[Profile Error] ${id}: ${err.response?.data?.error?.message || err.message}`);
        return null;
    }
}

async function sendDM(id, text, token) {
    if (!id || !text) return;
    try {
        await axios.post(`${BASE_URL}/me/messages`, {
            recipient: { id },
            message: { text }
        }, {
            params: { access_token: token }
        });
        log(`[DM Sent] -> ${id}: ${text.substring(0, 20)}...`);
    } catch (err) {
        console.error(`[DM Error] To ${id}:`, err.response?.data?.error?.message || err.message);
    }
}

async function handleAutoReply(commentId, senderId, type, fromInfo, rawPayload, token, automation) {
    if (!commentId) return;

    // Product Ready: Use DB to check for duplicate replies instead of memory
    if (isConnected()) {
        const existingEvent = await Event.findOne({ "content.commentId": commentId, "reply.status": "sent" });
        if (existingEvent) {
            log(`[Skip] Already replied to comment: ${commentId}`);
            return;
        }
    }
    
    // Check if automation is active
    if (!automation || !automation.isActive) {
        log(`[AutoReply] No active automation for user: ${fromInfo?.username || 'unknown'}`);
        return;
    }

    // 1. Check Post Trigger
    const mediaId = rawPayload.media_id || rawPayload.post_id;
    if (automation.postTrigger === 'specific' && automation.selectedPostId && mediaId !== automation.selectedPostId) {
        log(`[AutoReply] Skipped: Media ID mismatch (${mediaId} != ${automation.selectedPostId})`);
        return;
    }

    // 2. Check Comment Trigger
    const commentText = (fromInfo?.text || "").toLowerCase();
    if (automation.commentTrigger === 'specific' && automation.keywords?.length > 0) {
        const hasKeyword = automation.keywords.some(k => commentText.includes(k.toLowerCase()));
        if (!hasKeyword) {
            log(`[AutoReply] Skipped: Keyword not found in "${commentText}"`);
            return;
        }
    }

    let replyStatus = 'skipped';
    
    // Pick a random reply or use the first one
    const publicReply = automation.replyMessages?.length > 0 
        ? automation.replyMessages[Math.floor(Math.random() * automation.replyMessages.length)]
        : 'Check your DM! 📩';
    
    const privateDM = automation.dmContent || 'Hi there! 👋 Thanks for reaching out.';

    try {
        log(`[AutoReply] Processing ${type} for ${commentId}`);

        // Public reply on comment
        if (automation.replyEnabled) {
            try {
                await replyToComment(commentId, publicReply, token);
                log(`[Public] Posted: ${publicReply}`);
            } catch (e) {
                log(`[Public Fail] ${e.message}`);
            }
        }

        // Private DM (Opening DM with optional Button)
        if (automation.buttonText && automation.linkUrl) {
            log(`[DM] Sending button message...`);
            const buttons = [
                {
                    type: 'web_url',
                    url: automation.linkUrl,
                    title: automation.buttonText
                }
            ];
            
            try {
                await sendButtonMessage(senderId, privateDM, buttons, token);
                log(`[DM Success] Button message sent`);
                replyStatus = 'sent';
            } catch (err) {
                log(`[Button Fail] Falling back to direct DM: ${err.message}`);
                await sendDM(senderId, `${privateDM}\n\n${automation.linkUrl}`, token);
                replyStatus = 'fallback';
            }
        } else {
            // Regular DM
            log(`[DM] Sending private reply...`);
            const dm = await sendPrivateReply(commentId, privateDM, token);

            if (!dm) {
                log(`[DM Fallback] Using direct messaging for ${senderId}`);
                await sendDM(senderId, privateDM, token);
                replyStatus = 'fallback';
            } else {
                log(`[DM success] Sent via API`);
                replyStatus = 'sent';
            }
        }
    } catch (err) {
        log(`[Error] ${type} handling failed: ${err.message}`);
        replyStatus = 'failed';
    }

    await saveEvent({
        type,
        from: { id: fromInfo?.id, username: fromInfo?.username },
        content: { commentId, text: fromInfo?.text, mediaId },
        reply: { publicReply, privateDM, status: replyStatus },
        raw: rawPayload
    }, automation.instagramBusinessId);
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
        const targetId = entry.id; // Usually the Instagram Business Account ID or Page ID
        
        // Find the user by either ID (support flexible matching for various app setups)
        const botUser = await User.findOne({ 
            $or: [
                { instagramBusinessId: targetId },
                { pageId: targetId }
            ]
        });
        
        if (!botUser || !botUser.instagramAccessToken) {
            log(`[Webhook] No active account found in system for ID: ${targetId}`);
            continue;
        }

        const token = botUser.instagramAccessToken;

        // 1. Comments & Mentions (Feed)
        const changes = entry.changes || [];
        for (const change of changes) {
            const { field, value } = change;
            const fromId = value.from?.id || value.sender_id;
            
            // Ignore messages from the bot itself
            if (fromId === targetId || fromId === botUser.instagramBusinessId) continue;

            if (field === 'feed' || field === 'comments') {
                if (value.item === 'comment' || field === 'comments') {
                    const cid = value.comment_id || value.id;
                    log(`[Comment] @${value.from?.username}: ${value.message || value.text}`);
                    await handleAutoReply(cid, fromId, 'comment', {
                        id: fromId,
                        username: value.from?.username,
                        text: value.message || value.text
                    }, value, token, { ...botUser.automation, instagramBusinessId: botUser.instagramBusinessId });
                }
            }

            if (field === 'mention' || field === 'mentions') {
                const cid = value.comment_id || value.id;
                log(`[Mention] Media: ${value.media_id || value.post_id}`);
                await handleAutoReply(cid, fromId, 'mention', {
                    id: fromId,
                    username: value.from?.username,
                    text: value.text
                }, value, token, { ...botUser.automation, instagramBusinessId: botUser.instagramBusinessId });
            }
        }

        // 2. Direct Messages & Postbacks
        const messaging = entry.messaging || entry.standby || [];
        for (const event of messaging) {
            const senderId = event.sender?.id || event.from?.id;
            if (senderId === targetId || senderId === botUser.instagramBusinessId) continue;

            // Handle Messages (Text, Reels, etc.)
            if (event.message) {
                const profile = await getUser(senderId, token);
                const msgText = event.message.text;
                if (msgText) log(`[Message] @${profile?.username || 'user'}: ${msgText}`);

                const attachments = event.message.attachments || [];
                for (const att of attachments) {
                    const mediaId = att.payload?.reel_video_id || att.payload?.media?.id || att.payload?.id;
                    let url = att.payload?.url || att.url;
                    let thumbnailUrl = null;
                    let reelAuthor = null;

                    // Step 1: Try Graph API (works for your own managed media)
                    if (mediaId) {
                        const meta = await getMedia(mediaId, token);
                        if (meta?.permalink) {
                            url = meta.permalink;
                            log(`[Metadata] Got permalink from Graph API: ${url}`);
                        }
                        if (meta?.thumbnail_url || meta?.media_url) {
                            thumbnailUrl = meta.thumbnail_url || meta.media_url;
                        }
                        if (meta?.username) reelAuthor = meta.username;
                    }

                    // Step 2: Try oEmbed API (works for public reels — gets thumbnail + author)
                    if (!thumbnailUrl && url) {
                        log(`[oEmbed] Trying to fetch public reel metadata...`);
                        const oembed = await getOEmbed(url, token);
                        if (oembed?.thumbnail_url) {
                            thumbnailUrl = oembed.thumbnail_url;
                            log(`[oEmbed] Got thumbnail: ${thumbnailUrl}`);
                        }
                        if (oembed?.author_name) reelAuthor = oembed.author_name;
                    }

                    if (url) {
                        log(`[Shared] Final URL: ${url}`);
                        const greeting = `Hi ${profile?.name?.split(' ')[0] || 'there'}! 👋`;
                        const text = `${greeting} I've detected that you shared a reel! ✨ Here is the direct link for easy access.`;
                        
                        const buttons = [{ type: 'web_url', url: url, title: 'Watch Reel 🎬' }];
                        let sent = false;

                        // Step 3: Send richest available format
                        if (thumbnailUrl) {
                            try {
                                const elements = [{
                                    title: 'Reel Shared with You! ✨',
                                    image_url: thumbnailUrl,
                                    subtitle: reelAuthor
                                        ? `By @${reelAuthor}. Tap below to watch!`
                                        : `${greeting} I've retrieved the link for you!`,
                                    buttons: buttons
                                }];
                                await sendGenericTemplate(senderId, elements, token);
                                log(`[Generic Sent] -> ${senderId} (with thumbnail)`);
                                sent = true;
                            } catch (e) {
                                log(`[Template Fail] Falling back to Button Template: ${e.message}`);
                            }
                        }

                        if (!sent) {
                            try {
                                await sendButtonMessage(senderId, text, buttons, token);
                                log(`[Button Sent] -> ${senderId}`);
                                sent = true;
                            } catch (err) {
                                log(`[Template Fail] Falling back to text DM`);
                                await sendDM(senderId, `${text}\n\n${url}`, token);
                            }
                        }

                        await saveEvent({
                            type: 'reel_share',
                            from: { id: senderId, username: profile?.username, name: profile?.name },
                            content: { mediaId, url, thumbnailUrl },
                            reply: { privateDM: text, status: 'sent' },
                            raw: event
                        }, botUser.instagramBusinessId);
                    }
                }
            }

            // Handle Postbacks (Buttons)
            if (event.postback) {
                const payload = event.postback.payload;
                const title = event.postback.title;
                log(`[Postback] From ${senderId}: ${title} (${payload})`);

                let replyText = "Thanks for your choice! 🌟";
                if (payload === 'GET_DOCS_PAYLOAD') {
                    replyText = "Sure! 📚 You can find our documentation at: https://github.com/amanraj2408/Query-Bot/blob/main/README.md";
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
                }, botUser.instagramBusinessId);
            }
        }
    }

    res.status(200).send('OK');
});

module.exports = router;

