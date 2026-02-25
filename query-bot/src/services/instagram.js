const axios = require('axios');
require('dotenv').config();

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const BIZ_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const BASE_URL = 'https://graph.facebook.com/v25.0';

async function getBusinessProfile() {
    try {
        const res = await axios.get(`${BASE_URL}/${BIZ_ID}`, {
            params: {
                fields: 'username,id,name,biography,profile_picture_url',
                access_token: ACCESS_TOKEN
            }
        });
        return res.data;
    } catch (err) {
        console.error('Error fetching business settings:', err.response?.data || err.message);
        throw err;
    }
}

async function getMediaMetadata(mediaId) {
    try {
        const res = await axios.get(`${BASE_URL}/${mediaId}`, {
            params: {
                fields: 'id,caption,media_type,media_url,timestamp,username',
                access_token: ACCESS_TOKEN
            }
        });
        return res.data;
    } catch (err) {
        console.error('Error fetching media:', err.response?.data || err.message);
        throw err;
    }
}

async function sendMessage(recipientId, text) {
    if (recipientId === 'test_user') return { success: true };

    try {
        const res = await axios.post(`${BASE_URL}/${BIZ_ID}/messages`, {
            recipient: { id: recipientId },
            message: { text }
        }, {
            params: { access_token: ACCESS_TOKEN }
        });
        console.log(`Sent DM to ${recipientId}`);
        return res.data;
    } catch (err) {
        console.error(`Failed DM to ${recipientId}:`, err.response?.data || err.message);
        throw err;
    }
}

async function replyToComment(commentId, text) {
    try {
        const res = await axios.post(`${BASE_URL}/${commentId}/replies`, null, {
            params: {
                message: text,
                access_token: ACCESS_TOKEN
            }
        });
        console.log(`Replied to comment ${commentId}`);
        return res.data;
    } catch (err) {
        console.error(`Fail: Public reply to ${commentId}:`, err.response?.data || err.message);
        throw err;
    }
}

async function sendPrivateReply(commentId, text) {
    try {
        const res = await axios.post(`${BASE_URL}/${commentId}/private_replies`, null, {
            params: {
                message: text,
                access_token: ACCESS_TOKEN
            }
        });
        console.log(`Sent private reply to ${commentId}`);
        return res.data;
    } catch (err) {
        console.error(`Fail: Private DM to ${commentId}:`, err.response?.data || err.message);
        return null;
    }
}

module.exports = {
    getBusinessProfile,
    getMediaMetadata,
    sendMessage,
    replyToComment,
    sendPrivateReply
};
