const axios = require('axios');
require('dotenv').config({ path: '../.env' });

const INPUT_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const APP_ID = process.env.INSTAGRAM_APP_ID;
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const APP_TOKEN = `${APP_ID}|${APP_SECRET}`;

async function debug() {
    try {
        console.log('Checking token...');
        const res = await axios.get('https://graph.facebook.com/debug_token', {
            params: {
                input_token: INPUT_TOKEN,
                access_token: APP_TOKEN
            }
        });
        console.log(JSON.stringify(res.data.data, null, 2));
    } catch (err) {
        console.error('Debug failed:', err.response?.data || err.message);
    }
}

debug();
