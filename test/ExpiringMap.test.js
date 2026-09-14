const test = require('node:test');
const assert = require('node:assert');
const { setTimeout } = require('node:timers/promises');
const ExpiringMap = require('../lib/ExpiringMap');

test('ExpiringMap tests', async (t) => {
    
    await t.test('should set and get a value before it expires', () => {
        const map = new ExpiringMap(5000);
        map.set('user123', { spamCount: 1 });
        const val = map.get('user123');
        assert.deepStrictEqual(val, { spamCount: 1 });
        map.destroy();
    });

    await t.test('should automatically delete value after TTL expires', async () => {
        // We set a very short TTL of 100ms for testing
        const map = new ExpiringMap(100);
        map.set('user123', 'spamming');
        
        assert.strictEqual(map.get('user123'), 'spamming');
        
        // Wait for TTL to expire
        await setTimeout(150);
        
        // Value should be gone
        assert.strictEqual(map.get('user123'), undefined);
        assert.strictEqual(map.has('user123'), false);
        
        map.destroy();
    });

    await t.test('should not leak memory - size should decrease after expiration', async () => {
        const map = new ExpiringMap(100);
        map.set('a', 1);
        map.set('b', 2);
        
        assert.strictEqual(map.size, 2);
        
        await setTimeout(150);
        
        assert.strictEqual(map.size, 0);
        map.destroy();
    });

    await t.test('should handle rapid updates to the same key correctly', async () => {
        const map = new ExpiringMap(200);
        map.set('key', 1);
        
        await setTimeout(100);
        // Update key before it expires. Should reset or respect TTL based on implementation.
        // Usually, set() resets the TTL in an ExpiringMap.
        map.set('key', 2);
        
        await setTimeout(150); // Total 250ms since first set, 150ms since second set
        
        // If TTL was reset, it should still be here (150 < 200). 
        // If we didn't implement TTL reset correctly, this will fail! (Error should arise if code is naive)
        assert.strictEqual(map.get('key'), 2);
        
        map.destroy();
    });
});
