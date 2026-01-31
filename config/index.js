// --- Configuration & Environment Variables ---

// --- Network Hardening & IPv4 Enforcement ---
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

// --- Environment Variables ---
const GEMINI_API_KEY = process.env.API_KEY;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const TARGET_CHANNEL_IDS = process.env.TARGET_CHANNEL_IDS ? process.env.TARGET_CHANNEL_IDS.split(',').map(id => id.trim()) : [];
const DATABASE_URL = process.env.DATABASE_URL;
const ALLOWED_USERNAME = 'ar_him';
const CONTROL_ROLE_NAME = 'bot-control';

// --- Critical Environment Variable Check ---
if (!GEMINI_API_KEY || !DISCORD_BOT_TOKEN || !TARGET_CHANNEL_IDS.length || !DATABASE_URL) {
    console.error("CRITICAL ERROR: Make sure API_KEY, DISCORD_BOT_TOKEN, DATABASE_URL, and TARGET_CHANNEL_IDS are set in your environment variables. TARGET_CHANNEL_IDS should be a comma-separated list.");
    process.exit(1);
}

// --- Database Connection Sanitization ---
let sanitizedDbUrl = DATABASE_URL;
try {
    const dbUrl = new URL(DATABASE_URL);
    if (dbUrl.searchParams.has('transaction_timeout')) {
        dbUrl.searchParams.delete('transaction_timeout');
        sanitizedDbUrl = dbUrl.toString();
        console.log('[DATABASE] Removed unsupported "transaction_timeout" parameter from DB connection string.');
    }
} catch (e) {
    console.error('[DATABASE] Could not parse DATABASE_URL. Using it as is.', e);
}

module.exports = {
    GEMINI_API_KEY,
    DISCORD_BOT_TOKEN,
    TARGET_CHANNEL_IDS,
    DATABASE_URL: sanitizedDbUrl,
    ALLOWED_USERNAME,
    CONTROL_ROLE_NAME
};
