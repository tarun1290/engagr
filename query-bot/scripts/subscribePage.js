const axios = require('axios');
require('dotenv').config({ path: '../.env' });

const token = process.env.INSTAGRAM_ACCESS_TOKEN;
const url = 'https://graph.facebook.com/v25.0/me/subscribed_apps';

async function setupWebhooks() {
    try {
        console.log('Registering webhooks...');
        const res = await axios.post(url, {
            subscribed_fields: [
                'messages',
                'messaging_postbacks',
                'messaging_optins',
                'message_deliveries',
                'message_reads',
                'standby',
                'message_edits',
                'feed',
                'mention'
            ]
        }, {
            params: { access_token: token }
        });
        console.log('Done:', res.data);
    } catch (err) {
        console.error('Setup failed:', err.response?.data || err.message);
    }
}

setupWebhooks();
