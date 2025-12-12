const fs = require('fs');
const path = require('path');

// Create logs directory if not exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

// Format log message
const formatLog = (level, message) => {
    const timestamp = new Date().toISOString();
    const msg = typeof message === 'object' ? JSON.stringify(message) : message;
    return `[${timestamp}] [${level}] ${msg}`;
};

// Write to file
const writeToFile = (filename, content) => {
    const filePath = path.join(logsDir, filename);
    fs.appendFileSync(filePath, content + '\n');
};

// Get today's log filename
const getLogFilename = () => {
    const date = new Date().toISOString().split('T')[0];
    return `${date}.log`;
};

const logger = {
    error: (message) => {
        const log = formatLog(LEVELS.ERROR, message);
        console.error('\x1b[31m%s\x1b[0m', log); // Red
        writeToFile(getLogFilename(), log);
        writeToFile('errors.log', log);
    },

    warn: (message) => {
        const log = formatLog(LEVELS.WARN, message);
        console.warn('\x1b[33m%s\x1b[0m', log); // Yellow
        writeToFile(getLogFilename(), log);
    },

    info: (message) => {
        const log = formatLog(LEVELS.INFO, message);
        console.log('\x1b[36m%s\x1b[0m', log); // Cyan
        writeToFile(getLogFilename(), log);
    },

    debug: (message) => {
        if (process.env.NODE_ENV === 'development') {
            const log = formatLog(LEVELS.DEBUG, message);
            console.log('\x1b[35m%s\x1b[0m', log); // Magenta
        }
    },

    request: (req) => {
        const log = formatLog(LEVELS.INFO, `${req.method} ${req.path} - ${req.ip}`);
        console.log('\x1b[32m%s\x1b[0m', log); // Green
        writeToFile('requests.log', log);
    }
};

module.exports = logger;
