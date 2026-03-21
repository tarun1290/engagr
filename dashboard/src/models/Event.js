import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['comment', 'mention', 'dm', 'reel_share', 'reaction', 'bot_restart', 'postback'],
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
    },
    reply: {
        publicReply: String,
        privateDM: String,
        status: {
            type: String,
            enum: ['sent', 'failed', 'skipped', 'fallback', 'token_expired'],
            default: 'skipped'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Event || mongoose.model('Event', EventSchema);
