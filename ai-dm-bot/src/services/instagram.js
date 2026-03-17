const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'https://graph.facebook.com/v25.0';

async function getBusinessProfile(bizId, token) {
    try {
        const res = await axios.get(`${BASE_URL}/${bizId}`, {
            params: {
                fields: 'username,id,name,biography,profile_picture_url',
                access_token: token
            }
        });
        return res.data;
    } catch (err) {
        console.error('Error fetching business settings:', err.response?.data || err.message);
        throw err;
    }
}

async function getMediaMetadata(mediaId, token) {
    try {
        const res = await axios.get(`${BASE_URL}/${mediaId}`, {
            params: {
                fields: 'id,caption,media_type,media_url,timestamp,username',
                access_token: token
            }
        });
        return res.data;
    } catch (err) {
        console.error('Error fetching media:', err.response?.data || err.message);
        throw err;
    }
}

async function sendMessage(recipientId, text, token) {
    if (recipientId === 'test_user') return { success: true };

    try {
        const res = await axios.post(`${BASE_URL}/me/messages`, {
            recipient: { id: recipientId },
            message: { text }
        }, {
            params: { access_token: token }
        });
        console.log(`Sent DM to ${recipientId}`);
        return res.data;
    } catch (err) {
        console.error(`Failed DM to ${recipientId}:`, err.response?.data || err.message);
        throw err;
    }
}

async function sendButtonMessage(recipientId, text, buttons, token) {
    if (recipientId === 'test_user') return { success: true };

    try {
        const res = await axios.post(`${BASE_URL}/me/messages`, {
            recipient: { id: recipientId },
            message: {
                attachment: {
                    type: 'template',
                    payload: {
                        template_type: 'button',
                        text: text,
                        buttons: buttons
                    }
                }
            }
        }, {
            params: { access_token: token }
        });
        console.log(`Sent Button Message to ${recipientId}`);
        return res.data;
    } catch (err) {
        console.error(`Failed Button Message to ${recipientId}:`, err.response?.data || err.message);
        throw err;
    }
}

async function sendGenericTemplate(recipientId, elements, token) {
    if (recipientId === 'test_user') return { success: true };

    try {
        const res = await axios.post(`${BASE_URL}/me/messages`, {
            recipient: { id: recipientId },
            message: {
                attachment: {
                    type: 'template',
                    payload: {
                        template_type: 'generic',
                        elements: elements
                    }
                }
            }
        }, {
            params: { access_token: token }
        });
        console.log(`Sent Generic Template to ${recipientId}`);
        return res.data;
    } catch (err) {
        console.error(`Failed Generic Template to ${recipientId}:`, err.response?.data || err.message);
        throw err;
    }
}

async function replyToComment(commentId, text, token) {
    try {
        const res = await axios.post(`${BASE_URL}/${commentId}/replies`, null, {
            params: {
                message: text,
                access_token: token
            }
        });
        console.log(`Replied to comment ${commentId}`);
        return res.data;
    } catch (err) {
        console.error(`Fail: Public reply to ${commentId}:`, err.response?.data || err.message);
        throw err;
    }
}

async function sendPrivateReply(commentId, text, token) {
    try {
        const res = await axios.post(`${BASE_URL}/${commentId}/private_replies`, null, {
            params: {
                message: text,
                access_token: token
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
    sendButtonMessage,
    sendGenericTemplate,
    replyToComment,
    sendPrivateReply
};
