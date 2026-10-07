const test = require('node:test');
const assert = require('node:assert');
const { hasPostedToday, getNYDateString } = require('../utils/dateUtils');

test('hasPostedToday helper', async (t) => {
    await t.test('returns false when state is missing', () => {
        assert.strictEqual(hasPostedToday(null, '2023-10-25'), false);
        assert.strictEqual(hasPostedToday({}, '2023-10-25'), false);
    });

    await t.test('returns false when lastPollData is missing', () => {
        assert.strictEqual(hasPostedToday({ lastPollData: null }, '2023-10-25'), false);
    });

    await t.test('returns false when createdAt is missing', () => {
        assert.strictEqual(hasPostedToday({ lastPollData: {} }, '2023-10-25'), false);
    });

    await t.test('returns false when createdAt is invalid', () => {
        assert.strictEqual(hasPostedToday({ lastPollData: { createdAt: 'invalid-date' } }, '2023-10-25'), false);
    });

    await t.test('returns false when dates do not match', () => {
        const state = { lastPollData: { createdAt: '2023-10-24T12:00:00Z' } };
        assert.strictEqual(hasPostedToday(state, '2023-10-25'), false);
    });

    await t.test('returns true when NY dates match', () => {
        const dateStr = getNYDateString(new Date());
        const state = { lastPollData: { createdAt: new Date().toISOString() } };
        assert.strictEqual(hasPostedToday(state, dateStr), true);
    });
});
