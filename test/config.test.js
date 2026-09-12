// Tests verify the config module's public contract:
// - validateConfig() throws on missing required env vars (never exits)
// - getSanitizedDbUrl() strips transaction_timeout from process.env.DATABASE_URL
// - applyNetworkDefaults() is callable without throwing
// - Module exports are functions
//
// Run: node --test test/config.test.js
const assert = require('node:assert');
const config = require('../config/index.js');

// Module exports are functions
assert.strictEqual(typeof config.validateConfig, 'function', 'validateConfig is exported');
assert.strictEqual(typeof config.getSanitizedDbUrl, 'function', 'getSanitizedDbUrl is exported');
assert.strictEqual(typeof config.applyNetworkDefaults, 'function', 'applyNetworkDefaults is exported');

// getSanitizedDbUrl strips transaction_timeout when present
const originalUrl = process.env.DATABASE_URL;
process.env.DATABASE_URL = 'postgres://user:pass@host/db?transaction_timeout=1000';
try {
    const cleaned = config.getSanitizedDbUrl();
    assert.ok(!cleaned.includes('transaction_timeout'), 'transaction_timeout stripped from URL');
    assert.ok(cleaned.includes('postgres://'), 'URL scheme preserved');
} finally {
    process.env.DATABASE_URL = originalUrl;
}

// getSanitizedDbUrl passes through URL without transaction_timeout unchanged
process.env.DATABASE_URL = 'postgres://user:pass@host/db';
try {
    const cleaned = config.getSanitizedDbUrl();
    assert.strictEqual(cleaned, 'postgres://user:pass@host/db', 'clean URL preserved');
} finally {
    process.env.DATABASE_URL = originalUrl;
}

// getSanitizedDbUrl throws on invalid URL
process.env.DATABASE_URL = 'not-a-url';
try {
    config.getSanitizedDbUrl();
    assert.fail('should have thrown');
} catch (e) {
    assert.ok(e.message.includes('not a valid URL'), 'throws on invalid URL');
} finally {
    process.env.DATABASE_URL = originalUrl;
}

// applyNetworkDefaults is callable without throwing
assert.doesNotThrow(config.applyNetworkDefaults, 'applyNetworkDefaults does not throw');

// validateConfig throws when env vars are missing (not exits)
const savedApiKey = process.env.API_KEY;
const savedToken = process.env.DISCORD_BOT_TOKEN;
const savedDb = process.env.DATABASE_URL;
const savedChannels = process.env.TARGET_CHANNEL_IDS;
process.env.API_KEY = '';
process.env.DISCORD_BOT_TOKEN = '';
process.env.DATABASE_URL = '';
process.env.TARGET_CHANNEL_IDS = '';
assert.throws(() => config.validateConfig(), /Missing env/, 'validateConfig throws on missing env');
// Restore env
process.env.API_KEY = savedApiKey;
process.env.DISCORD_BOT_TOKEN = savedToken;
process.env.DATABASE_URL = savedDb;
process.env.TARGET_CHANNEL_IDS = savedChannels;

console.log('config tests passed');
