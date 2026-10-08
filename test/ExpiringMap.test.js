const test = require('node:test');
const assert = require('node:assert');
const ExpiringMap = require('../lib/ExpiringMap');

test('ExpiringMap tests', async (t) => {
    t.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'] });

    await t.test('should set and get a value before it expires', () => {
        const map = new ExpiringMap(5000);
        map.set('user123', { spamCount: 1 });
        const val = map.get('user123');
        assert.deepStrictEqual(val, { spamCount: 1 });
        map.destroy();
    });

    await t.test('should automatically delete value after TTL expires', () => {
        const map = new ExpiringMap(100);
        map.set('user123', 'spamming');
        
        assert.strictEqual(map.get('user123'), 'spamming');
        
        // Advance clock past TTL
        t.mock.timers.tick(150);
        
        // Value should be gone
        assert.strictEqual(map.get('user123'), undefined);
        assert.strictEqual(map.has('user123'), false);
        
        map.destroy();
    });

    await t.test('should not leak memory - size should decrease after expiration', () => {
        const map = new ExpiringMap(100);
        map.set('a', 1);
        map.set('b', 2);
        
        assert.strictEqual(map.size, 2);
        
        t.mock.timers.tick(150);
        
        assert.strictEqual(map.size, 0);
        map.destroy();
    });

    await t.test('should handle rapid updates to the same key correctly', () => {
        const map = new ExpiringMap(200);
        map.set('key', 1);
        
        t.mock.timers.tick(100);
        // Update key before it expires. set() resets the TTL in ExpiringMap.
        map.set('key', 2);
        
        t.mock.timers.tick(150); // Total 250ms since first set, 150ms since second set
        
        // If TTL was reset, it should still be here (150 < 200).
        assert.strictEqual(map.get('key'), 2);
        
        map.destroy();
    });
});
