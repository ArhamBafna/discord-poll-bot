// Consolidated utilities tests: ExpiringMap, dateUtils, config validation
const test = require('node:test');
const assert = require('node:assert');
const ExpiringMap = require('../lib/ExpiringMap');
const { hasPostedToday, getNYDateString } = require('../utils/dateUtils');
const config = require('../config/index.js');

test('utils: ExpiringMap cache TTL and expiration', async (t) => {
    t.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'] });

    await t.test('sets and gets value before expiry', () => {
        const map = new ExpiringMap(5000);
        map.set('user123', { spamCount: 1 });
        assert.deepStrictEqual(map.get('user123'), { spamCount: 1 });
        map.destroy();
    });

    await t.test('deletes value after TTL expires', () => {
        const map = new ExpiringMap(100);
        map.set('user123', 'spamming');
        assert.strictEqual(map.get('user123'), 'spamming');
        t.mock.timers.tick(150);
        assert.strictEqual(map.get('user123'), undefined);
        assert.strictEqual(map.has('user123'), false);
        map.destroy();
    });

    await t.test('decreases size after expiration', () => {
        const map = new ExpiringMap(100);
        map.set('a', 1);
        map.set('b', 2);
        assert.strictEqual(map.size, 2);
        t.mock.timers.tick(150);
        assert.strictEqual(map.size, 0);
        map.destroy();
    });

    await t.test('resets TTL on rapid update', () => {
        const map = new ExpiringMap(200);
        map.set('key', 1);
        t.mock.timers.tick(100);
        map.set('key', 2);
        t.mock.timers.tick(150);
        assert.strictEqual(map.get('key'), 2);
        map.destroy();
    });
});

test('utils: dateUtils hasPostedToday logic', () => {
    assert.strictEqual(hasPostedToday(null, '2023-10-25'), false);
    assert.strictEqual(hasPostedToday({}, '2023-10-25'), false);
    assert.strictEqual(hasPostedToday({ lastPollData: null }, '2023-10-25'), false);
    assert.strictEqual(hasPostedToday({ lastPollData: {} }, '2023-10-25'), false);
    assert.strictEqual(hasPostedToday({ lastPollData: { createdAt: 'invalid-date' } }, '2023-10-25'), false);

    const yesterdayState = { lastPollData: { createdAt: '2023-10-24T12:00:00Z' } };
    assert.strictEqual(hasPostedToday(yesterdayState, '2023-10-25'), false);

    const todayStr = getNYDateString(new Date());
    const todayState = { lastPollData: { createdAt: new Date().toISOString() } };
    assert.strictEqual(hasPostedToday(todayState, todayStr), true);
});

test('utils: config validation and database URL sanitation', () => {
    assert.strictEqual(typeof config.validateConfig, 'function');
    assert.strictEqual(typeof config.getSanitizedDbUrl, 'function');
    assert.strictEqual(typeof config.applyNetworkDefaults, 'function');

    const originalUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgres://user:pass@host/db?transaction_timeout=1000';
    try {
        const cleaned = config.getSanitizedDbUrl();
        assert.ok(!cleaned.includes('transaction_timeout'), 'transaction_timeout stripped from URL');
        assert.ok(cleaned.includes('postgres://'), 'URL scheme preserved');
    } finally {
        process.env.DATABASE_URL = originalUrl;
    }

    process.env.DATABASE_URL = 'postgres://user:pass@host/db';
    try {
        const cleaned = config.getSanitizedDbUrl();
        assert.strictEqual(cleaned, 'postgres://user:pass@host/db');
    } finally {
        process.env.DATABASE_URL = originalUrl;
    }

    process.env.DATABASE_URL = 'not-a-url';
    try {
        config.getSanitizedDbUrl();
        assert.fail('should have thrown');
    } catch (e) {
        assert.ok(e.message.includes('not a valid URL'));
    } finally {
        process.env.DATABASE_URL = originalUrl;
    }

    assert.doesNotThrow(config.applyNetworkDefaults);

    const savedApiKey = process.env.API_KEY;
    const savedToken = process.env.DISCORD_BOT_TOKEN;
    const savedDb = process.env.DATABASE_URL;
    process.env.API_KEY = '';
    process.env.DISCORD_BOT_TOKEN = '';
    process.env.DATABASE_URL = '';
    assert.throws(() => config.validateConfig(), /Missing env/);
    process.env.API_KEY = savedApiKey;
    process.env.DISCORD_BOT_TOKEN = savedToken;
    process.env.DATABASE_URL = savedDb;
});
