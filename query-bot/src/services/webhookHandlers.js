const axios = require('axios');
const { 
    replyToComment, 
    sendPrivateReply, 
    sendButtonMessage, 
    sendGenericTemplate,
    sendMessage
} = require('./instagram');
const Event = require('../models/Event');
const { isConnected } = require('../../config/db');
const { log } = require('../utils/logger');

const BASE_URL = 'https://graph.facebook.com/v21.0';

/**
 * Fetches user profile information from Instagram
 */
async function getInstagramProfile(userId, token) {
    if (!userId) return null;
    try {
        const response = await axios.get(`${BASE_URL}/${userId}`, {
            params: { fields: 'name,username', access_token: token }
        });
        return response.data;
    } catch (error) {
        log(`[Profile] Error fetching ${userId}: ${error.response?.data?.error?.message || error.message}`);
        return null;
    }
}

/**
 * Saves an event to the database if connected
 */
async function trackEvent(payload, businessId) {
    if (!isConnected()) return;
    try {
        return await Event.create({ ...payload, targetBusinessId: businessId });
    } catch (error) {
        console.error('[DB] Event tracking failed:', error.message);
    }
}

/**
 * Handles the logic for automatic replies to comments or mentions
 */
async function handleAutomatedReply(commentId, senderId, type, senderInfo, payload, token, automation) {
    if (!commentId) return;

    // Check for duplicate replies
    if (isConnected()) {
        const alreadyReplied = await Event.findOne({ 
            "content.commentId": commentId, 
            "reply.status": "sent" 
        });
        if (alreadyReplied) {
            log(`[Skip] Duplicate check: Already replied to ${commentId}`);
            return;
        }
    }

    // Verify automation state
    if (!automation?.isActive) {
        log(`[Skip] Automation inactive for ${senderInfo?.username || 'unknown'}`);
        return;
    }

    // Evaluate Post Trigger
    const mediaId = payload.media_id || payload.post_id;
    if (automation.postTrigger === 'specific' && automation.selectedPostId && mediaId !== automation.selectedPostId) {
        return; // Silent skip for post mismatch
    }

    // Evaluate Keyword Trigger
    const commentText = (senderInfo?.text || "").toLowerCase();
    if (automation.commentTrigger === 'specific' && (automation.keywords || []).length > 0) {
        const matched = automation.keywords.some(k => commentText.includes(k.toLowerCase()));
        if (!matched) return; // Silent skip for keyword mismatch
    }

    let status = 'skipped';
    
    // Select appropriate messages
    const publicText = automation.replyMessages?.length > 0 
        ? automation.replyMessages[Math.floor(Math.random() * automation.replyMessages.length)]
        : 'Check your DM! 📩';
    
    const privateText = automation.dmContent || 'Hi there! 👋 Thanks for reaching out.';

    try {
        // 1. Post Public Reply
        if (automation.replyEnabled) {
            try {
                await replyToComment(commentId, publicText, token);
            } catch (e) {
                log(`[Public] Failed: ${e.message}`);
            }
        }

        // 2. Send Private Resource (Button or Text)
        if (automation.buttonText && automation.linkUrl) {
            const buttons = [{
                type: 'web_url',
                url: automation.linkUrl,
                title: automation.buttonText
            }];
            
            try {
                await sendButtonMessage(senderId, privateText, buttons, token);
                status = 'sent';
            } catch (err) {
                // Fallback to plain DM if buttons fail
                await sendMessage(senderId, `${privateText}\n\n${automation.linkUrl}`, token);
                status = 'fallback';
            }
        } else {
            const dmResponse = await sendPrivateReply(commentId, privateText, token);
            if (!dmResponse) {
                await sendMessage(senderId, privateText, token);
                status = 'fallback';
            } else {
                status = 'sent';
            }
        }
    } catch (err) {
        log(`[Critical] Auto-reply failed: ${err.message}`);
        status = 'failed';
    }

    // Track the interaction
    await trackEvent({
        type,
        from: { id: senderInfo?.id, username: senderInfo?.username },
        content: { commentId, text: senderInfo?.text, mediaId },
        reply: { publicReply: publicText, privateDM: privateText, status },
        raw: payload
    }, automation.instagramBusinessId);
}

module.exports = {
    getInstagramProfile,
    trackEvent,
    handleAutomatedReply
};
