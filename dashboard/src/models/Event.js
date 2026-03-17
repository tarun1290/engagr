import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['comment', 'mention', 'dm', 'reel_share', 'reaction', 'bot_restart', 'postback'],
        required: true
    },
    targetBusinessId: { type: String, index: true },
    from: {
        id: String,
        username: String,
        name: String,
        profilePic: String,
    },
    content: {
        commentId: String,
        mediaId: String,
        text: String,
        url: String,
        mediaUrl: String,        // Direct playable/viewable media URL
        thumbnailUrl: String,    // Preview image for videos/reels
        permalink: String,       // Instagram post permalink
        attachmentType: String,  // reel | post_share | image | video | audio | media
    },
    reply: {
        publicReply: String,
        privateDM: String,
        status: {
            type: String,
            enum: ['sent', 'failed', 'skipped', 'fallback'],
            default: 'skipped'
        }
    },
    raw: mongoose.Schema.Types.Mixed,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Event || mongoose.model('Event', EventSchema);
