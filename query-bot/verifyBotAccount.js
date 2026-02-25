const axios = require('axios');
require('dotenv').config();

const token = process.env.INSTAGRAM_ACCESS_TOKEN;
const baseUrl = 'https://graph.facebook.com/v24.0';

async function verify() {
    try {
        console.log('--- Verifying Current Bot Account ---');
        // Check current identity of the token
        const me = await axios.get(`${baseUrl}/me?fields=id,name,instagram_business_account&access_token=${token}`);
        console.log('Token Identity:', me.data.name, `(${me.data.id})`);

        if (me.data.instagram_business_account) {
            console.log(` -> Found Linked Instagram Business ID: ${me.data.instagram_business_account.id}`);
        } else {
            console.log(' -> No direct Instagram account linked to this ID. Checking sub-accounts...');
            // Check linked Instagram accounts (User token style)
            try {
                const accounts = await axios.get(`${baseUrl}/me/accounts?fields=name,instagram_business_account&access_token=${token}`);
                console.log('\n--- Linked Pages and Instagram Accounts ---');
                accounts.data.data.forEach(page => {
                    console.log(`Page Name: ${page.name}`);
                    if (page.instagram_business_account) {
                        console.log(` -> Instagram Business ID: ${page.instagram_business_account.id}`);
                    } else {
                        console.log(` -> No Instagram account linked to this Page.`);
                    }
                });
            } catch (innerError) {
                console.log(' -> Could not fetch sub-accounts (Token might be a direct Page token).');
            }
        }

    } catch (e) {
        console.error('Verification failed:', e.response?.data || e.message);
    }
}

verify();
