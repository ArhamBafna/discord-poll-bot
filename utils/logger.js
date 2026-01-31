// --- Helper for Timestamped Logs ---
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    if (level === 'ERROR' || level === 'FATAL') {
        console.error(logMessage);
    } else {
        console.log(logMessage);
    }
}

module.exports = { log };
