const https = require('https');
const http = require('http');

const WEBHOOK_URL = 'http://localhost:5001/webhook'; // Direct to local bot server

function testUrl(url) {
    console.log(`\nTesting: ${url}`);
    
    // GET Request (Verification)
    const getUrl = `${url}?hub.mode=subscribe&hub.verify_token=query_bot_token_123&hub.challenge=SUCCESS_123`;
    
    const request = (url.startsWith('https') ? https : http).get(getUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            if (data === 'SUCCESS_123') {
                console.log('✅ GET Verification: SUCCESS');
            } else {
                console.log(`❌ GET Verification: FAILED (Response: ${data})`);
            }
            
            // POST Request (Event Simulation)
            const postData = JSON.stringify({
                object: 'instagram',
                entry: [{
                    id: '17841460161632234',
                    messaging: [{
                        sender: { id: 'TEST_USER' },
                        message: { text: 'ENABLE_MSG_CHECK' }
                    }]
                }]
            });

            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': postData.length
                }
            };

            const postReq = (url.startsWith('https') ? https : http).request(url, options, (res) => {
                console.log(`✅ POST Status: ${res.statusCode} ${res.statusCode === 200 ? '(OK)' : '(FAIL)'}`);
            });

            postReq.on('error', (e) => console.error(`❌ POST Error: ${e.message}`));
            postReq.write(postData);
            postReq.end();
        });
    });

    request.on('error', (e) => {
        console.error(`❌ Connection Error: ${e.message}`);
        console.log('👉 Ensure your bot server (npm run dev in ai-dm-bot) is RUNNING on port 5001.');
    });
}

// Test local only
testUrl(WEBHOOK_URL);
