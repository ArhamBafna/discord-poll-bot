// Tests verify the database operations module structure:
// - All exported functions exist and are functions
// - Codec registry has entries for all settings keys used by the bot
// - Knowledge keys are NOT in CODECS (stored as plain text)
// - parseStoredValue round-trips objects correctly
// - Non-settings keys pass through as plain strings
//
// Run: node --test test/db-operations.test.js
const assert = require('node:assert');
const codecs = require('../database/codecs.js');

// All codec functions are exported
assert.strictEqual(typeof codecs.parseStoredValue, 'function', 'parseStoredValue is a function');
assert.strictEqual(typeof codecs.serializeStoredValue, 'function', 'serializeStoredValue is a function');
assert.strictEqual(typeof codecs.isSettingsKey, 'function', 'isSettingsKey is a function');
assert.strictEqual(typeof codecs.CODECS, 'object', 'CODECS registry exists');

// CODECS registry covers all settings keys used by the bot
const { CODECS } = codecs;
const knownSettingsKeys = Object.keys(CODECS);
assert.ok(knownSettingsKeys.length >= 10, 'at least 10 settings codec entries');
const requiredSettings = ['inviteRewardPoints', 'lastPollData', 'activeOnDemandPoll', 'lastSuccessfulPoll', 'lastWeeklyLeaderboard', 'roleMilestones', 'ccUser', 'welcomeTemplate', 'controlRole', 'lastEngagementPostGeneral', 'lastEngagementPostTeam'];
for (const key of requiredSettings) {
    assert.ok(CODECS[key], `CODECS has entry for ${key}`);
}

// Knowledge topic keys are NOT settings keys
assert.strictEqual(codecs.isSettingsKey('mission'), false, 'knowledge key is not a settings key');
assert.strictEqual(codecs.isSettingsKey('topic-about-ai'), false, 'any knowledge key is not a settings key');

// Settings keys ARE settings keys
assert.strictEqual(codecs.isSettingsKey('inviteRewardPoints'), true, 'inviteRewardPoints is a settings key');
assert.strictEqual(codecs.isSettingsKey('lastPollData'), true, 'lastPollData is a settings key');

// parseStoredValue for knowledge key returns plain string
const plain = codecs.parseStoredValue('mission', 'plain human readable text');
assert.strictEqual(plain, 'plain human readable text', 'knowledge text preserved as string');

// parseStoredValue with numeric non-string knowledge coerces to string
const numericKnowledge = codecs.parseStoredValue('mission', 42);
assert.strictEqual(typeof numericKnowledge, 'string', 'numeric knowledge coerced to string');
assert.strictEqual(numericKnowledge, '42', 'number 42 becomes string "42"');

// parseStoredValue for settings key round-trips objects
const pollObj = { question: 'What is AI?', options: ['A', 'B'] };
const serialized = codecs.serializeStoredValue('lastPollData', pollObj);
const parsed = codecs.parseStoredValue('lastPollData', serialized);
assert.deepStrictEqual(parsed, pollObj, 'settings object round-trips to identical object');
assert.strictEqual(typeof parsed, 'object', 'parsed is object, not string');

// parseStoredValue for settings key with double-encoded string unwraps to object
const doubleEncoded = '{"question":"What is AI?"}';
const doubleParsed = codecs.parseStoredValue('lastPollData', doubleEncoded);
assert.strictEqual(typeof doubleParsed, 'object', 'double-encoded string unwraps to object');

// inviteRewardPoints: 0 stays 0 (finite-number check)
assert.strictEqual(codecs.parseStoredValue('inviteRewardPoints', '0'), 0, 'string "0" parses to number 0');
assert.strictEqual(codecs.parseStoredValue('inviteRewardPoints', 0), 0, 'number 0 stays 0');
assert.strictEqual(codecs.parseStoredValue('inviteRewardPoints', null), 1, 'null falls back to default 1');
assert.strictEqual(codecs.parseStoredValue('inviteRewardPoints', 'abc'), 1, 'non-finite falls back to default 1');

// serializeInviteRewardPoints: 0 serializes to '0', not '' or '1'
assert.strictEqual(codecs.serializeStoredValue('inviteRewardPoints', 0), '0', '0 serializes to string "0"');
assert.strictEqual(codecs.serializeStoredValue('inviteRewardPoints', 5), '5', '5 serializes to string "5"');

// roleMilestones null falls back to {}
assert.deepStrictEqual(codecs.parseStoredValue('roleMilestones', null), {}, 'null milestones falls back to {}');

// serializeStoredValue on knowledge key returns string
assert.strictEqual(typeof codecs.serializeStoredValue('mission', 'hello'), 'string', 'knowledge serializes to string');

console.log('db-operations module tests passed');
