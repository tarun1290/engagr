const mongoose = require('mongoose');

// Stores every meaningful Instagram event the bot sees
const eventSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['comment', 'mention', 'dm', 'reel_share', 'reaction', 'bot_restart', 'postback'],
        required: true
    },
    targetBusinessId: String,
    from: {
        id: String,
        username: String,
        name: String
    },
    content: {
        commentId: String,
        mediaId: String,
        text: String,
        url: String
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

module.exports = mongoose.model('Event', eventSchema);
