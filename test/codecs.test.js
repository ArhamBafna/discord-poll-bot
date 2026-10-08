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

// CODECS registry covers all settings keys used by the bot
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

// pollMention is a settings key, not a knowledge topic. This matters beyond tidiness:
// loadStateForGuild routes any key missing from the registry into the knowledge base,
// so an unregistered pollMention would be fed to the AI as a "topic" on every load.
assert.strictEqual(isSettingsKey('pollMention'), true, 'pollMention is registered as a settings key');
const MENTION = { mode: 'role', roleId: '1234567890' };
const mentionRoundTrip = parseStoredValue('pollMention', serializeStoredValue('pollMention', MENTION));
assert.deepStrictEqual(mentionRoundTrip, MENTION, 'pollMention round-trips to an identical object');
assert.strictEqual(typeof mentionRoundTrip, 'object', 'pollMention parses to an object, not a string');
assert.strictEqual(parseStoredValue('pollMention', null), null, 'unset pollMention falls back to null, meaning silent');
assert.strictEqual(parseStoredValue('pollMention', 'corrupt-not-json'), null, 'unparseable pollMention falls back to silent');

console.log('codecs tests passed');
