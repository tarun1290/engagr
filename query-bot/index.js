const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./config/db');
const webhookRouter = require('./src/routes/webhook');
const { LOG_FILE } = require('./src/utils/logger');
const Event = require('./src/models/Event');
const { isConnected } = require('./config/db');

// Make sure logs folder exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

// Connect to MongoDB
connectDB();

// Log restart event
fs.appendFileSync(LOG_FILE, `\n--- RESTART: ${new Date().toLocaleString()} ---\n`);
(async () => {
    if (isConnected()) {
        await Event.create({ type: 'bot_restart', content: { text: `Restarted at ${new Date().toISOString()}` } });
    }
})();

const app = express();
app.use(bodyParser.json());

// Routes
app.use('/webhook', webhookRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}...`);
});
