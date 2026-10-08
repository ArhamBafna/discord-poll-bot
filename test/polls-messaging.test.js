// Consolidated tests for poll messages, mention resolution, and Discord limits
const test = require('node:test');
const assert = require('node:assert');
const { resolvePollMention, applyPollMention, describePollMention } = require('../lib/mentions');
const { getPollIntroMessage } = require('../services/polls/posting');
const { FALLBACK_POLLS, FALLBACK_DISCUSSION_POLLS } = require('../services/polls/fallbacks');

const ROLE_ID = '1234567890';

function fakeChannel({ existingRoleIds = [ROLE_ID], canMentionEveryone = true } = {}) {
    const roles = new Map(existingRoleIds.map(id => [id, { id, name: 'Fake Role' }]));
    return {
        id: 'channel-1',
        guild: {
            id: 'guild-1',
            members: { me: { id: 'bot-1' } },
            roles: { cache: roles }
        },
        permissionsFor: () => ({ has: () => canMentionEveryone })
    };
}

test('polls: mention resolver degradation and formatting', () => {
    // Silent by default
    assert.strictEqual(resolvePollMention({}, fakeChannel()), '');
    assert.strictEqual(resolvePollMention(null, fakeChannel()), '');
    assert.strictEqual(resolvePollMention({ pollMention: null }, fakeChannel()), '');
    assert.strictEqual(resolvePollMention({ pollMention: { mode: 'none', roleId: null } }, fakeChannel()), '');
    assert.strictEqual(resolvePollMention({ pollMention: { mode: 'none', roleId: ROLE_ID } }, fakeChannel()), '');

    // everyone mode
    assert.strictEqual(resolvePollMention({ pollMention: { mode: 'everyone' } }, fakeChannel()), '@everyone');
    assert.strictEqual(resolvePollMention({ pollMention: { mode: 'everyone' } }, fakeChannel({ canMentionEveryone: false })), '');
    assert.strictEqual(resolvePollMention({ pollMention: { mode: 'everyone', roleId: ROLE_ID } }, fakeChannel()), '@everyone');

    // role mode
    assert.strictEqual(resolvePollMention({ pollMention: { mode: 'role', roleId: ROLE_ID } }, fakeChannel()), `<@&${ROLE_ID}>`);
    assert.strictEqual(resolvePollMention({ pollMention: { mode: 'role', roleId: ROLE_ID } }, fakeChannel({ existingRoleIds: [] })), '');
    assert.strictEqual(resolvePollMention({ pollMention: { mode: 'role', roleId: null } }, fakeChannel()), '');
    assert.strictEqual(resolvePollMention({ pollMention: { mode: 'role', roleId: ROLE_ID } }, null), '');

    // unknown / corrupt settings
    assert.strictEqual(resolvePollMention({ pollMention: { mode: 'nonsense' } }, fakeChannel()), '');
    assert.strictEqual(resolvePollMention({ pollMention: 'everyone' }, fakeChannel()), '');

    // applyPollMention
    const INTRO = '**Special On-Demand Poll!**';
    assert.strictEqual(applyPollMention(INTRO, '@everyone'), '@everyone **Special On-Demand Poll!**');
    assert.strictEqual(applyPollMention(INTRO, '<@&123>'), '<@&123> **Special On-Demand Poll!**');
    assert.strictEqual(applyPollMention(INTRO, ''), INTRO);

    // describePollMention
    assert.strictEqual(describePollMention(null), 'Off');
    assert.strictEqual(describePollMention({ mode: 'none' }), 'Off');
    assert.strictEqual(describePollMention({ mode: 'everyone' }), '@everyone');
    assert.strictEqual(describePollMention({ mode: 'role', roleId: ROLE_ID }), `<@&${ROLE_ID}>`);
    assert.strictEqual(describePollMention({ mode: 'role', roleId: null }), 'Off');
});

test('polls: intro messages and fallback compliance', () => {
    // Trivia on-time
    const triviaOnTime = getPollIntroMessage({ type: 'trivia', kind: 'AI' }, false);
    assert.strictEqual(triviaOnTime, "**Today's AI Poll!** 🧠");
    assert.ok(!triviaOnTime.includes('@everyone'));

    // Trivia late
    const triviaLate = getPollIntroMessage({ type: 'trivia', kind: 'AI' }, true);
    assert.strictEqual(triviaLate, "**Today's AI Poll!** 🧠 (It's a late post cuz I missed the set time.)");

    // Discussion on-time and late
    const discussionOnTime = getPollIntroMessage({ type: 'discussion', kind: 'AI' }, false);
    assert.ok(discussionOnTime.includes("**Today's AI Discussion Poll!** 💬"));
    const discussionLate = getPollIntroMessage({ type: 'discussion', kind: 'AI' }, true);
    assert.ok(discussionLate.includes("Also it's a late post cuz I missed the set time."));

    // Fallback disclaimers
    const fallbackOnTime = getPollIntroMessage({ type: 'trivia', kind: 'fallback' }, false);
    assert.ok(fallbackOnTime.includes('preset fallback'));
    const fallbackLate = getPollIntroMessage({ type: 'trivia', kind: 'fallback' }, true);
    assert.ok(fallbackLate.includes('preset fallback') && fallbackLate.includes('late post'));

    // Mention prefix composition
    const triviaEveryone = getPollIntroMessage({ type: 'trivia', kind: 'AI' }, false, '@everyone');
    assert.strictEqual(triviaEveryone, "@everyone **Today's AI Poll!** 🧠");
    const triviaRole = getPollIntroMessage({ type: 'trivia', kind: 'AI' }, false, '<@&123456>');
    assert.strictEqual(triviaRole, "<@&123456> **Today's AI Poll!** 🧠");

    // Discord limits compliance
    const allPolls = [...FALLBACK_POLLS, ...FALLBACK_DISCUSSION_POLLS];
    for (const poll of allPolls) {
        assert.ok(poll.question && poll.question.length <= 300, `Question "${poll.question}" must not exceed 300 chars`);
        for (const option of poll.options) {
            assert.ok(option.length <= 55, `Option "${option}" exceeds Discord 55-char limit`);
        }
    }
});
