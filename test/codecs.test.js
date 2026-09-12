// Tests verify the codec registry round-trips correctly:
// - 0 stays 0 (finite-number check)
// - objects parse back as objects, not strings
// - knowledge topics stay plain text
// - non-settings keys are plain text
// - missing values fall back to declared defaults
//
// Run: node --test test/codecs.test.js
const assert = require('node:assert');
const { CODECS, isSettingsKey, parseStoredValue, serializeStoredValue } = require('../database/codecs');

const POLL = { question: 'What is AI?', options: ['A', 'B'] };

// parseStoredValue('inviteRewardPoints', '0') must be number 0, not 1 or falsy
assert.strictEqual(parseStoredValue('inviteRewardPoints', '0'), 0, 'string 0 parses to number 0');
assert.strictEqual(parseStoredValue('inviteRewardPoints', 0), 0, 'number 0 stays 0');
assert.strictEqual(parseStoredValue('inviteRewardPoints', null), 1, 'null falls back to declared default 1');
assert.strictEqual(parseStoredValue('inviteRewardPoints', 'abc'), 1, 'non-finite falls back to default');

// serializeInviteRewardPoints(0) must produce '0', not '' or '1'
assert.strictEqual(serializeStoredValue('inviteRewardPoints', 0), '0', '0 serializes to string "0"');
assert.strictEqual(serializeStoredValue('inviteRewardPoints', 5), '5', '5 serializes to string "5"');

// Objects round-trip through JSON: parse back as real object, not string
const serialized = serializeStoredValue('lastPollData', POLL);
assert.strictEqual(typeof serialized, 'string', 'serialize returns string');
const parsed = parseStoredValue('lastPollData', serialized);
assert.deepStrictEqual(parsed, POLL, 'object round-trips to identical object');
assert.strictEqual(typeof parsed, 'object', 'parsed value is object, not string');

// Double-encoded string (old JSONB holding a JSON string) parses to object
const doubleEncoded = '{"question":"What is AI?"}';
const doubleParsed = parseStoredValue('lastPollData', doubleEncoded);
assert.strictEqual(typeof doubleParsed, 'object', 'double-encoded string unwraps to object');

// Knowledge topics (non-settings keys) stay plain text
assert.strictEqual(isSettingsKey('mission'), false, 'knowledge key is not a settings key');
assert.strictEqual(isSettingsKey('ccUser'), true, 'settings key is a settings key');
assert.strictEqual(parseStoredValue('mission', 'plain human text'), 'plain human text', 'knowledge text preserved');
assert.strictEqual(parseStoredValue('mission', 42), '42', 'non-string knowledge coerced to string');

// Null settings fall back to declared defaults, not undefined or 1
assert.strictEqual(parseStoredValue('activeOnDemandPoll', null), null, 'null poll falls back to null default');
assert.deepStrictEqual(parseStoredValue('roleMilestones', null), {}, 'null milestones falls back to {}');
assert.strictEqual(parseStoredValue('controlRole', null), null, 'null controlRole falls back to null');

// serializeStoredValue on a knowledge key returns a string
assert.strictEqual(typeof serializeStoredValue('mission', 'hello'), 'string', 'knowledge serializes to string');

console.log('codecs tests passed');
