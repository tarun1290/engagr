const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../../logs/scoop_logs.txt');

function log(msg) {
    const time = new Date().toLocaleString();
    fs.appendFileSync(LOG_FILE, `[${time}] ${msg}\n`);
    console.log(msg);
}

module.exports = { log, LOG_FILE };
