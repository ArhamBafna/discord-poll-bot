// Tests verify the table helpers produce deterministic, comparable output:
// - stableStringify serializes objects with sorted keys
// - sortRows returns rows in stable order
// - hashSnapshot produces identical hashes for identical data
// - Different data produces different hashes
//
// Run: node --test test/tables.test.js
const assert = require('node:assert');
const crypto = require('crypto');
const { stableStringify, sortRows, hashSnapshot } = require('../tools/db/tables');

// stableStringify must sort keys so equivalent objects hash identically
const a = { b: 1, a: { z: 1, y: 2 } };
const b = { a: { y: 2, z: 1 }, b: 1 };
assert.strictEqual(stableStringify(a), stableStringify(b), 'equivalent objects produce identical strings');

// Different objects must produce different strings
const c = { b: 2, a: { z: 1, y: 2 } };
assert.notStrictEqual(stableStringify(a), stableStringify(c), 'different objects differ');

// sortRows must return rows in stable sorted order
const rows = [{ x: 2 }, { x: 1 }, { x: 3 }];
const sorted = sortRows(rows);
assert.strictEqual(sorted[0].x, 1, 'first row is smallest');
assert.strictEqual(sorted[2].x, 3, 'last row is largest');
assert.strictEqual(sorted.length, 3, 'no rows lost');

// sortRows must not mutate original
assert.strictEqual(rows[0].x, 2, 'original rows unchanged');

// sortRows on empty returns empty
assert.strictEqual(sortRows([]).length, 0, 'empty input gives empty output');

// hashSnapshot must be identical for identical data
const tables = {
    leaderboard: [{ guild_id: 'g', user_id: 'u', score: 0 }],
    kv_store: [{ guild_id: 'g', key: 'k', value: 'v' }],
    question_history: [],
    invites: [],
    command_stats: []
};
const h1 = hashSnapshot(crypto, tables);
const h2 = hashSnapshot(crypto, tables);
assert.strictEqual(h1, h2, 'identical data produces identical hash');

// hashSnapshot must differ when data differs
const tables2 = { ...tables, leaderboard: [{ guild_id: 'g', user_id: 'u', score: 1 }] };
const h3 = hashSnapshot(crypto, tables2);
assert.notStrictEqual(h1, h3, 'different data produces different hash');

// hashSnapshot must be consistent across calls with same inputs
const h4 = hashSnapshot(crypto, tables);
assert.strictEqual(h1, h4, 'repeated calls give same hash');

// Validate known-table list is current and complete
const { KNOWN_TABLES } = require('../tools/db/tables');
assert.deepStrictEqual(KNOWN_TABLES, ['leaderboard', 'kv_store', 'question_history', 'invites', 'command_stats'], 'KNOWN_TABLES matches merged schema');

console.log('tables tests passed');
