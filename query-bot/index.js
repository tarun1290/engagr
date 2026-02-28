const express = require('express');
require('dotenv').config();

const { connectDB } = require('./config/db');
const webhookRouter = require('./src/routes/webhook');

// Initialize Database
connectDB();

const app = express();

// Middleware
app.use(express.json());

// Main Routes
app.get('/', (req, res) => res.json({ status: 'active', message: 'Query Bot API is running' }));
app.use('/webhook', webhookRouter);

// Export for Vercel
module.exports = app;

// Local Development Server
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`\n🚀 Server listening on port ${PORT}`);
        console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/webhook\n`);
    });
}
