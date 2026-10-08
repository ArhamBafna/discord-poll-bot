// Consolidated poll tests: formatting, mentions, Discord limits, and catch-up scheduling
const logger = require('../utils/logger');
logger.log = () => {};

const test = require('node:test');
const assert = require('node:assert');
const { resolvePollMention, applyPollMention, describePollMention } = require('../lib/mentions');
const { getPollIntroMessage } = require('../services/polls/posting');
const { FALLBACK_POLLS, FALLBACK_DISCUSSION_POLLS } = require('../services/polls/fallbacks');
const stateManager = require('../state/manager');
const dbOperations = require('../database/operations');
const posting = require('../services/polls/posting');
const { checkForMissedPolls } = require('../services/polls/scheduling');

const ROLE_ID = '1234567890';

function fakeChannel({ id = 'channel-1', existingRoleIds = [ROLE_ID], canMentionEveryone = true } = {}) {
    const roles = new Map(existingRoleIds.map(rId => [rId, { id: rId, name: 'Fake Role' }]));
    return {
        id,
        name: `channel-${id}`,
        guild: {
            id: `guild-${id}`,
            members: { me: { id: 'bot-1' } },
            roles: { cache: roles }
        },
        permissionsFor: () => ({ has: () => canMentionEveryone }),
        send: async () => ({ id: 'posted-1' }),
        messages: { fetch: async () => { throw new Error('no prior poll to resolve'); } }
    };
}

test('polls: mention resolver degradation and formatting', () => {
    // Silence intentional mention permission warning logs during test
    const origLog = console.log;
    const origWarn = console.warn;
    console.log = () => {};
    console.warn = () => {};

    try {
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
    } finally {
        console.log = origLog;
        console.warn = origWarn;
    }
});

test('polls: intro messages and fallback compliance', () => {
    // Trivia on-time & late
    const triviaOnTime = getPollIntroMessage({ type: 'trivia', kind: 'AI' }, false);
    assert.strictEqual(triviaOnTime, "**Today's AI Poll!** 🧠");
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

    // Mention prefixes
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

test('polls: missed daily poll catch-up scheduling', async () => {
    const origLog = console.log;
    const origError = console.error;
    console.log = () => {};
    console.error = () => {};

    const AFTER_GATE_ISO = '2026-09-27T14:00:00.000Z';
    const BEFORE_GATE_ISO = '2026-09-27T03:00:00.000Z';
    const YESTERDAY_ISO = '2026-09-26T14:00:00.000Z';

    const RealDate = Date;
    function withFakeClock(iso, fn) {
        class FakeDate extends RealDate {
            constructor(...args) {
                if (args.length === 0) { super(iso); } else { super(...args); }
            }
            static now() { return new RealDate(iso).getTime(); }
        }
        globalThis.Date = FakeDate;
        return Promise.resolve().then(fn).finally(() => { globalThis.Date = RealDate; });
    }

    const fakeClient = {
        channels: { fetch: async (id) => fakeChannel({ id }) },
        guilds: {
            cache: new Map([
                ['guild-111', { id: 'guild-111' }],
                ['guild-222', { id: 'guild-222' }]
            ])
        }
    };

    let generationCalls = 0;
    let generationImpl = null;

    const originalLoadState = dbOperations.loadStateForGuild;
    const originalSaveState = dbOperations.saveStateToDB;
    const originalGetState = stateManager.getServerState;
    const originalGenerate = posting.getOrGenerateDailyPoll;
    const originalGetServer = stateManager.serverStateCache;

    dbOperations.loadStateForGuild = async () => {};
    dbOperations.saveStateToDB = async () => {};
    posting.getOrGenerateDailyPoll = async (...args) => {
        generationCalls++;
        return generationImpl(...args);
    };

    function statesByGuild(map) {
        stateManager.getServerState = (guildId) => map[guildId];
        stateManager.serverStateCache = map;
    }

    try {
        // 1. All channels posted -> zero generation
        generationCalls = 0;
        generationImpl = async () => { throw new Error('should never be called'); };
        statesByGuild({
            'guild-111': { pollChannel: '111', lastPollData: { createdAt: AFTER_GATE_ISO } },
            'guild-222': { pollChannel: '222', lastPollData: { createdAt: AFTER_GATE_ISO } }
        });
        await withFakeClock(AFTER_GATE_ISO, () => checkForMissedPolls(fakeClient));
        assert.strictEqual(generationCalls, 0);

        // 2. Both channels behind -> generated once and shared
        generationCalls = 0;
        generationImpl = async () => ({ question: 'Q?', options: ['a', 'b'], type: 'trivia', kind: 'AI' });
        statesByGuild({
            'guild-111': { pollChannel: '111', lastPollData: { createdAt: YESTERDAY_ISO } },
            'guild-222': { pollChannel: '222', lastPollData: { createdAt: YESTERDAY_ISO } }
        });
        await withFakeClock(AFTER_GATE_ISO, () => checkForMissedPolls(fakeClient));
        assert.strictEqual(generationCalls, 1);

        // 3. One channel current, one behind -> only behind channel triggers generation
        generationCalls = 0;
        generationImpl = async () => ({ question: 'Q?', options: ['a', 'b'], type: 'trivia', kind: 'AI' });
        statesByGuild({
            'guild-111': { pollChannel: '111', lastPollData: { createdAt: AFTER_GATE_ISO } },
            'guild-222': { pollChannel: '222', lastPollData: { createdAt: YESTERDAY_ISO } }
        });
        await withFakeClock(AFTER_GATE_ISO, () => checkForMissedPolls(fakeClient));
        assert.strictEqual(generationCalls, 1);

        // 4. Generation throws -> contained, no crash
        generationCalls = 0;
        generationImpl = async () => { throw new Error('AI provider exploded'); };
        statesByGuild({
            'guild-111': { pollChannel: '111', lastPollData: { createdAt: YESTERDAY_ISO } },
            'guild-222': { pollChannel: '222', lastPollData: { createdAt: YESTERDAY_ISO } }
        });
        await withFakeClock(AFTER_GATE_ISO, () => checkForMissedPolls(fakeClient));
        assert.strictEqual(generationCalls, 1);

        // 5. Restart before 6 AM NY -> no generation
        generationCalls = 0;
        generationImpl = async () => { throw new Error('should never be called'); };
        statesByGuild({
            'guild-111': { pollChannel: '111', lastPollData: { createdAt: YESTERDAY_ISO } },
            'guild-222': { pollChannel: '222', lastPollData: { createdAt: YESTERDAY_ISO } }
        });
        await withFakeClock(BEFORE_GATE_ISO, () => checkForMissedPolls(fakeClient));
        assert.strictEqual(generationCalls, 0);
    } finally {
        dbOperations.loadStateForGuild = originalLoadState;
        dbOperations.saveStateToDB = originalSaveState;
        stateManager.getServerState = originalGetState;
        stateManager.serverStateCache = originalGetServer;
        posting.getOrGenerateDailyPoll = originalGenerate;
        console.log = origLog;
        console.error = origError;
    }
});
