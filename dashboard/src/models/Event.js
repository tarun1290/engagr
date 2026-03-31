import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['comment', 'mention', 'dm', 'reel_share', 'reaction', 'bot_restart', 'postback', 'smart_reply', 'comment_hide', 'comment_unhide', 'comment_delete', 'comments_enabled', 'comments_disabled'],
        required: true
    },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "InstagramAccount", index: true },
    targetBusinessId: { type: String, index: true },
    from: {
        id: String,
        username: String,
        name: String,
    },
    content: {
        commentId: String,
        mediaId: String,
        text: String,
        mediaUrl: String,
        thumbnailUrl: String,
        permalink: String,
        attachmentType: String,
        caption: String,
        reelOwnerUsername: String,
    },
    reply: {
        publicReply: String,
        privateDM: String,
        status: {
            type: String,
            enum: ['sent', 'failed', 'skipped', 'fallback', 'token_expired', 'quota_exceeded'],
            default: 'skipped'
        }
    },
    metadata: {
        automationId: { type: mongoose.Schema.Types.ObjectId, ref: "Automation" },
        categoryRuleId: String,
        categoryRuleName: String,
        matchedCriteria: [String],
        matchType: { type: String, enum: ['category', 'default', 'legacy', 'ai_detection', 'smart_reply', null] },
        // AI detection metadata
        productName: String,
        productCategory: String,
        productBrand: String,
        confidence: Number,
        trackedLinkId: String,
        detectionId: String,
        error: String,
        // Smart reply metadata
        intent: String,
        extractedEntity: String,
        aiModel: String,
        productsReferenced: [String],
        knowledgeChunksUsed: Number,
        processingTimeMs: Number,
        handoff: Boolean,
        handoffReason: String,
        reason: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Event || mongoose.model('Event', EventSchema);
