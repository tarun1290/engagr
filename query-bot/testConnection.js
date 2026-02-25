const { getBusinessProfile } = require('./instagramService');

async function testConnection() {
    console.log('Testing connection to Instagram Business Account...');
    try {
        const profile = await getBusinessProfile();
        console.log(' Success! Connected to:');
        console.log(`Username: ${profile.username}`);
        console.log(`ID: ${profile.id}`);
        console.log(`Name: ${profile.name}`);
    } catch (error) {
        console.error(' Connection Failed.');
        console.log('Actual Error:', error.response?.data || error.message);
    }
}

testConnection();
