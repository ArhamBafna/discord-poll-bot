// Unit tests for poll intro messages, @everyone pings, and fallback preservation on catch-up.
// Run: node --test test/posting-messages.test.js
const assert = require('node:assert');
const { getPollIntroMessage } = require('../services/polls/posting');

// 1. Trivia Poll - On-time
const triviaOnTime = getPollIntroMessage({ type: 'trivia', kind: 'AI' }, false);
assert.strictEqual(
    triviaOnTime,
    "@everyone **Today's AI Poll!** 🧠",
    'Trivia on-time message matches expected'
);
assert.ok(triviaOnTime.includes('@everyone'), 'Trivia on-time pings @everyone');
assert.ok(!triviaOnTime.includes('late post'), 'Trivia on-time has no late post text');

// 2. Trivia Poll - Catch-up (Late)
const triviaLate = getPollIntroMessage({ type: 'trivia', kind: 'AI' }, true);
assert.strictEqual(
    triviaLate,
    "@everyone **Today's AI Poll!** 🧠 (It's a late post cuz I missed the set time.)",
    'Trivia late message matches expected'
);
assert.ok(triviaLate.includes('@everyone'), 'Trivia late pings @everyone');
assert.ok(triviaLate.includes("(It's a late post cuz I missed the set time.)"), 'Trivia late contains late notice');

// 3. Discussion Poll - On-time
const discussionOnTime = getPollIntroMessage({ type: 'discussion', kind: 'AI' }, false);
assert.strictEqual(
    discussionOnTime,
    "@everyone **Today's AI Discussion Poll!** 💬 (No right or wrong answer, share your thoughts!)",
    'Discussion on-time message matches expected'
);
assert.ok(discussionOnTime.includes('@everyone'), 'Discussion on-time pings @everyone');
assert.ok(!discussionOnTime.includes('late post'), 'Discussion on-time has no late post text');

// 4. Discussion Poll - Catch-up (Late)
const discussionLate = getPollIntroMessage({ type: 'discussion', kind: 'AI' }, true);
assert.strictEqual(
    discussionLate,
    "@everyone **Today's AI Discussion Poll!** 💬 (No right or wrong answer, share your thoughts! Also it's a late post cuz I missed the set time.)",
    'Discussion late message matches expected'
);
assert.ok(discussionLate.includes('@everyone'), 'Discussion late pings @everyone');
assert.ok(discussionLate.includes("Also it's a late post cuz I missed the set time."), 'Discussion late contains late notice');

// 5. Fallback Poll - On-time
const fallbackOnTime = getPollIntroMessage({ type: 'trivia', kind: 'fallback' }, false);
assert.ok(fallbackOnTime.includes('@everyone **Today\'s AI Poll!** 🧠'), 'Fallback on-time has header');
assert.ok(fallbackOnTime.includes('*(posted using a preset fallback because the AI service was unavailable)*'), 'Fallback on-time includes fallback disclaimer');
assert.ok(!fallbackOnTime.includes('late post'), 'Fallback on-time has no late note');

// 6. Fallback Poll - Catch-up (Late)
const fallbackLate = getPollIntroMessage({ type: 'trivia', kind: 'fallback' }, true);
assert.ok(fallbackLate.includes('@everyone **Today\'s AI Poll!** 🧠 (It\'s a late post cuz I missed the set time.)'), 'Fallback late has late header with @everyone');
assert.ok(fallbackLate.includes('*(posted using a preset fallback because the AI service was unavailable)*'), 'Fallback late ALSO includes fallback disclaimer');

// 7. Relabeling logic check: Fallback kind must not be clobbered by catch-up
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
