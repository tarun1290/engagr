const mongoose = require('mongoose');

let connected = false;

async function connectDB() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.log('[DB] No MONGODB_URI in .env — skipping database connection.');
        return;
    }

    try {
        await mongoose.connect(uri);
        connected = true;
        console.log('[DB] Connected to MongoDB');
    } catch (err) {
        console.error('[DB] Connection failed:', err.message);
    }
}

function isConnected() {
    return connected;
}

module.exports = { connectDB, isConnected };
