// Tests verify all fallback polls comply with Discord limits:
// - Poll answer option text length <= 55 characters
// - Poll question text length <= 300 characters
// Run: node --test test/fallbacks.test.js
const assert = require('node:assert');
const { FALLBACK_POLLS, FALLBACK_DISCUSSION_POLLS } = require('../services/polls/fallbacks');

const allPolls = [...FALLBACK_POLLS, ...FALLBACK_DISCUSSION_POLLS];

for (const poll of allPolls) {
    assert.ok(poll.question && poll.question.length <= 300, `Question "${poll.question}" must not exceed 300 chars`);
    for (const option of poll.options) {
        assert.ok(
            option.length <= 55,
            `Option "${option}" in poll "${poll.question}" exceeds Discord 55-char limit (length: ${option.length})`
        );
    }
}

console.log('fallback limits tests passed');
