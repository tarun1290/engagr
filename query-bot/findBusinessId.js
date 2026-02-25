const axios = require('axios');
require('dotenv').config();

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const BASE_URL = 'https://graph.facebook.com/v19.0';

async function findBusinessId() {
    try {
        console.log('Fetching Facebook Pages linked to this token...');
        const pagesResponse = await axios.get(`${BASE_URL}/me/accounts`, {
            params: { access_token: ACCESS_TOKEN }
        });

        if (pagesResponse.data.data && pagesResponse.data.data.length > 0) {
            for (const page of pagesResponse.data.data) {
                console.log(`Checking Page: ${page.name} (ID: ${page.id})`);
                const igResponse = await axios.get(`${BASE_URL}/${page.id}`, {
                    params: {
                        fields: 'instagram_business_account',
                        access_token: ACCESS_TOKEN
                    }
                });

                if (igResponse.data.instagram_business_account) {
                    const igId = igResponse.data.instagram_business_account.id;
                    console.log(`\n✅ Found Instagram Business Account ID: ${igId}`);
                    console.log(`For Page: ${page.name}`);
                    return igId;
                }
            }
            console.log('\n❌ No Instagram Business Account linked to these Pages found.');
        } else {
            console.log('\n❌ No Facebook Pages found for this token.');
        }
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

findBusinessId();
