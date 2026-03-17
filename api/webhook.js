// Vercel Serverless Function — routes all /webhook requests to the Express app
const app = require('../ai-dm-bot/index.js');

module.exports = app;
