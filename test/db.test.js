// Consolidated database tests: storage codecs and backup snapshot validation
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { CODECS, isSettingsKey, parseStoredValue, serializeStoredValue } = require('../database/codecs');
const { stableStringify, sortRows, hashSnapshot, KNOWN_TABLES } = require('../tools/db/tables');

test('db: codec serialization and parsing', () => {
    // Required settings coverage
    const requiredSettings = [
        'inviteRewardPoints', 'lastPollData', 'activeOnDemandPoll',
        'lastSuccessfulPoll', 'lastWeeklyLeaderboard', 'roleMilestones',
        'ccUser', 'welcomeTemplate', 'controlRole',
        'lastEngagementPostGeneral', 'lastEngagementPostTeam'
    ];
    for (const key of requiredSettings) {
        assert.ok(CODECS[key], `CODECS has entry for ${key}`);
    }

    const POLL = { question: 'What is AI?', options: ['A', 'B'] };

    // Finite-number check: 0 stays 0
    assert.strictEqual(parseStoredValue('inviteRewardPoints', '0'), 0);
    assert.strictEqual(parseStoredValue('inviteRewardPoints', 0), 0);
    assert.strictEqual(parseStoredValue('inviteRewardPoints', null), 1);
    assert.strictEqual(parseStoredValue('inviteRewardPoints', 'abc'), 1);

    assert.strictEqual(serializeStoredValue('inviteRewardPoints', 0), '0');
    assert.strictEqual(serializeStoredValue('inviteRewardPoints', 5), '5');

    // Objects round-trip through JSON
    const serialized = serializeStoredValue('lastPollData', POLL);
    assert.strictEqual(typeof serialized, 'string');
    const parsed = parseStoredValue('lastPollData', serialized);
    assert.deepStrictEqual(parsed, POLL);

    // Double-encoded JSON unwraps to object
    const doubleEncoded = '{"question":"What is AI?"}';
    assert.strictEqual(typeof parseStoredValue('lastPollData', doubleEncoded), 'object');

    // Knowledge topics stay plain text
    assert.strictEqual(isSettingsKey('mission'), false);
    assert.strictEqual(isSettingsKey('ccUser'), true);
    assert.strictEqual(parseStoredValue('mission', 'plain human text'), 'plain human text');
    assert.strictEqual(parseStoredValue('mission', 42), '42');

    // Null settings fall back to declared defaults
    assert.strictEqual(parseStoredValue('activeOnDemandPoll', null), null);
    assert.deepStrictEqual(parseStoredValue('roleMilestones', null), {});
    assert.strictEqual(parseStoredValue('controlRole', null), null);

    // pollMention codec
    assert.strictEqual(isSettingsKey('pollMention'), true);
    const MENTION = { mode: 'role', roleId: '1234567890' };
    const mentionRoundTrip = parseStoredValue('pollMention', serializeStoredValue('pollMention', MENTION));
    assert.deepStrictEqual(mentionRoundTrip, MENTION);
    assert.strictEqual(parseStoredValue('pollMention', null), null);
    assert.strictEqual(parseStoredValue('pollMention', 'corrupt-not-json'), null);
});

test('db: backup snapshotting and table sorting (in-memory)', () => {
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

    function validateSnapshots(before, after) {
        let pass = true;
        for (const t of KNOWN_TABLES) {
            const ha = hashSnapshot(crypto, { [t]: before.data[t] || [] });
            const hb = hashSnapshot(crypto, { [t]: after.data[t] || [] });
            if (ha !== hb) pass = false;
        }
        return { pass, overallA: before.hash, overallB: after.hash };
    }

    // Schema verification
    assert.strictEqual(KNOWN_TABLES.length, 5);
    assert.ok(KNOWN_TABLES.includes('kv_store'));
    assert.ok(!KNOWN_TABLES.includes('state'));
    assert.ok(!KNOWN_TABLES.includes('knowledge_base'));

    // Snapshot structure
    const snap = makeSnapshot({ leaderboard: [{ guild_id: 'g', user_id: 'u', score: 0 }] });
    assert.ok(snap.meta && snap.schema && snap.data && snap.hash);
    assert.strictEqual(snap.hash.length, 64);

    // Identical snapshots pass validation
    const clone = JSON.parse(JSON.stringify(snap));
    const result1 = validateSnapshots(snap, clone);
    assert.strictEqual(result1.pass, true);
    assert.strictEqual(result1.overallA, result1.overallB);

    // Different snapshots fail validation
    const snapDiff = makeSnapshot({ leaderboard: [{ guild_id: 'g', user_id: 'u', score: 1 }] });
    const result2 = validateSnapshots(snap, snapDiff);
    assert.strictEqual(result2.pass, false);

    // Key sorting & row sorting
    const a = { b: 1, a: { z: 1, y: 2 } };
    const b = { a: { y: 2, z: 1 }, b: 1 };
    assert.strictEqual(stableStringify(a), stableStringify(b));

    const rows = [{ x: 2 }, { x: 1 }, { x: 3 }];
    const sorted = sortRows(rows);
    assert.strictEqual(sorted[0].x, 1);
    assert.strictEqual(sorted[2].x, 3);
    assert.strictEqual(rows[0].x, 2);
    assert.strictEqual(sortRows([]).length, 0);

    // Round trip
    const original = { leaderboard: [{ guild_id: 'g', user_id: 'u', score: 0 }] };
    assert.deepStrictEqual(JSON.parse(stableStringify(original)), original);
});
