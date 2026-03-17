const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../../logs/scoop_logs.txt');

function log(msg) {
    const time = new Date().toLocaleString();
    console.log(`[${time}] ${msg}`);
    
    // Only attempt to write to file if NOT on Vercel (production)
    if (process.env.NODE_ENV !== 'production') {
        try {
            fs.appendFileSync(LOG_FILE, `[${time}] ${msg}\n`);
        } catch (err) {
            // Silently fail if filesystem is read-only
        }
    }
}

module.exports = { log, LOG_FILE };
