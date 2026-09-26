try {
    process.loadEnvFile();
} catch (e) {
    // Ignore if environment variables already set or file not found
}

const GEMINI_API_KEY = process.env.API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const TARGET_CHANNEL_IDS = process.env.TARGET_CHANNEL_IDS ? process.env.TARGET_CHANNEL_IDS.split(',').map(id => id.trim()) : [];
const DATABASE_URL = process.env.DATABASE_URL;
const ALLOWED_USERNAME = 'ar_him';
const CONTROL_ROLE_NAME = 'bot-control';

function applyNetworkDefaults() {
    const dns = require('dns');
    dns.setDefaultResultOrder('ipv4first');
}

function validateConfig() {
    const channelIds = process.env.TARGET_CHANNEL_IDS ? process.env.TARGET_CHANNEL_IDS.split(',').map(id => id.trim()).filter(Boolean) : [];
    if (!process.env.API_KEY || !process.env.DISCORD_BOT_TOKEN || !channelIds.length || !process.env.DATABASE_URL) {
        throw new Error('Missing env: set API_KEY, DISCORD_BOT_TOKEN, DATABASE_URL, and TARGET_CHANNEL_IDS (comma-separated list).');
    }
}

function getSanitizedDbUrl() {
    const url = process.env.DATABASE_URL;
    try {
        const dbUrl = new URL(url);
        if (dbUrl.searchParams.has('transaction_timeout')) {
            dbUrl.searchParams.delete('transaction_timeout');
            return dbUrl.toString();
        }
    } catch (e) {
        throw new Error('DATABASE_URL is not a valid URL.');
    }
    return url;
}

module.exports = {
    GEMINI_API_KEY,
    OPENROUTER_API_KEY,
    DISCORD_BOT_TOKEN,
    TARGET_CHANNEL_IDS,
    DATABASE_URL,
    getSanitizedDbUrl,
    ALLOWED_USERNAME,
    CONTROL_ROLE_NAME,
    applyNetworkDefaults,
    validateConfig
};
