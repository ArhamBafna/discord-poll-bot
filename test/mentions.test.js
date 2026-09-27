// Unit tests for the shared poll-mention resolver.
//
// The resolver turns a guild's pollMention setting into the exact mention string that gets
// prefixed onto a poll, or an empty string when the poll should be silent. Every post that
// can carry a ping goes through this one function, so these tests cover the degradation
// rules: a deleted role and a missing Mention Everyone permission both produce a silent
// post rather than a dead mention or a failed poll.
//
// Run: node --test test/mentions.test.js
const assert = require('node:assert');
const { resolvePollMention, applyPollMention, describePollMention } = require('../lib/mentions');

const ROLE_ID = '1234567890';

// Minimal stand-in for the parts of a Discord channel the resolver actually reads.
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

// --- Silent by default -------------------------------------------------------------

assert.strictEqual(resolvePollMention({}, fakeChannel()), '', 'guild with no setting set is silent');
assert.strictEqual(resolvePollMention(null, fakeChannel()), '', 'null state is silent');
assert.strictEqual(resolvePollMention({ pollMention: null }, fakeChannel()), '', 'null setting is silent');
assert.strictEqual(
    resolvePollMention({ pollMention: { mode: 'none', roleId: null } }, fakeChannel()),
    '',
    'mode none is silent'
);
assert.strictEqual(
    resolvePollMention({ pollMention: { mode: 'none', roleId: ROLE_ID } }, fakeChannel()),
    '',
    'mode none ignores a leftover role id'
);

// --- everyone mode -----------------------------------------------------------------

assert.strictEqual(
    resolvePollMention({ pollMention: { mode: 'everyone' } }, fakeChannel()),
    '@everyone',
    'mode everyone pings @everyone when the bot may mention everyone'
);
assert.strictEqual(
    resolvePollMention({ pollMention: { mode: 'everyone' } }, fakeChannel({ canMentionEveryone: false })),
    '',
    'mode everyone degrades to a silent post when the bot lacks the permission'
);
assert.strictEqual(
    resolvePollMention({ pollMention: { mode: 'everyone', roleId: ROLE_ID } }, fakeChannel()),
    '@everyone',
    'mode everyone ignores any leftover role id'
);

// --- role mode ---------------------------------------------------------------------

assert.strictEqual(
    resolvePollMention({ pollMention: { mode: 'role', roleId: ROLE_ID } }, fakeChannel()),
    `<@&${ROLE_ID}>`,
    'mode role pings the chosen role'
);
assert.strictEqual(
    resolvePollMention({ pollMention: { mode: 'role', roleId: ROLE_ID } }, fakeChannel({ existingRoleIds: [] })),
    '',
    'mode role degrades to a silent post when the role no longer exists'
);
assert.strictEqual(
    resolvePollMention({ pollMention: { mode: 'role', roleId: null } }, fakeChannel()),
    '',
    'mode role with no role id is silent rather than a broken tag'
);
assert.strictEqual(
    resolvePollMention({ pollMention: { mode: 'role', roleId: ROLE_ID } }, null),
    '',
    'mode role is silent when the channel cannot be inspected to verify the role'
);

// --- Unknown / corrupt settings fall closed ----------------------------------------

assert.strictEqual(
    resolvePollMention({ pollMention: { mode: 'nonsense' } }, fakeChannel()),
    '',
    'unrecognised mode is silent'
);
assert.strictEqual(
    resolvePollMention({ pollMention: 'everyone' }, fakeChannel()),
    '',
    'a non-object setting is silent'
);

// --- applyPollMention: the single prefix-join every mentioned post goes through ---------

const INTRO = '**Special On-Demand Poll!**';
assert.strictEqual(applyPollMention(INTRO, '@everyone'), '@everyone **Special On-Demand Poll!**', 'everyone prefix is joined with one space');
assert.strictEqual(applyPollMention(INTRO, '<@&123>'), '<@&123> **Special On-Demand Poll!**', 'role prefix is joined with one space');
assert.strictEqual(applyPollMention(INTRO, ''), INTRO, 'a silent post keeps its text byte-for-byte');
assert.ok(!applyPollMention(INTRO, '').startsWith(' '), 'a silent post has no leading separator');
assert.ok(!applyPollMention(INTRO, '@everyone').endsWith('  '), 'a mentioned post has no trailing separator');
assert.strictEqual(
    applyPollMention(INTRO, resolvePollMention({ pollMention: { mode: 'role', roleId: ROLE_ID } }, fakeChannel())),
    `<@&${ROLE_ID}> **Special On-Demand Poll!**`,
    'resolve then apply composes into the expected on-demand message'
);
assert.strictEqual(
    applyPollMention(INTRO, resolvePollMention({ pollMention: { mode: 'none' } }, fakeChannel())),
    INTRO,
    'a none setting composes into a silent on-demand message'
);

// --- describePollMention: what /config view and the confirmation show ------------------

assert.strictEqual(describePollMention(null), 'Off', 'unset setting describes as Off');
assert.strictEqual(describePollMention({ mode: 'none' }), 'Off', 'none mode describes as Off');
assert.strictEqual(describePollMention({ mode: 'everyone' }), '@everyone', 'everyone mode describes as @everyone');
assert.strictEqual(describePollMention({ mode: 'role', roleId: ROLE_ID }), `<@&${ROLE_ID}>`, 'role mode describes as the role mention');
assert.strictEqual(describePollMention({ mode: 'role', roleId: null }), 'Off', 'role mode with no role describes as Off');

console.log('mentions tests passed');
