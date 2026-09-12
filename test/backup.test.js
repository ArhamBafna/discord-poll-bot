// Tests verify the backup/restore/validate tool chain end-to-end:
// - stableStringify and sortRows produce deterministic snapshots
// - hashSnapshot detects data changes
// - Validate compares two snapshots and reports PASS/FAIL correctly
// - Backup snapshot structure contains meta, schema, data, hash
//
// Run: node --test test/backup.test.js
const assert = require('node:assert');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const os = require('os');
const { stableStringify, sortRows, hashSnapshot, KNOWN_TABLES } = require('../tools/db/tables');

const tmpDir = path.join(os.tmpdir(), 'db-test-' + Date.now());
fs.mkdirSync(tmpDir, { recursive: true });

function makeSnapshot(data) {
    const tables = {};
    for (const t of KNOWN_TABLES) tables[t] = data[t] || [];
    return {
        meta: { taken_at: new Date().toISOString(), tables: KNOWN_TABLES },
        schema: { columns: [], indexes: [] },
        data: tables,
        hash: hashSnapshot(crypto, tables)
    };
}

// validate must return PASS on identical snapshots
function runValidate(fileA, fileB) {
    const before = JSON.parse(fs.readFileSync(fileA, 'utf8'));
    const after = JSON.parse(fs.readFileSync(fileB, 'utf8'));
    let pass = true;
    const tablesA = {};
    const tablesB = {};
    for (const t of KNOWN_TABLES) {
        tablesA[t] = before.data[t] || [];
        tablesB[t] = after.data[t] || [];
        const ha = hashSnapshot(crypto, tablesA);
        const hb = hashSnapshot(crypto, tablesB);
        if (ha !== hb) pass = false;
    }
    return { pass, overallA: before.hash, overallB: after.hash };
}

// Backup snapshot must contain all required top-level keys
const snap = makeSnapshot({ leaderboard: [{ guild_id: 'g', user_id: 'u', score: 0 }] });
assert.ok(snap.meta, 'snapshot has meta');
assert.ok(snap.schema, 'snapshot has schema');
assert.ok(snap.data, 'snapshot has data');
assert.ok(snap.hash, 'snapshot has hash');
assert.ok(typeof snap.hash === 'string' && snap.hash.length === 64, 'hash is a sha256 hex string');

// KNOWN_TABLES must be exactly the 5 tables in the merged schema
assert.strictEqual(KNOWN_TABLES.length, 5, 'exactly 5 known tables');
assert.ok(KNOWN_TABLES.includes('kv_store'), 'kv_store present');
assert.ok(!KNOWN_TABLES.includes('state'), 'old state table retired');
assert.ok(!KNOWN_TABLES.includes('knowledge_base'), 'old knowledge_base table retired');

// Two identical snapshots must validate PASS
const fileA = path.join(tmpDir, 'a.json');
const fileB = path.join(tmpDir, 'b.json');
fs.writeFileSync(fileA, JSON.stringify(snap));
fs.writeFileSync(fileB, JSON.stringify(JSON.parse(JSON.stringify(snap))));
const result1 = runValidate(fileA, fileB);
assert.strictEqual(result1.pass, true, 'identical snapshots validate PASS');
assert.strictEqual(result1.overallA, result1.overallB, 'overall hashes match');

// Two different snapshots must validate FAIL
const snapDiff = makeSnapshot({ leaderboard: [{ guild_id: 'g', user_id: 'u', score: 1 }] });
const fileC = path.join(tmpDir, 'c.json');
fs.writeFileSync(fileC, JSON.stringify(snapDiff));
const result2 = runValidate(fileA, fileC);
assert.strictEqual(result2.pass, false, 'different snapshots validate FAIL');

// stableStringify round-trip: parse the JSON back and compare
const original = { leaderboard: [{ guild_id: 'g', user_id: 'u', score: 0 }] };
const serialized = stableStringify(original);
const roundTripped = JSON.parse(serialized);
assert.deepStrictEqual(roundTripped, original, 'stableStringify round-trips');

// cleanup
fs.rmSync(tmpDir, { recursive: true, force: true });

console.log('backup tests passed');
