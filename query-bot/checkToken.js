const axios = require('axios');
require('dotenv').config();

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

async function checkToken() {
    try {
        console.log('--- Checking Token Permissions ---');
        const res = await axios.get(`https://graph.facebook.com/v24.0/me/permissions?access_token=${ACCESS_TOKEN}`);
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error('Permission check failed:', e.response?.data || e.message);
    }
}

checkToken();
