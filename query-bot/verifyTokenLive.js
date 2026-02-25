const { sendMessage } = require('./instagramService');
require('dotenv').config();

// The tester ID should be found in the Meta Dashboard or from an incoming message
// For now, we test if the service can at least talk to the Graph API
async function testSend() {
    try {
        console.log('Testing if Graph API is reachable with new token...');
        // We'll just fetch profile first to be safe
        const { getBusinessProfile } = require('./instagramService');
        const profile = await getBusinessProfile();
        console.log('Token is valid! Business Name:', profile.name);
        
        console.log('\nNOTE: To test actual message sending, we need your numeric Instagram User ID.');
        console.log('Please share a Reel with the bot so we can see your ID in the terminal.');
    } catch (e) {
        console.error('Token Test Failed:', e.response?.data || e.message);
    }
}

testSend();
