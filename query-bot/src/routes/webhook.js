const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const { log } = require('../utils/logger');
const { 
    sendButtonMessage, 
    sendGenericTemplate, 
    sendMessage 
} = require('../services/instagram');
const { 
    getInstagramProfile, 
    trackEvent, 
    handleAutomatedReply 
} = require('../services/webhookHandlers');

const router = express.Router();
const BASE_URL = 'https://graph.facebook.com/v21.0';
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

/**
 * Handle Webhook Verification (GET)
 */
router.get('/', (req, res) => {
    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
        return res.send(req.query['hub.challenge']);
    }
    res.sendStatus(403);
});

/**
 * Process Incoming Events (POST)
 */
router.post('/', async (req, res) => {
    const { body } = req;

    if (body.object !== 'instagram') {
        return res.sendStatus(404);
    }

    const entries = body.entry || [];

    for (const entry of entries) {
        const targetId = entry.id;
        
        // Lookup the user associated with this Instagram ID
        const botUser = await User.findOne({ 
            $or: [
                { instagramBusinessId: targetId },
                { pageId: targetId }
            ]
        });
        
        if (!botUser?.instagramAccessToken) {
            log(`[Webhook] No active account found for ID: ${targetId}`);
            continue;
        }

        const token = botUser.instagramAccessToken;
        const automationConfig = { 
            ...botUser.automation, 
            instagramBusinessId: botUser.instagramBusinessId 
        };

        // 1. Handle Feed Changes (Comments, Mentions)
        await handleFeedChanges(entry.changes, botUser, token, automationConfig);

        // 2. Handle Messaging Events (DMs, Reels, Postbacks)
        const messaging = entry.messaging || entry.standby || [];
        for (const event of messaging) {
            await processMessagingEvent(event, botUser, token);
        }
    }

    res.status(200).send('OK');
});

/**
 * Processes feed-related changes like comments and mentions
 */
async function handleFeedChanges(changes = [], botUser, token, automation) {
    for (const change of changes) {
        const { field, value } = change;
        const fromId = value.from?.id || value.sender_id;
        
        // Prevent infinite loops where the bot replies to itself
        if (fromId === botUser.instagramBusinessId || fromId === botUser.pageId) continue;

        if (field === 'feed' || field === 'comments') {
            const commentId = value.comment_id || value.id;
            const text = value.message || value.text;
            
            log(`[Comment] @${value.from?.username}: ${text}`);
            
            await handleAutomatedReply(commentId, fromId, 'comment', {
                id: fromId,
                username: value.from?.username,
                text: text
            }, value, token, automation);
        }

        if (field === 'mention' || field === 'mentions') {
            const mentionId = value.comment_id || value.id;
            log(`[Mention] Media: ${value.media_id || value.post_id}`);
            
            await handleAutomatedReply(mentionId, fromId, 'mention', {
                id: fromId,
                username: value.from?.username,
                text: value.text
            }, value, token, automation);
        }
    }
}

/**
 * Processes a single messaging event (DM, Reel share, etc.)
 */
async function processMessagingEvent(event, botUser, token) {
    const senderId = event.sender?.id || event.from?.id;
    if (senderId === botUser.instagramBusinessId || senderId === botUser.pageId) return;

    // Handle Direct Messages & Reel Shares
    if (event.message) {
        const profile = await getInstagramProfile(senderId, token);
        const msgText = event.message.text;
        
        if (msgText) log(`[DM] @${profile?.username || 'user'}: ${msgText}`);

        // Check for media attachments (e.g., Reels shared to DMs)
        const attachments = event.message.attachments || [];
        for (const attachment of attachments) {
            await handleMediaShare(attachment, senderId, profile, token, botUser);
        }
    }

    // Handle Postback Actions (Button clicks)
    if (event.postback) {
        await handlePostback(event.postback, senderId, token, botUser);
    }
}

/**
 * Handles shared media (Reels) in DMs
 */
async function handleMediaShare(attachment, senderId, profile, token, botUser) {
    const mediaId = attachment.payload?.reel_video_id || attachment.payload?.media?.id || attachment.payload?.id;
    if (!mediaId) return;

    log(`[Feed] Media shared by @${profile?.username || 'user'}`);

    const dashboardUrl = 'https://doteyelabs.com/dashboard';
    const firstName = profile?.name?.split(' ')[0] || 'there';
    
    const greeting = `Hi ${firstName}! 👋`;
    const message = `${greeting} Thanks for sharing! 🎉 Check out our dashboard for more updates.`;
    const buttons = [{ type: 'web_url', url: dashboardUrl, title: 'Open Dashboard 🚀' }];

    try {
        // We try to send a clean button message pointing to our platform
        await sendButtonMessage(senderId, message, buttons, token);
    } catch (err) {
        // Fallback to simple link if button template fails
        await sendMessage(senderId, `${message}\n\n${dashboardUrl}`, token);
    }

    await trackEvent({
        type: 'reel_share',
        from: { id: senderId, username: profile?.username, name: profile?.name },
        content: { mediaId },
        reply: { privateDM: message, status: 'sent', url: dashboardUrl },
        raw: attachment
    }, botUser.instagramBusinessId);
}

/**
 * Handles postback events from button interactions
 */
async function handlePostback(postback, senderId, token, botUser) {
    const { payload, title } = postback;
    log(`[Action] ${title} (${payload}) from ${senderId}`);

    let reply = "Thanks! 🌟 We've received your request.";
    
    if (payload === 'GET_DOCS_PAYLOAD') {
        reply = "Here is our documentation: https://github.com/amanraj2408/Query-Bot/blob/main/README.md";
    } else if (payload === 'CONTACT_SUPPORT_PAYLOAD') {
        reply = "Our team has been notified. We'll be in touch soon!";
    }

    await sendMessage(senderId, reply, token);

    await trackEvent({
        type: 'postback',
        from: { id: senderId },
        content: { text: title, url: payload },
        reply: { privateDM: reply, status: 'sent' },
        raw: postback
    }, botUser.instagramBusinessId);
}

module.exports = router;

