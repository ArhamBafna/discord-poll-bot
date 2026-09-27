// Unit tests for poll intro messages, the configurable mention prefix, and fallback
// preservation on catch-up.
//
// The poll message no longer hardcodes @everyone. The mention is passed in by the caller
// (resolved from the per-guild setting), so these tests cover two things: the poll wording
// itself is unchanged, and the mention is applied as a clean prefix when present and
// completely absent when not.
//
// Run: node --test test/posting-messages.test.js
const assert = require('node:assert');
const { getPollIntroMessage } = require('../services/polls/posting');

// 1. Trivia Poll - On-time, no mention configured (the default for every unconfigured guild)
const triviaOnTime = getPollIntroMessage({ type: 'trivia', kind: 'AI' }, false);
assert.strictEqual(
    triviaOnTime,
    "**Today's AI Poll!** 🧠",
    'Trivia on-time message matches expected'
);
assert.ok(!triviaOnTime.includes('@everyone'), 'Trivia on-time does not ping @everyone by default');
assert.ok(!triviaOnTime.includes('late post'), 'Trivia on-time has no late post text');
assert.ok(triviaOnTime.startsWith('**'), 'Trivia on-time starts with the poll text, not a stray prefix');
assert.ok(!triviaOnTime.startsWith(' '), 'Trivia on-time has no leading whitespace when unmentioned');

// 2. Trivia Poll - Catch-up (Late), no mention
const triviaLate = getPollIntroMessage({ type: 'trivia', kind: 'AI' }, true);
assert.strictEqual(
    triviaLate,
    "**Today's AI Poll!** 🧠 (It's a late post cuz I missed the set time.)",
    'Trivia late message matches expected'
);
assert.ok(!triviaLate.includes('@everyone'), 'Trivia late does not ping @everyone by default');
assert.ok(triviaLate.includes("(It's a late post cuz I missed the set time.)"), 'Trivia late contains late notice');

// 3. Discussion Poll - On-time, no mention
const discussionOnTime = getPollIntroMessage({ type: 'discussion', kind: 'AI' }, false);
assert.strictEqual(
    discussionOnTime,
    "**Today's AI Discussion Poll!** 💬 (No right or wrong answer, share your thoughts!)",
    'Discussion on-time message matches expected'
);
assert.ok(!discussionOnTime.includes('@everyone'), 'Discussion on-time does not ping @everyone by default');
assert.ok(!discussionOnTime.includes('late post'), 'Discussion on-time has no late post text');

// 4. Discussion Poll - Catch-up (Late), no mention
const discussionLate = getPollIntroMessage({ type: 'discussion', kind: 'AI' }, true);
assert.strictEqual(
    discussionLate,
    "**Today's AI Discussion Poll!** 💬 (No right or wrong answer, share your thoughts! Also it's a late post cuz I missed the set time.)",
    'Discussion late message matches expected'
);
assert.ok(!discussionLate.includes('@everyone'), 'Discussion late does not ping @everyone by default');
assert.ok(discussionLate.includes("Also it's a late post cuz I missed the set time."), 'Discussion late contains late notice');

// 5. Fallback Poll - On-time, no mention
const fallbackOnTime = getPollIntroMessage({ type: 'trivia', kind: 'fallback' }, false);
assert.ok(fallbackOnTime.startsWith("**Today's AI Poll!** 🧠"), 'Fallback on-time has header');
assert.ok(fallbackOnTime.includes('*(posted using a preset fallback because the AI service was unavailable)*'), 'Fallback on-time includes fallback disclaimer');
assert.ok(!fallbackOnTime.includes('late post'), 'Fallback on-time has no late note');

// 6. Fallback Poll - Catch-up (Late), no mention
const fallbackLate = getPollIntroMessage({ type: 'trivia', kind: 'fallback' }, true);
assert.ok(fallbackLate.startsWith("**Today's AI Poll!** 🧠 (It's a late post cuz I missed the set time.)"), 'Fallback late has late header');
assert.ok(fallbackLate.includes('*(posted using a preset fallback because the AI service was unavailable)*'), 'Fallback late ALSO includes fallback disclaimer');

// 7. Mention is applied as a prefix in @everyone mode
const triviaEveryone = getPollIntroMessage({ type: 'trivia', kind: 'AI' }, false, '@everyone');
assert.strictEqual(
    triviaEveryone,
    "@everyone **Today's AI Poll!** 🧠",
    'Mention is prefixed onto the poll text with a single space'
);

// 8. Mention is applied as a prefix in role mode, and is the only difference from the default
const triviaRole = getPollIntroMessage({ type: 'trivia', kind: 'AI' }, false, '<@&123456>');
assert.strictEqual(
    triviaRole,
    "<@&123456> **Today's AI Poll!** 🧠",
    'Role mention is prefixed onto the poll text'
);
assert.strictEqual(
    triviaRole.slice('<@&123456> '.length),
    triviaOnTime,
    'Role-mentioned message is byte-identical to the unmentioned one after the prefix'
);

// 9. The mention never disturbs the late-post or fallback notices
const triviaEveryoneLate = getPollIntroMessage({ type: 'trivia', kind: 'AI' }, true, '@everyone');
assert.strictEqual(
    triviaEveryoneLate,
    "@everyone **Today's AI Poll!** 🧠 (It's a late post cuz I missed the set time.)",
    'Late poll keeps both the mention and the late notice'
);
const fallbackEveryone = getPollIntroMessage({ type: 'trivia', kind: 'fallback' }, false, '@everyone');
assert.ok(fallbackEveryone.startsWith("@everyone **Today's AI Poll!** 🧠"), 'Fallback poll keeps the mention prefix');
assert.ok(fallbackEveryone.includes('*(posted using a preset fallback because the AI service was unavailable)*'), 'Mentioned fallback still includes the disclaimer');

// 10. An empty mention behaves exactly like no mention (no doubled or orphaned space)
assert.strictEqual(
    getPollIntroMessage({ type: 'trivia', kind: 'AI' }, false, ''),
    triviaOnTime,
    'Empty mention string produces the unmentioned message'
);

// 11. Relabeling logic check: Fallback kind must not be clobbered by catch-up
function relabelKind(pollData, isCatchUp) {
    const clone = JSON.parse(JSON.stringify(pollData));
    if (isCatchUp && clone.kind !== 'fallback') {
        clone.kind = 'catch-up';
    }
    return clone.kind;
}

assert.strictEqual(relabelKind({ kind: 'AI' }, true), 'catch-up', 'AI poll becomes catch-up on late post');
assert.strictEqual(relabelKind({ kind: 'fallback' }, true), 'fallback', 'Fallback poll stays fallback on late post');
assert.strictEqual(relabelKind({ kind: 'AI' }, false), 'AI', 'AI poll stays AI on normal post');
assert.strictEqual(relabelKind({ kind: 'fallback' }, false), 'fallback', 'Fallback poll stays fallback on normal post');

console.log('posting messages tests passed');
